//
//  RootView.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import SwiftUI

struct RootView: View {
    @Environment(AuthService.self) private var authService
    @Environment(APIClient.self) private var api
    @Environment(DataCache.self) private var cache

    var body: some View {
        Group {
            if authService.isAuthenticated {
                MainTabView()
            } else {
                NavigationStack {
                    LoginView()
                }
            }
        }
        // Bootstrap once we know the user is signed in: sync the Firestore
        // profile (POST /auth/me) and warm the locations cache. Both are
        // idempotent — re-running on every appear is cheap because DataCache
        // short-circuits a second locations load.
        .task(id: authService.currentUser?.uid) {
            guard authService.isAuthenticated else {
                cache.clear()
                return
            }
            // Fire bootstrap and locations in parallel; locations don't depend on bootstrap.
            async let bootstrap: Void = {
                if let user = try? await api.bootstrapMe() {
                    authService.currentUser = user
                }
            }()
            async let locations: Void = cache.loadLocations()
            _ = await (bootstrap, locations)
        }
    }
}

struct MainTabView: View {
    @Environment(AuthService.self) private var authService
    @Environment(APIClient.self) private var api
    @State private var showBooking = false

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            TabView {
                Tab("Acasă", systemImage: "house.fill") {
                    NavigationStack {
                        HomeView()
                    }
                }
                Tab("Meciuri", systemImage: "sportscourt.fill") {
                    NavigationStack {
                        MatchesListView()
                    }
                }
                Tab("Profil", systemImage: "person.fill") {
                    NavigationStack {
                        ProfileView()
                    }
                }
            }
            .tint(AppColor.primary)

            Button {
                showBooking = true
            } label: {
                Image(systemName: "plus")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(AppColor.onPrimary)
                    .frame(width: 56, height: 56)
                    .background(AppColor.primary)
                    .clipShape(Circle())
                    .shadowSoft()
            }
            .padding(.trailing, AppSpacing.screenH)
            .padding(.bottom, 90)
            .sheet(isPresented: $showBooking) {
                NavigationStack {
                    BookMatchView()
                        .toolbar {
                            ToolbarItem(placement: .cancellationAction) {
                                Button("Anulează") { showBooking = false }
                            }
                        }
                }
            }
        }
    }
}
