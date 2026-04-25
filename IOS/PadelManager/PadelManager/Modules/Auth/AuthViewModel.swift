//
//  AuthViewModel.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import Foundation

@Observable
@MainActor
final class AuthViewModel {
    var email: String = ""
    var password: String = ""
    var displayName: String = ""
    var errorMessage: String?
    var isLoading: Bool = false

    private let authService: AuthService

    init(authService: AuthService) {
        self.authService = authService
    }

    func login() async {
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = "Completează toate câmpurile."
            return
        }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            try await authService.login(email: email, password: password)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func register() async {
        guard !email.isEmpty, !password.isEmpty, !displayName.isEmpty else {
            errorMessage = "Completează toate câmpurile."
            return
        }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            try await authService.register(email: email, password: password, displayName: displayName)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
