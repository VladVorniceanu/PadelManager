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
    var isLoading: Bool = false
    var errorMessage: String?

    private let api: APIClient

    init(api: APIClient) {
        self.api = api
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
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
