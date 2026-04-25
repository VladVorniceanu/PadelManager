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
    var isLoading: Bool = false
    var errorMessage: String?

    private let api: APIClient
    private let uid: String

    init(api: APIClient, uid: String) {
        self.api = api
        self.uid = uid
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            async let userResult = api.getProfile(uid: uid)
            async let statsResult = api.getStats(uid: uid)
            user = try await userResult
            stats = try? await statsResult
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
