//
//  ProfileViewModel.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import Foundation

@Observable
@MainActor
final class ProfileViewModel {
    var user: AppUser?
    var stats: PlayerStats?
    var isLoading: Bool = true
    var errorMessage: String?

    private let api: APIClient
    private let cache: DataCache
    private let uid: String

    init(api: APIClient, cache: DataCache, uid: String) {
        self.api = api
        self.cache = cache
        self.uid = uid
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            async let userResult = api.getProfile(uid: uid)
            // Stats endpoint is /stats/me on the server — caller identified by bearer token.
            async let statsResult = api.getMyStats()
            user = try await userResult
            stats = try? await statsResult

            // Resolve teammate/opponent UIDs and the most-played location to human names.
            var uidsToFetch: [String] = []
            if let key = stats?.mostFrequentTeammate?.key { uidsToFetch.append(key) }
            if let key = stats?.mostFrequentOpponent?.key { uidsToFetch.append(key) }
            async let _: Void = cache.prefetchUsers(uids: uidsToFetch)
            async let _: Void = cache.loadLocations()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
