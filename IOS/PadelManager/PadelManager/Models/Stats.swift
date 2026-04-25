//
//  Stats.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import Foundation

struct PlayerStats: Codable {
    let uid: String
    let gamesPlayed: Int
    let wins: Int
    let losses: Int
    let mostFrequentTeammate: StatEntry?
    let mostFrequentOpponent: StatEntry?
    let mostPlayedLocation: StatEntry?
    let updatedAt: String?

    var winRate: Double {
        gamesPlayed > 0 ? Double(wins) / Double(gamesPlayed) : 0
    }
}

struct StatEntry: Codable {
    let key: String   // uid or locationId
    let count: Int
}
