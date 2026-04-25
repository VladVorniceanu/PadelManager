//
//  AppRouter.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import Foundation

enum AppDestination: Hashable {
    case matchDetail(Match)
    case matchBook
    case locationPicker
    case profile
}
