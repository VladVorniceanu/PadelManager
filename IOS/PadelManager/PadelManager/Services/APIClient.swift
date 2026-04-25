//
//  APIClient.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import Foundation
import Observation

@Observable
class APIClient {
    private let session: URLSession
    private let authService: AuthService

    init(authService: AuthService, session: URLSession = .shared) {
        self.authService = authService
        self.session = session
    }

    // MARK: - Core

    private func request<T: Decodable>(
        _ path: String,
        method: String = "GET",
        body: (any Encodable)? = nil
    ) async throws -> T {
        let url = AppConfig.apiBaseURL.appendingPathComponent(path)
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let token = try await authService.getIDToken()
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        if let body {
            req.httpBody = try JSONEncoder().encode(body)
        }

        let (data, response) = try await session.data(for: req)

        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        guard (200..<300).contains(http.statusCode) else {
            let serverError = try? JSONDecoder().decode(ServerError.self, from: data)
            throw APIError.serverError(statusCode: http.statusCode, message: serverError?.message ?? "Eroare necunoscută")
        }

        return try JSONDecoder().decode(T.self, from: data)
    }

    // MARK: - Users

    func getProfile(uid: String) async throws -> AppUser {
        try await request("users/\(uid)")
    }

    func updateProfile(uid: String, displayName: String) async throws -> AppUser {
        try await request("users/\(uid)", method: "PATCH", body: ["displayName": displayName])
    }

    // MARK: - Matches

    func getMatches() async throws -> [Match] {
        try await request("matches")
    }

    func getMatch(id: String) async throws -> Match {
        try await request("matches/\(id)")
    }

    func createMatch(body: CreateMatchBody) async throws -> Match {
        try await request("matches", method: "POST", body: body)
    }

    func updateMatchScore(id: String, score: MatchScore) async throws -> Match {
        try await request("matches/\(id)/score", method: "PATCH", body: score)
    }

    // MARK: - Locations

    func getLocations() async throws -> [Location] {
        try await request("locations")
    }

    func getLocation(id: String) async throws -> Location {
        try await request("locations/\(id)")
    }

    // MARK: - Reservations

    func getAvailability(locationId: String, courtId: String, date: String) async throws -> [AvailabilitySlot] {
        try await request("reservations/availability?locationId=\(locationId)&courtId=\(courtId)&date=\(date)")
    }

    func createReservation(body: CreateReservationBody) async throws -> Reservation {
        try await request("reservations", method: "POST", body: body)
    }

    // MARK: - Stats

    func getStats(uid: String) async throws -> PlayerStats {
        try await request("stats/\(uid)")
    }
}

// MARK: - Request bodies

struct CreateMatchBody: Encodable {
    let locationId: String
    let courtId: String
    let scheduledAt: String
    let team1: [String?]
    let team2: [String?]
}

struct CreateReservationBody: Encodable {
    let locationId: String
    let courtId: String
    let startAt: String
    let endAt: String
    let matchId: String?
}

// MARK: - Errors

enum APIError: LocalizedError {
    case invalidResponse
    case serverError(statusCode: Int, message: String)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            "Răspuns invalid de la server."
        case .serverError(_, let message):
            message
        }
    }
}

private struct ServerError: Decodable {
    let message: String
}
