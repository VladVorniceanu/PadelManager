//
//  HomeView.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import SwiftUI

struct HomeView: View {
    @Environment(AuthService.self) private var authService
    @Environment(APIClient.self) private var api
    @State private var vm: HomeViewModel?

    var body: some View {
        let resolvedVM = vm ?? HomeViewModel(api: api, currentUserUID: authService.currentUser?.uid ?? "")
        content(vm: resolvedVM)
            .onAppear { if vm == nil { vm = resolvedVM } }
            .task { await resolvedVM.load() }
            .navigationTitle("Acasă")
            .navigationBarTitleDisplayMode(.large)
    }

    @ViewBuilder
    private func content(vm: HomeViewModel) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.s5) {
                greetingSection

                if let error = vm.errorMessage {
                    AppCard(variant: .error) {
                        HStack(spacing: AppSpacing.s3) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundStyle(AppColor.danger)
                            VStack(alignment: .leading, spacing: AppSpacing.s1) {
                                Text("Eroare la încărcare")
                                    .font(AppFont.cardTitle)
                                    .foregroundStyle(AppColor.danger)
                                Text(error)
                                    .font(AppFont.label)
                                    .foregroundStyle(AppColor.muted)
                            }
                            Spacer()
                        }
                    }
                    .padding(.horizontal, AppSpacing.screenH)
                }

                BannerAdView()
                    .padding(.horizontal, AppSpacing.screenH)

                matchSection(
                    title: "Meciuri viitoare",
                    matches: vm.upcomingMatches,
                    isLoading: vm.isLoading,
                    emptyIcon: "calendar.badge.clock",
                    emptyTitle: "Niciun meci programat",
                    emptyDescription: "Rezervă un teren și creează un meci nou."
                )

                matchSection(
                    title: "Meciuri recente",
                    matches: vm.recentMatches,
                    isLoading: vm.isLoading,
                    emptyIcon: "clock.arrow.circlepath",
                    emptyTitle: "Niciun meci recent",
                    emptyDescription: "Meciurile finalizate vor apărea aici."
                )
            }
            .padding(.vertical, AppSpacing.screenV)
        }
        .background(AppColor.background)
        .refreshable { await vm.load() }
    }

    private var greetingSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.s1) {
            Text("Bună ziua,")
                .font(AppFont.body)
                .foregroundStyle(AppColor.muted)
            Text(authService.currentUser?.displayName ?? "Jucător")
                .font(AppFont.title)
                .foregroundStyle(AppColor.text)
        }
        .padding(.horizontal, AppSpacing.screenH)
    }

    @ViewBuilder
    private func matchSection(
        title: String,
        matches: [Match],
        isLoading: Bool,
        emptyIcon: String,
        emptyTitle: String,
        emptyDescription: String
    ) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.s3) {
            Text(title)
                .font(AppFont.headline)
                .foregroundStyle(AppColor.text)
                .padding(.horizontal, AppSpacing.screenH)

            if isLoading {
                matchCardPlaceholder
            } else if matches.isEmpty {
                EmptyStateView(
                    title: emptyTitle,
                    message: emptyDescription,
                    systemImage: emptyIcon
                )
                .padding(.horizontal, AppSpacing.screenH)
            } else {
                VStack(spacing: AppSpacing.s3) {
                    ForEach(matches) { match in
                        NavigationLink(value: AppDestination.matchDetail(match)) {
                            MatchRowCard(match: match)
                        }
                        .buttonStyle(AppCardButtonStyle())
                        .padding(.horizontal, AppSpacing.screenH)
                    }
                }
            }
        }
    }

    private var matchCardPlaceholder: some View {
        VStack(spacing: AppSpacing.s3) {
            ForEach(0..<3, id: \.self) { _ in
                AppCard {
                    VStack(alignment: .leading, spacing: AppSpacing.s2) {
                        Text("Loading match title")
                        Text("Loading date info")
                    }
                }
                .redacted(reason: .placeholder)
                .padding(.horizontal, AppSpacing.screenH)
            }
        }
    }
}

struct MatchRowCard: View {
    let match: Match

    var body: some View {
        AppCard {
            HStack {
                VStack(alignment: .leading, spacing: AppSpacing.s1) {
                    Text(formattedDate)
                        .font(AppFont.cardTitle)
                        .foregroundStyle(AppColor.text)
                    Text(teamSummary)
                        .font(AppFont.label)
                        .foregroundStyle(AppColor.muted)
                }
                Spacer()
                AppPill.matchStatus(match.status.rawValue)
            }
        }
    }

    private var teamSummary: String {
        let t1 = match.teams.team1.compactMap { $0 }
        let t2 = match.teams.team2.compactMap { $0 }
        let t1Label = t1.isEmpty ? "?" : t1.map { String($0.prefix(8)) }.joined(separator: ", ")
        let t2Label = t2.isEmpty ? "?" : t2.map { String($0.prefix(8)) }.joined(separator: ", ")
        return "\(t1Label) vs \(t2Label)"
    }

    private var formattedDate: String {
        guard let date = match.scheduledDate else { return "Dată necunoscută" }
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        formatter.locale = Locale(identifier: "ro_RO")
        return formatter.string(from: date)
    }
}

#Preview {
    NavigationStack {
        HomeView()
            .environment(AuthService())
    }
}
