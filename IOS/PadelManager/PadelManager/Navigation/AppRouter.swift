//
//  AppRouter.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import SwiftUI

enum AppDestination: Hashable {
    case matchDetail(Match)
    case matchBook
    case locationPicker
    case profile
}

// MARK: - Shared destination registration

extension View {
    /// Registers all `AppDestination` cases so any `NavigationLink(value:)` in
    /// the enclosing `NavigationStack` resolves to the right view. Apply once
    /// per stack — Home, Matches, etc. each register their own.
    func appNavigationDestinations() -> some View {
        navigationDestination(for: AppDestination.self) { destination in
            switch destination {
            case .matchDetail(let match):
                MatchDetailView(match: match)
            case .matchBook:
                BookMatchView()
            case .locationPicker, .profile:
                EmptyView()
            }
        }
    }
}
