//
//  AuthService.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import Foundation
import FirebaseAuth

@Observable
@MainActor
final class AuthService {
    var currentUser: AppUser?
    var isLoading: Bool = false

    // nonisolated(unsafe) so deinit (which is nonisolated) can access this without a data race warning
    nonisolated(unsafe) private var stateHandle: AuthStateDidChangeListenerHandle?

    init() {
        stateHandle = Auth.auth().addStateDidChangeListener { [weak self] _, firebaseUser in
            guard let self else { return }
            Task { @MainActor in
                if let firebaseUser {
                    self.currentUser = AppUser(
                        id: firebaseUser.uid,
                        uid: firebaseUser.uid,
                        email: firebaseUser.email ?? "",
                        displayName: firebaseUser.displayName ?? "",
                        role: .player,
                        status: "active",
                        profilePicUrl: nil,
                        preferredSide: nil,
                        playingLevel: nil,
                        preferredPosition: nil,
                        preferredTime: nil,
                        createdAt: nil,
                        updatedAt: nil
                    )
                } else {
                    self.currentUser = nil
                }
            }
        }
    }

    deinit {
        if let handle = stateHandle {
            Auth.auth().removeStateDidChangeListener(handle)
        }
    }

    var isAuthenticated: Bool { currentUser != nil }

    func getIDToken() async throws -> String {
        guard let user = Auth.auth().currentUser else {
            throw AuthError.notSignedIn
        }
        return try await user.getIDToken()
    }

    func login(email: String, password: String) async throws {
        isLoading = true
        defer { isLoading = false }
        try await Auth.auth().signIn(withEmail: email, password: password)
    }

    func register(email: String, password: String, displayName: String) async throws {
        isLoading = true
        defer { isLoading = false }
        let result = try await Auth.auth().createUser(withEmail: email, password: password)
        let changeRequest = result.user.createProfileChangeRequest()
        changeRequest.displayName = displayName
        try await changeRequest.commitChanges()
    }

    func logout() throws {
        try Auth.auth().signOut()
    }
}

enum AuthError: LocalizedError {
    case notSignedIn

    var errorDescription: String? {
        switch self {
        case .notSignedIn: "Nu ești autentificat."
        }
    }
}
