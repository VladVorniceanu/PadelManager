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
    let address: String
    let city: String
    var courts: [Court]
    let openHour: Int?
    let closeHour: Int?
    let createdAt: String?
    let updatedAt: String?

    var displayAddress: String { "\(address), \(city)" }
}
