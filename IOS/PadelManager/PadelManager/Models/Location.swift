//
//  Location.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import Foundation

struct Location: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let address: String?
    let city: String?
    var courts: [Court]
    let openHour: Int?
    let closeHour: Int?
    let createdAt: String?
    let updatedAt: String?

    var displayAddress: String {
        switch (address, city) {
        case let (a?, c?) where !a.isEmpty && !c.isEmpty: return "\(a), \(c)"
        case let (a?, _) where !a.isEmpty: return a
        case let (_, c?) where !c.isEmpty: return c
        default: return "—"
        }
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.name = (try? c.decodeIfPresent(String.self, forKey: .name)) ?? ""
        self.address = try? c.decodeIfPresent(String.self, forKey: .address)
        self.city = try? c.decodeIfPresent(String.self, forKey: .city)
        self.courts = (try? c.decodeIfPresent([Court].self, forKey: .courts)) ?? []
        self.openHour = try? c.decodeIfPresent(Int.self, forKey: .openHour)
        self.closeHour = try? c.decodeIfPresent(Int.self, forKey: .closeHour)
        self.createdAt = FirestoreDate.decode(from: c, key: .createdAt)
        self.updatedAt = FirestoreDate.decode(from: c, key: .updatedAt)
    }

    private enum CodingKeys: String, CodingKey {
        case id, name, address, city, courts, openHour, closeHour, createdAt, updatedAt
    }
}
