//
//  MatchDetailView.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import SwiftUI

struct MatchDetailView: View {
    let match: Match
    @Environment(DataCache.self) private var cache

    var body: some View {
        ScrollView {
            VStack(spacing: AppSpacing.s4) {
                statusCard
                teamsCard
                if let score = match.score {
                    scoreCard(score: score)
                }
            }
            .padding(.horizontal, AppSpacing.screenH)
            .padding(.vertical, AppSpacing.screenV)
        }
        .background(AppColor.background)
        .navigationTitle("Detalii meci")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            // Open from a deep link or push and the cache may be cold — warm it.
            await cache.prefetchUsers(uids: match.participantUIDs)
            await cache.loadLocations()
        }
    }

    private var statusCard: some View {
        AppCard {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: AppSpacing.s2) {
                    Text(formattedDate)
                        .font(AppFont.headline)
                        .foregroundStyle(AppColor.text)
                    if let venue = venueLabel {
                        Label(venue, systemImage: "mappin.and.ellipse")
                            .font(AppFont.label)
                            .foregroundStyle(AppColor.muted)
                    }
                }
                Spacer(minLength: 0)
                AppPill.matchStatus(match.status.rawValue)
            }
        }
    }

    /// Combines location and court names — falls back gracefully if one is missing.
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

    private var teamsCard: some View {
        AppCard {
            VStack(spacing: AppSpacing.s4) {
                Text("Echipe")
                    .font(AppFont.cardTitle)
                    .foregroundStyle(AppColor.muted)
                    .frame(maxWidth: .infinity, alignment: .leading)

                HStack(alignment: .top, spacing: AppSpacing.s4) {
                    teamColumn(title: "Echipa 1", players: match.teams.team1)
                    Divider()
                    teamColumn(title: "Echipa 2", players: match.teams.team2)
                }

                if let winner = match.winnerTeam {
                    HStack {
                        Image(systemName: "trophy.fill")
                            .foregroundStyle(AppColor.warning)
                        Text("Câștigător: Echipa \(winner)")
                            .font(AppFont.bodyBold)
                            .foregroundStyle(AppColor.text)
                    }
                    .frame(maxWidth: .infinity, alignment: .center)
                }
            }
        }
    }

    private func teamColumn(title: String, players: [String?]) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.s2) {
            Text(title)
                .font(AppFont.bodyBold)
                .foregroundStyle(AppColor.text)
            let uids = players.compactMap { $0 }.filter { !$0.isEmpty }
            if uids.isEmpty {
                HStack(spacing: AppSpacing.s2) {
                    Image(systemName: "person.crop.circle.dashed")
                        .foregroundStyle(AppColor.muted)
                    Text("Loc liber")
                        .font(AppFont.label)
                        .foregroundStyle(AppColor.muted)
                }
            } else {
                ForEach(uids, id: \.self) { uid in
                    HStack(spacing: AppSpacing.s2) {
                        Image(systemName: "person.circle.fill")
                            .foregroundStyle(AppColor.primary)
                        Text(cache.displayName(for: uid))
                            .font(AppFont.label)
                            .foregroundStyle(AppColor.text)
                            .lineLimit(1)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder
    private func scoreCard(score: MatchScore) -> some View {
        AppCard {
            VStack(spacing: AppSpacing.s3) {
                Text("Scor")
                    .font(AppFont.cardTitle)
                    .foregroundStyle(AppColor.muted)
                    .frame(maxWidth: .infinity, alignment: .leading)

                HStack(spacing: AppSpacing.s4) {
                    ForEach(Array(score.sets.enumerated()), id: \.offset) { index, set in
                        VStack(spacing: AppSpacing.s1) {
                            Text("Set \(index + 1)")
                                .font(AppFont.label)
                                .foregroundStyle(AppColor.muted)
                            Text("\(set.t1) – \(set.t2)")
                                .font(AppFont.headline)
                                .foregroundStyle(AppColor.text)
                        }
                    }
                }
            }
        }
    }

    private var formattedDate: String {
        guard let date = match.scheduledDate else { return "Dată necunoscută" }
        let formatter = DateFormatter()
        formatter.dateStyle = .long
        formatter.timeStyle = .short
        formatter.locale = Locale(identifier: "ro_RO")
        return formatter.string(from: date)
    }
}
