//
//  Match.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import Foundation

struct Match: Codable, Identifiable, Hashable {
    let id: String
    let createdBy: String
    let tournamentId: String?
    let locationId: String?
    let courtId: String?
    let scheduledAt: String?
    let endAt: String?
    var status: MatchStatus
    var teams: MatchTeams
    var score: MatchScore?
    var winnerTeam: Int?
    let createdAt: String?
    let updatedAt: String?

    var scheduledDate: Date? {
        scheduledAt.flatMap { try? Date($0, strategy: .iso8601) }
    }

    var endDate: Date? {
        endAt.flatMap { try? Date($0, strategy: .iso8601) }
    }

    /// All participant UIDs across both teams.
    var participantUIDs: [String] {
        (teams.team1 + teams.team2).compactMap { $0 }
    }
}

enum MatchStatus: String, Codable {
    case draft, scheduled, ongoing, completed, cancelled

    var displayName: String {
        switch self {
        case .draft:     "Ciornă"
        case .scheduled: "Programat"
        case .ongoing:   "În curs"
        case .completed: "Finalizat"
        case .cancelled: "Anulat"
        }
    }
}

struct MatchTeams: Codable, Hashable {
    var team1: [String?]
    var team2: [String?]
}

struct MatchScore: Codable, Hashable {
    var sets: [SetScore]
}

struct SetScore: Codable, Hashable {
    var t1: Int
    var t2: Int
}
