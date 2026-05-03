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
    @Environment(DataCache.self) private var cache
    @State private var vm: HomeViewModel?

    var body: some View {
        let resolvedVM = vm ?? HomeViewModel(
            api: api,
            cache: cache,
            currentUserUID: authService.currentUser?.uid ?? ""
        )
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
    @Environment(DataCache.self) private var cache

    var body: some View {
        AppCard {
            HStack(spacing: AppSpacing.s3) {
                VStack(alignment: .leading, spacing: AppSpacing.s1) {
                    Text(formattedDate)
                        .font(AppFont.cardTitle)
                        .foregroundStyle(AppColor.text)
                        .lineLimit(1)
                    Text(teamSummary)
                        .font(AppFont.label)
                        .foregroundStyle(AppColor.muted)
                        .lineLimit(2)
                    if let venue = venueLabel {
                        HStack(spacing: AppSpacing.s1) {
                            Image(systemName: "mappin.circle.fill")
                                .font(.system(size: 11))
                                .foregroundStyle(AppColor.muted)
                            Text(venue)
                                .font(AppFont.label)
                                .foregroundStyle(AppColor.muted)
                                .lineLimit(1)
                        }
                    }
                }
                Spacer(minLength: 0)
                AppPill.matchStatus(match.status.rawValue)
            }
        }
    }

    private var teamSummary: String {
        let t1 = cache.teamLabel(uids: match.teams.team1)
        let t2 = cache.teamLabel(uids: match.teams.team2)
        return "\(t1) vs \(t2)"
    }

    /// "Locație · Teren" if both resolve, else whichever is known. Nil if neither.
    private var venueLabel: String? {
        let location = cache.locationName(for: match.locationId)
        let court = cache.courtName(locationId: match.locationId, courtId: match.courtId)
        switch (location, court) {
        case let (loc?, ct?): return "\(loc) · \(ct)"
        case let (loc?, nil): return loc
        case let (nil, ct?): return ct
        default:               return nil
        }
    }

    private var formattedDate: String {
        guard let date = match.scheduledDate else { return "Dată necunoscută" }
        return Self.dateFormatter.string(from: date)
    }

    private static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .short
        f.locale = Locale(identifier: "ro_RO")
        return f
    }()
}

#Preview {
    NavigationStack {
        HomeView()
            .environment(AuthService())
    }
}
