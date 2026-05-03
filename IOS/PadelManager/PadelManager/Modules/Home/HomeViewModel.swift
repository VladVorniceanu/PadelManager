//
//  HomeViewModel.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import Foundation

@Observable
@MainActor
final class HomeViewModel {
    var upcomingMatches: [Match] = []
    var recentMatches: [Match] = []
    var isLoading: Bool = true
    var errorMessage: String?

    private let api: APIClient
    private let cache: DataCache
    private let currentUserUID: String

    init(api: APIClient, cache: DataCache, currentUserUID: String) {
        self.api = api
        self.cache = cache
        self.currentUserUID = currentUserUID
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let all = try await api.getMatches()
            let now = Date()
            upcomingMatches = all
                .filter { $0.status == .scheduled || $0.status == .ongoing }
                .filter { ($0.scheduledDate ?? .distantPast) >= now }
                .sorted { ($0.scheduledDate ?? .distantPast) < ($1.scheduledDate ?? .distantPast) }
                .prefix(5)
                .map { $0 }
            recentMatches = all
                .filter { $0.status == .completed }
                .sorted { ($0.scheduledDate ?? .distantPast) > ($1.scheduledDate ?? .distantPast) }
                .prefix(5)
                .map { $0 }

            // Resolve all participant UIDs (both lists) and ensure locations are warm.
            // Names mutate `cache.usersById`, which is @Observable — views will re-render.
            let uids = (upcomingMatches + recentMatches).flatMap { $0.participantUIDs }
            async let _: Void = cache.prefetchUsers(uids: uids)
            async let _: Void = cache.loadLocations()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
