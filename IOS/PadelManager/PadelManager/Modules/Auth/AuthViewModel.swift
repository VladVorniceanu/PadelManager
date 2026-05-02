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
    var emailError: String?
    var passwordError: String?
    var displayNameError: String?
    var isLoading: Bool = false

    private let authService: AuthService

    init(authService: AuthService) {
        self.authService = authService
    }

    func login() async {
        guard validateFields(includeDisplayName: false) else { return }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            try await authService.login(
                email: email.trimmingCharacters(in: .whitespaces).lowercased(),
                password: password
            )
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func register() async {
        guard validateFields(includeDisplayName: true) else { return }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            try await authService.register(
                email: email.trimmingCharacters(in: .whitespaces).lowercased(),
                password: password,
                displayName: displayName.trimmingCharacters(in: .whitespaces)
            )
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func validateFields(includeDisplayName: Bool) -> Bool {
        var valid = true

        if email.trimmingCharacters(in: .whitespaces).isEmpty {
            emailError = "Email-ul este obligatoriu."
            valid = false
        } else if !Self.isValidEmail(email) {
            emailError = "Adresa de email nu este validă."
            valid = false
        } else {
            emailError = nil
        }

        if password.isEmpty {
            passwordError = "Parola este obligatorie."
            valid = false
        } else if password.count < 6 {
            passwordError = "Parola trebuie să aibă minim 6 caractere."
            valid = false
        } else {
            passwordError = nil
        }

        if includeDisplayName {
            if displayName.trimmingCharacters(in: .whitespaces).isEmpty {
                displayNameError = "Numele este obligatoriu."
                valid = false
            } else {
                displayNameError = nil
            }
        }

        return valid
    }

    private static func isValidEmail(_ email: String) -> Bool {
        let trimmed = email.trimmingCharacters(in: .whitespaces)
        let pattern = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/
        return trimmed.wholeMatch(of: pattern) != nil
    }
}
