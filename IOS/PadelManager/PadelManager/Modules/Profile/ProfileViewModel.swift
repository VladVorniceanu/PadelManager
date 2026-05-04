//
//  ProfileViewModel.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import Foundation
import os

private let profileLog = Logger(
    subsystem: Bundle.main.bundleIdentifier ?? "PadelManager",
    category: "Profile"
)

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

    /// Load profile + stats independently — a failure on one must not hide
    /// the other. The web client uses the same pattern (separate try/catch
    /// per resource in `ProfileView.vue`).
    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        async let userResult = fetchUser()
        async let statsResult = fetchStats()
        async let locationsLoad: Void = cache.loadLocations()

        let (loadedUser, loadedStats, _) = await (userResult, statsResult, locationsLoad)
        self.user = loadedUser
        self.stats = loadedStats

        if let stats = loadedStats {
            var uidsToFetch: [String] = []
            if let key = stats.mostFrequentTeammate?.key { uidsToFetch.append(key) }
            if let key = stats.mostFrequentOpponent?.key { uidsToFetch.append(key) }
            if !uidsToFetch.isEmpty {
                await cache.prefetchUsers(uids: uidsToFetch)
            }
        }

        // Only show an error banner if EVERYTHING failed — otherwise the
        // partial data we did get is more useful than a wall of red.
        if loadedUser == nil && loadedStats == nil {
            errorMessage = "Nu am putut încărca datele profilului."
        }
    }

    private func fetchUser() async -> AppUser? {
        do { return try await api.getProfile(uid: uid) }
        catch {
            profileLog.error("getProfile failed: \(String(describing: error))")
            return nil
        }
    }

    private func fetchStats() async -> PlayerStats? {
        do { return try await api.getMyStats() }
        catch {
            profileLog.error("getMyStats failed: \(String(describing: error))")
            return nil
        }
    }
}
