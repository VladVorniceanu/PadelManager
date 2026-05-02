//
//  ProfileView.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import SwiftUI

struct ProfileView: View {
    @Environment(AuthService.self) private var authService
    @Environment(APIClient.self) private var api
    @State private var vm: ProfileViewModel?

    var body: some View {
        let resolvedVM = vm ?? ProfileViewModel(api: api, uid: authService.currentUser?.uid ?? "")
        content(vm: resolvedVM)
            .onAppear { if vm == nil { vm = resolvedVM } }
            .task { await resolvedVM.load() }
            .navigationTitle("Profil")
            .navigationBarTitleDisplayMode(.large)
    }

    @ViewBuilder
    private func content(vm: ProfileViewModel) -> some View {
        ScrollView {
            VStack(spacing: AppSpacing.s4) {
                avatarSection(user: vm.user ?? authService.currentUser)

                if let error = vm.errorMessage {
                    AppCard(variant: .error) {
                        HStack(spacing: AppSpacing.s3) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundStyle(AppColor.danger)
                            Text(error)
                                .font(AppFont.label)
                                .foregroundStyle(AppColor.muted)
                            Spacer()
                        }
                    }
                }

                if vm.isLoading {
                    statsPlaceholder
                } else if let stats = vm.stats {
                    statsSection(stats: stats)
                }

                logoutSection
            }
            .padding(.horizontal, AppSpacing.screenH)
            .padding(.vertical, AppSpacing.screenV)
        }
        .background(AppColor.background)
        .refreshable { await vm.load() }
    }

    private func avatarSection(user: AppUser?) -> some View {
        AppCard {
            HStack(spacing: AppSpacing.s4) {
                ZStack {
                    Circle()
                        .fill(AppColor.primary.opacity(0.15))
                        .frame(width: 64, height: 64)
                    Text(initials(for: user?.displayName))
                        .font(.system(size: 24, weight: .black))
                        .foregroundStyle(AppColor.primary)
                }

                VStack(alignment: .leading, spacing: AppSpacing.s1) {
                    Text(user?.displayName ?? "–")
                        .font(AppFont.headline)
                        .foregroundStyle(AppColor.text)
                    Text(user?.email ?? "–")
                        .font(AppFont.label)
                        .foregroundStyle(AppColor.muted)
                    if user?.isAdmin == true {
                        AppPill(title: "Admin", variant: .success)
                    }
                }
                Spacer()
            }
        }
    }

    private func statsSection(stats: PlayerStats) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.s3) {
            Text("Statistici")
                .font(AppFont.headline)
                .foregroundStyle(AppColor.text)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: AppSpacing.s3) {
                statTile(value: "\(stats.gamesPlayed)", label: "Meciuri")
                statTile(value: "\(stats.wins)", label: "Victorii")
                statTile(value: "\(stats.losses)", label: "Înfrângeri")
                statTile(
                    value: String(format: "%.0f%%", stats.winRate * 100),
                    label: "Rata victorie"
                )
            }
        }
    }

    private func statTile(value: String, label: String) -> some View {
        AppCard {
            VStack(spacing: AppSpacing.s1) {
                Text(value)
                    .font(.system(size: 28, weight: .black))
                    .foregroundStyle(AppColor.primary)
                Text(label)
                    .font(AppFont.label)
                    .foregroundStyle(AppColor.muted)
            }
            .frame(maxWidth: .infinity)
        }
    }

    private var statsPlaceholder: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: AppSpacing.s3) {
            ForEach(0..<4, id: \.self) { _ in
                AppCard {
                    VStack(spacing: AppSpacing.s1) {
                        Text("000")
                            .font(.system(size: 28, weight: .black))
                        Text("Label")
                            .font(AppFont.label)
                    }
                    .frame(maxWidth: .infinity)
                }
                .redacted(reason: .placeholder)
            }
        }
    }

    private var logoutSection: some View {
        AppButton(
            title: "Deconectare",
            systemImage: "rectangle.portrait.and.arrow.right",
            variant: .danger,
            size: .medium,
            isFullWidth: true
        ) {
            try? authService.logout()
        }
    }

    private func initials(for name: String?) -> String {
        guard let name else { return "?" }
        let parts = name.split(separator: " ")
        return parts.prefix(2).compactMap { $0.first }.map(String.init).joined()
    }
}

#Preview {
    NavigationStack {
        ProfileView()
            .environment(AuthService())
    }
}
