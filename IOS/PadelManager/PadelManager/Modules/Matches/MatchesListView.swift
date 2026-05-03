//
//  MatchesListView.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import SwiftUI

struct MatchesListView: View {
    @Environment(APIClient.self) private var api
    @Environment(DataCache.self) private var cache
    @State private var vm: MatchesViewModel?

    private let filterOptions: [MatchStatus?] = [nil, .scheduled, .ongoing, .completed, .cancelled]

    var body: some View {
        let resolvedVM = vm ?? MatchesViewModel(api: api, cache: cache)
        content(vm: resolvedVM)
            .onAppear { if vm == nil { vm = resolvedVM } }
            .task { await resolvedVM.load() }
            .navigationTitle("Meciuri")
            .navigationBarTitleDisplayMode(.large)
    }

    @ViewBuilder
    private func content(vm: MatchesViewModel) -> some View {
        VStack(spacing: 0) {
            filterBar(vm: vm)

            if vm.isLoading {
                loadingList
            } else if let error = vm.errorMessage {
                EmptyStateView(
                    title: "Eroare",
                    message: error,
                    systemImage: "exclamationmark.triangle.fill",
                    variant: .error,
                    actionTitle: "Încearcă din nou",
                    action: { Task { await vm.load() } }
                )
                .padding(AppSpacing.screenH)
            } else if vm.filteredMatches.isEmpty {
                EmptyStateView(
                    title: "Niciun meci",
                    message: "Nu există meciuri pentru filtrul selectat.",
                    systemImage: "sportscourt"
                )
                .padding(AppSpacing.screenH)
            } else {
                matchList(vm: vm)
            }
        }
        .background(AppColor.background)
        .refreshable { await vm.load() }
        .navigationDestination(for: AppDestination.self) { destination in
            switch destination {
            case .matchDetail(let match):
                MatchDetailView(match: match)
            case .matchBook:
                BookMatchView()
            default:
                EmptyView()
            }
        }
    }

    private func filterBar(vm: MatchesViewModel) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: AppSpacing.s2) {
                ForEach(filterOptions, id: \.self) { option in
                    filterChip(label: option?.displayName ?? "Toate", isSelected: vm.selectedStatus == option) {
                        vm.selectedStatus = option
                    }
                }
            }
            .padding(.horizontal, AppSpacing.screenH)
            .padding(.vertical, AppSpacing.s3)
        }
        .background(AppColor.surface)
    }

    private func filterChip(label: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(AppFont.label)
                .foregroundStyle(isSelected ? Color.white : AppColor.text)
                .padding(.horizontal, AppSpacing.s3)
                .padding(.vertical, AppSpacing.s2)
                .background(isSelected ? AppColor.primary : AppColor.surfaceMuted)
                .clipShape(.capsule)
        }
    }

    private func matchList(vm: MatchesViewModel) -> some View {
        ScrollView {
            LazyVStack(spacing: AppSpacing.s3) {
                ForEach(Array(vm.filteredMatches.enumerated()), id: \.element.id) { index, match in
                    Group {
                        if index > 0 && index % 5 == 0 {
                            HeroAdCard()
                                .padding(.horizontal, AppSpacing.screenH)
                        }
                        NavigationLink(value: AppDestination.matchDetail(match)) {
                            MatchRowCard(match: match)
                        }
                        .buttonStyle(AppCardButtonStyle())
                        .padding(.horizontal, AppSpacing.screenH)
                    }
                }
            }
            .padding(.vertical, AppSpacing.screenV)
        }
    }

    private var loadingList: some View {
        ScrollView {
            LazyVStack(spacing: AppSpacing.s3) {
                ForEach(0..<6, id: \.self) { _ in
                    AppCard {
                        VStack(alignment: .leading, spacing: AppSpacing.s2) {
                            Text("Match title placeholder")
                            Text("Date placeholder")
                        }
                    }
                    .redacted(reason: .placeholder)
                    .padding(.horizontal, AppSpacing.screenH)
                }
            }
            .padding(.vertical, AppSpacing.screenV)
        }
    }
}

#Preview {
    NavigationStack {
        MatchesListView()
    }
}
