//
//  Court.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import Foundation

struct Court: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let isIndoor: Bool

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try c.decode(String.self, forKey: .id)
        self.name = (try? c.decodeIfPresent(String.self, forKey: .name)) ?? ""
        self.isIndoor = (try? c.decodeIfPresent(Bool.self, forKey: .isIndoor)) ?? false
    }

    private enum CodingKeys: String, CodingKey {
        case id, name, isIndoor
    }
}
