//
//  RootView.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import SwiftUI

struct RootView: View {
    @Environment(AuthService.self) private var authService

    var body: some View {
        if authService.isAuthenticated {
            MainTabView()
        } else {
            NavigationStack {
                LoginView()
            }
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
