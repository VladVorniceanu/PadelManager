//
//  User.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import Foundation

struct AppUser: Codable, Identifiable, Hashable {
    let id: String
    let uid: String
    let email: String
    let displayName: String
    let role: UserRole
    let status: String
    let profilePicUrl: String?
    let preferredSide: String?
    let playingLevel: String?
    let preferredPosition: String?
    let preferredTime: String?
    let createdAt: String?
    let updatedAt: String?

    var isAdmin: Bool { role == .admin }

    // MARK: Identifiable
    // `id` maps directly to Firestore doc ID / Firebase UID.
}

enum UserRole: String, Codable {
    case player, admin
}
