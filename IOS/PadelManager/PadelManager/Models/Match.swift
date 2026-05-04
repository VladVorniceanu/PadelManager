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

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.createdBy = (try? c.decodeIfPresent(String.self, forKey: .createdBy)) ?? ""
        self.tournamentId = try? c.decodeIfPresent(String.self, forKey: .tournamentId)
        self.locationId = try? c.decodeIfPresent(String.self, forKey: .locationId)
        self.courtId = try? c.decodeIfPresent(String.self, forKey: .courtId)
        self.scheduledAt = FirestoreDate.decode(from: c, key: .scheduledAt)
        self.endAt = FirestoreDate.decode(from: c, key: .endAt)
        let rawStatus = (try? c.decodeIfPresent(String.self, forKey: .status)) ?? ""
        self.status = MatchStatus(rawValue: rawStatus) ?? .draft
        self.teams = (try? c.decodeIfPresent(MatchTeams.self, forKey: .teams)) ?? MatchTeams()
        self.score = try? c.decodeIfPresent(MatchScore.self, forKey: .score)
        self.winnerTeam = try? c.decodeIfPresent(Int.self, forKey: .winnerTeam)
        self.createdAt = FirestoreDate.decode(from: c, key: .createdAt)
        self.updatedAt = FirestoreDate.decode(from: c, key: .updatedAt)
    }

    private enum CodingKeys: String, CodingKey {
        case id, createdBy, tournamentId, locationId, courtId
        case scheduledAt, endAt, status, teams, score, winnerTeam
        case createdAt, updatedAt
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

    init(team1: [String?] = [nil, nil], team2: [String?] = [nil, nil]) {
        self.team1 = team1
        self.team2 = team2
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.team1 = (try? c.decodeIfPresent([String?].self, forKey: .team1)) ?? []
        self.team2 = (try? c.decodeIfPresent([String?].self, forKey: .team2)) ?? []
    }

    private enum CodingKeys: String, CodingKey {
        case team1, team2
    }
}

struct MatchScore: Codable, Hashable {
    var sets: [SetScore]

    init(sets: [SetScore]) {
        self.sets = sets
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.sets = (try? c.decodeIfPresent([SetScore].self, forKey: .sets)) ?? []
    }

    private enum CodingKeys: String, CodingKey {
        case sets
    }
}

struct SetScore: Codable, Hashable {
    var t1: Int
    var t2: Int

    init(t1: Int, t2: Int) {
        self.t1 = t1
        self.t2 = t2
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.t1 = (try? c.decodeIfPresent(Int.self, forKey: .t1)) ?? 0
        self.t2 = (try? c.decodeIfPresent(Int.self, forKey: .t2)) ?? 0
    }

    private enum CodingKeys: String, CodingKey {
        case t1, t2
    }
}
