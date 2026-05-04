//
//  PadelManagerApp.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import SwiftUI
import FirebaseCore

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        Self.configureFirebaseIfNeeded()
        return true
    }

    static func configureFirebaseIfNeeded() {
        guard FirebaseApp.app() == nil else { return }
        FirebaseApp.configure()
    }
}

@main
struct PadelManagerApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    private let authService: AuthService
    private let apiClient: APIClient
    private let dataCache: DataCache

    init() {
        AppDelegate.configureFirebaseIfNeeded()
        let auth = AuthService()
        let api = APIClient(authService: auth)
        authService = auth
        apiClient = api
        dataCache = DataCache(api: api)
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(authService)
                .environment(apiClient)
                .environment(dataCache)
        }
    }
}
