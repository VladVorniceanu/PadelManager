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
}
