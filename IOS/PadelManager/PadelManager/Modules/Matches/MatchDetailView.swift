//
//  MatchDetailView.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import SwiftUI

struct MatchDetailView: View {
    let match: Match

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
    }

    private var statusCard: some View {
        AppCard {
            HStack {
                VStack(alignment: .leading, spacing: AppSpacing.s1) {
                    Text(formattedDate)
                        .font(AppFont.headline)
                        .foregroundStyle(AppColor.text)
                    if let locationId = match.locationId {
                        Text("Locație: \(locationId)")
                            .font(AppFont.label)
                            .foregroundStyle(AppColor.muted)
                    }
                }
                Spacer()
                AppPill.matchStatus(match.status.rawValue)
            }
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
            ForEach(Array(players.compactMap { $0 }.enumerated()), id: \.offset) { _, uid in
                HStack(spacing: AppSpacing.s2) {
                    Image(systemName: "person.circle.fill")
                        .foregroundStyle(AppColor.primary)
                    Text(uid)
                        .font(AppFont.label)
                        .foregroundStyle(AppColor.muted)
                        .lineLimit(1)
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
