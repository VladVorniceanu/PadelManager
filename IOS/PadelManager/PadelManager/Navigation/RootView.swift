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

    var body: some View {
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
            Tab("Rezervă", systemImage: "plus.circle.fill") {
                NavigationStack {
                    BookMatchView()
                }
            }
            Tab("Profil", systemImage: "person.fill") {
                NavigationStack {
                    ProfileView()
                }
            }
        }
        .tint(AppColor.primary)
    }
}
