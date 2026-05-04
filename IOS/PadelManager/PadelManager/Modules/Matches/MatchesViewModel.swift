//
//  MatchesViewModel.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import Foundation

@Observable
@MainActor
final class MatchesViewModel {
    var allMatches: [Match] = []
    var selectedStatus: MatchStatus? = nil
    var isLoading: Bool = true
    var errorMessage: String?

    private let api: APIClient
    private let cache: DataCache

    init(api: APIClient, cache: DataCache) {
        self.api = api
        self.cache = cache
    }

    var filteredMatches: [Match] {
        guard let status = selectedStatus else { return allMatches }
        return allMatches.filter { $0.status == status }
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            allMatches = try await api.getMatches()
                .sorted { ($0.scheduledDate ?? .distantPast) > ($1.scheduledDate ?? .distantPast) }

            // Warm the cache so list rows can render display names + venue names.
            // Await the parallel prefetches so they aren't cancelled on scope exit.
            let uids = allMatches.flatMap { $0.participantUIDs }
            async let users: Void = cache.prefetchUsers(uids: uids)
            async let locations: Void = cache.loadLocations()
            _ = await (users, locations)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
