//
//  DataCache.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 5/3/26.
//
//  In-memory cache for users and locations so views can resolve
//  Firestore document IDs (uids, locationIds, courtIds) to human-readable
//  names without each row firing its own network request.
//
//  Mirrors the role of the Pinia stores on the web client: load locations
//  once on bootstrap, lazy-fetch users by UID with deduplication, and let
//  views pull names through synchronous lookup helpers.
//

import Foundation
import Observation
import os

private let cacheLog = Logger(
    subsystem: Bundle.main.bundleIdentifier ?? "PadelManager",
    category: "DataCache"
)

@Observable
@MainActor
final class DataCache {
    /// All locations, keyed by `id`. Populated on first call to `loadLocations`.
    private(set) var locationsById: [String: Location] = [:]

    /// Users, keyed by `uid`. Populated lazily as match rows / stats request them.
    private(set) var usersById: [String: AppUser] = [:]

    /// True after the initial locations load has completed at least once.
    private(set) var locationsLoaded: Bool = false

    private let api: APIClient

    /// Tracks in-flight user fetches so concurrent callers coalesce into one request per UID.
    private var inflightUserFetches: [String: Task<AppUser?, Never>] = [:]

    init(api: APIClient) {
        self.api = api
    }

    // MARK: - Locations

    /// Load all locations once. Subsequent calls are no-ops unless `force` is true.
    func loadLocations(force: Bool = false) async {
        if locationsLoaded && !force { return }
        do {
            let list = try await api.getLocations()
            locationsById = Dictionary(uniqueKeysWithValues: list.map { ($0.id, $0) })
            locationsLoaded = true
        } catch {
            // Soft failure: views fall back to IDs. The next caller can retry.
            cacheLog.error("loadLocations failed: \(String(describing: error))")
        }
    }

    /// Synchronous lookup. Returns nil before `loadLocations` resolves.
    func location(id: String?) -> Location? {
        guard let id else { return nil }
        return locationsById[id]
    }

    /// Resolve `(locationId, courtId)` to the embedded court (courts live inside the location doc).
    func court(locationId: String?, courtId: String?) -> Court? {
        guard let courtId, let location = location(id: locationId) else { return nil }
        return location.courts.first { $0.id == courtId }
    }

    // MARK: - Users

    /// Fetch any UIDs we don't already have, in parallel. Safe to call repeatedly —
    /// duplicates and in-flight requests are deduplicated.
    func prefetchUsers(uids: [String]) async {
        let needed = Set(uids).subtracting(usersById.keys)
        guard !needed.isEmpty else { return }

        await withTaskGroup(of: Void.self) { group in
            for uid in needed {
                group.addTask { [weak self] in
                    _ = await self?.fetchUser(uid: uid)
                }
            }
        }
    }

    /// Fetch a single user, coalescing concurrent requests for the same UID.
    @discardableResult
    func fetchUser(uid: String) async -> AppUser? {
        if let cached = usersById[uid] { return cached }
        if let inflight = inflightUserFetches[uid] {
            return await inflight.value
        }

        let task = Task<AppUser?, Never> { [api] in
            do {
                return try await api.getProfile(uid: uid)
            } catch {
                cacheLog.error("fetchUser(\(uid, privacy: .public)) failed: \(String(describing: error))")
                return nil
            }
        }
        inflightUserFetches[uid] = task

        let user = await task.value
        inflightUserFetches[uid] = nil
        if let user { usersById[uid] = user }
        return user
    }

    // MARK: - Display helpers

    /// Display name for a UID, with sensible fallbacks so views never render hash codes.
    func displayName(for uid: String?) -> String {
        guard let uid, !uid.isEmpty else { return "—" }
        if let user = usersById[uid], !user.displayName.isEmpty {
            return user.displayName
        }
        // Fallback while the prefetch is in flight or the user no longer exists.
        return "Jucător necunoscut"
    }

    /// Comma-separated names for a list of UIDs (drops nils/empties). Empty array → "?".
    func teamLabel(uids: [String?]) -> String {
        let names = uids.compactMap { uid -> String? in
            guard let uid, !uid.isEmpty else { return nil }
            return displayName(for: uid)
        }
        return names.isEmpty ? "?" : names.joined(separator: " & ")
    }

    func locationName(for id: String?) -> String? {
        location(id: id)?.name
    }

    func courtName(locationId: String?, courtId: String?) -> String? {
        court(locationId: locationId, courtId: courtId)?.name
    }

    // MARK: - Lifecycle

    /// Drop all cached state. Call on logout.
    func clear() {
        locationsById = [:]
        usersById = [:]
        locationsLoaded = false
        inflightUserFetches.values.forEach { $0.cancel() }
        inflightUserFetches = [:]
    }
}
