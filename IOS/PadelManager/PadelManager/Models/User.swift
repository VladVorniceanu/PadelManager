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
}

enum UserRole: String, Codable {
    case player, admin
}

// MARK: - Resilient decoder
//
// The server has two code paths for user data: `mapUser` (clean ISO strings,
// default role/status) for `/auth/me`, and a raw Firestore spread for
// `/users/profile/:id`. The raw path returns Firestore Timestamp objects
// (`{_seconds, _nanoseconds}`) and may omit `role`/`status` on legacy docs.
// Strict Codable failed the entire decode in those cases — every name lookup
// and the profile screen broke. This init absorbs the variance so views
// always get something usable.
extension AppUser {
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.uid = (try? c.decodeIfPresent(String.self, forKey: .uid)) ?? self.id
        self.email = (try? c.decodeIfPresent(String.self, forKey: .email)) ?? ""
        self.displayName = (try? c.decodeIfPresent(String.self, forKey: .displayName)) ?? ""
        let rawRole = (try? c.decodeIfPresent(String.self, forKey: .role)) ?? ""
        self.role = UserRole(rawValue: rawRole) ?? .player
        self.status = (try? c.decodeIfPresent(String.self, forKey: .status)) ?? "active"
        self.profilePicUrl = try? c.decodeIfPresent(String.self, forKey: .profilePicUrl)
        self.preferredSide = try? c.decodeIfPresent(String.self, forKey: .preferredSide)
        self.playingLevel = try? c.decodeIfPresent(String.self, forKey: .playingLevel)
        self.preferredPosition = try? c.decodeIfPresent(String.self, forKey: .preferredPosition)
        self.preferredTime = try? c.decodeIfPresent(String.self, forKey: .preferredTime)
        self.createdAt = FirestoreDate.decode(from: c, key: .createdAt)
        self.updatedAt = FirestoreDate.decode(from: c, key: .updatedAt)
    }

    private enum CodingKeys: String, CodingKey {
        case id, uid, email, displayName, role, status
        case profilePicUrl, preferredSide, playingLevel, preferredPosition, preferredTime
        case createdAt, updatedAt
    }
}
