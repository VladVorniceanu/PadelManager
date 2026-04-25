//
//  PadelManagerApp.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import SwiftUI
import FirebaseCore

@main
struct PadelManagerApp: App {
    private let authService: AuthService

    init() {
        FirebaseApp.configure()
        authService = AuthService()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(authService)
                .environment(APIClient(authService: authService))
        }
    }
}
