//
//  Reservation.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import Foundation

struct Reservation: Codable, Identifiable, Hashable {
    let id: String
    let createdBy: String
    let locationId: String?
    let courtId: String?
    let startAt: String?
    let endAt: String?
    let matchId: String?
    let status: String
    let createdAt: String?
    let updatedAt: String?

    var startDate: Date? { startAt.flatMap { try? Date($0, strategy: .iso8601) } }
    var endDate: Date?   { endAt.flatMap   { try? Date($0, strategy: .iso8601) } }
}

// MARK: - Availability slot (from GET /reservations/availability)

struct AvailabilitySlot: Codable, Identifiable, Hashable {
    let label: String   // "HH:MM"
    let startAt: String
    let endAt: String

    var id: String { startAt }

    var startDate: Date? { try? Date(startAt, strategy: .iso8601) }
}

// Server returns a wrapper object; `slots` contains the actual array.
struct AvailabilityResponse: Decodable {
    let slots: [AvailabilitySlot]
}
