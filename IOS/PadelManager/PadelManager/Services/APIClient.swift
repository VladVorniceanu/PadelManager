//
//  APIClient.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import Foundation
import Observation
import os

private let networkLog = Logger(
    subsystem: Bundle.main.bundleIdentifier ?? "PadelManager",
    category: "Network"
)

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

        Self.logRequest(req)
        let start = CFAbsoluteTimeGetCurrent()

        let (data, response) = try await session.data(for: req)
        let elapsed = (CFAbsoluteTimeGetCurrent() - start) * 1000

        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        Self.logResponse(http, data: data, elapsed: elapsed)

        guard (200..<300).contains(http.statusCode) else {
            let serverError = try? JSONDecoder().decode(ServerError.self, from: data)
            throw APIError.serverError(statusCode: http.statusCode, message: serverError?.message ?? "Eroare necunoscută")
        }

        return try JSONDecoder().decode(T.self, from: data)
    }

    // MARK: - Logging

    private static func logRequest(_ request: URLRequest) {
        let method = request.httpMethod ?? "?"
        let url = request.url?.absoluteString ?? "?"
        var parts = ["--> \(method) \(url)"]
        if let headers = request.allHTTPHeaderFields?.filter({ $0.key != "Authorization" }), !headers.isEmpty {
            parts.append("    Headers: \(headers)")
        }
        if let body = request.httpBody, let str = String(data: body, encoding: .utf8) {
            parts.append("    Body: \(str)")
        }
        networkLog.info("\(parts.joined(separator: "\n"))")
    }

    private static func logResponse(_ response: HTTPURLResponse, data: Data, elapsed: Double) {
        let url = response.url?.absoluteString ?? "?"
        let status = response.statusCode
        var parts = ["<-- \(status) \(url) (\(String(format: "%.0f", elapsed))ms)"]
        if let str = String(data: data, encoding: .utf8) {
            let body = str.count > 2000 ? String(str.prefix(2000)) + "...[truncated]" : str
            parts.append("    Body: \(body)")
        }
        if (200..<300).contains(status) {
            networkLog.info("\(parts.joined(separator: "\n"))")
        } else {
            networkLog.error("\(parts.joined(separator: "\n"))")
        }
    }

    // MARK: - Auth

    /// Bootstrap or refresh the current user's Firestore profile from the ID token.
    /// Mirrors `POST /auth/me` used by the web client.
    func bootstrapMe() async throws -> AppUser {
        try await request("auth/me", method: "POST")
    }

    // MARK: - Users

    func getProfile(uid: String) async throws -> AppUser {
        // Server route: GET /users/profile/:id
        try await request("users/profile/\(uid)")
    }

    func updateProfile(uid: String, displayName: String) async throws -> AppUser {
        try await request("users/\(uid)", method: "PATCH", body: ["displayName": displayName])
    }

    /// Search players by display name. Mirrors `GET /users/search?q=&limit=`.
    func searchUsers(query: String, limit: Int = 10) async throws -> [AppUser] {
        let q = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        return try await request("users/search?q=\(q)&limit=\(limit)")
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

    /// Server uses a single `PATCH /matches/:id` with a generic patch body for all fields.
    func updateMatchScore(id: String, score: MatchScore) async throws -> Match {
        try await request("matches/\(id)", method: "PATCH", body: ScorePatch(score: score))
    }

    // MARK: - Locations

    func getLocations() async throws -> [Location] {
        try await request("locations")
    }

    func getLocation(id: String) async throws -> Location {
        try await request("locations/\(id)")
    }

    // MARK: - Reservations

    /// Mirrors `GET /reservations/availability?courtId=&date=YYYY-MM-DD&durationMinutes=`.
    /// Server does not use `locationId` — the court ID is enough.
    func getAvailability(courtId: String, date: String, durationMinutes: Int = 90) async throws -> [AvailabilitySlot] {
        try await request(
            "reservations/availability?courtId=\(courtId)&date=\(date)&durationMinutes=\(durationMinutes)"
        )
    }

    func createReservation(body: CreateReservationBody) async throws -> Reservation {
        try await request("reservations", method: "POST", body: body)
    }

    // MARK: - Stats

    /// Server route: `GET /stats/me` — caller is identified via the bearer token, no UID param.
    func getMyStats() async throws -> PlayerStats {
        try await request("stats/me")
    }
}

// MARK: - Internal body wrappers

private struct ScorePatch: Encodable {
    let score: MatchScore
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
