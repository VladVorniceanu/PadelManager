//
//  RegisterView.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import SwiftUI

struct RegisterView: View {
    @Environment(AuthService.self) private var authService
    @Environment(\.dismiss) private var dismiss
    @State private var vm: AuthViewModel?

    var body: some View {
        let resolvedVM = vm ?? AuthViewModel(authService: authService)
        content(vm: resolvedVM)
            .onAppear { if vm == nil { vm = resolvedVM } }
            .navigationTitle("Cont nou")
            .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder
    private func content(vm: AuthViewModel) -> some View {
        ScrollView {
            VStack(spacing: AppSpacing.s4) {
                AppTextField(
                    label: "Nume afișat",
                    text: Binding(get: { vm.displayName }, set: { vm.displayName = $0 }),
                    textContentType: .name,
                    errorMessage: vm.displayNameError
                )
                AppTextField(
                    label: "Email",
                    text: Binding(get: { vm.email }, set: { vm.email = $0 }),
                    keyboardType: .emailAddress,
                    textContentType: .emailAddress,
                    errorMessage: vm.emailError
                )
                AppTextField(
                    label: "Parolă",
                    text: Binding(get: { vm.password }, set: { vm.password = $0 }),
                    isSecure: true,
                    textContentType: .newPassword,
                    errorMessage: vm.passwordError
                )

                if let error = vm.errorMessage {
                    Text(error)
                        .font(AppFont.label)
                        .foregroundStyle(AppColor.danger)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                AppButton(
                    title: "Creează cont",
                    variant: .primary,
                    size: .large,
                    isLoading: vm.isLoading,
                    isFullWidth: true
                ) {
                    Task { await vm.register() }
                }

                Button("Ai deja cont? Autentifică-te") {
                    dismiss()
                }
                .font(AppFont.body)
                .foregroundStyle(AppColor.muted)
            }
            .padding(.horizontal, AppSpacing.screenH)
            .padding(.vertical, AppSpacing.screenV)
        }
        .background(AppColor.background)
    }
}

#Preview {
    NavigationStack {
        RegisterView()
            .environment(AuthService())
    }
}
