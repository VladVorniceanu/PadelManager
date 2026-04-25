//
//  LoginView.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import SwiftUI

struct LoginView: View {
    @Environment(AuthService.self) private var authService
    @State private var vm: AuthViewModel?
    @State private var showRegister = false

    var body: some View {
        Group {
            if let vm {
                content(vm: vm)
            }
        }
        .task {
            vm = AuthViewModel(authService: authService)
        }
    }

    @ViewBuilder
    private func content(vm: AuthViewModel) -> some View {
        ScrollView {
            VStack(spacing: AppSpacing.s6) {
                heroHeader

                VStack(spacing: AppSpacing.s4) {
                    AppTextField(
                        label: "Email",
                        text: Binding(get: { vm.email }, set: { vm.email = $0 }),
                        keyboardType: .emailAddress,
                        textContentType: .emailAddress
                    )
                    AppTextField(
                        label: "Parolă",
                        text: Binding(get: { vm.password }, set: { vm.password = $0 }),
                        isSecure: true,
                        textContentType: .password
                    )

                    if let error = vm.errorMessage {
                        Text(error)
                            .font(AppFont.label)
                            .foregroundStyle(AppColor.danger)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    AppButton(
                        title: "Autentifică-te",
                        variant: .primary,
                        size: .large,
                        isLoading: vm.isLoading,
                        isFullWidth: true
                    ) {
                        Task { await vm.login() }
                    }
                }

                HStack {
                    Text("Nu ai cont?")
                        .font(AppFont.body)
                        .foregroundStyle(AppColor.muted)
                    Button("Înregistrează-te") {
                        showRegister = true
                    }
                    .font(AppFont.bodyBold)
                    .foregroundStyle(AppColor.primary)
                }
            }
            .padding(.horizontal, AppSpacing.screenH)
            .padding(.vertical, AppSpacing.screenV)
        }
        .background(AppColor.background)
        .navigationDestination(isPresented: $showRegister) {
            RegisterView()
        }
    }

    private var heroHeader: some View {
        VStack(spacing: AppSpacing.s2) {
            Image(systemName: "tennisball.fill")
                .font(.system(size: 48))
                .foregroundStyle(AppColor.primary)

            Text("Padel Manager")
                .font(AppFont.title)
                .foregroundStyle(AppColor.text)

            Text("Rezervă, joacă, câștigă.")
                .font(AppFont.body)
                .foregroundStyle(AppColor.muted)
        }
        .padding(.top, AppSpacing.s6)
    }
}

#Preview {
    NavigationStack {
        LoginView()
            .environment(AuthService())
    }
}
