//
//  EmptyStateView.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import SwiftUI

/// Wraps `ContentUnavailableView` for empty and error states across the app.
struct EmptyStateView: View {
    let title: String
    var message: String?      = nil
    var systemImage: String   = "tray"
    var variant: Variant      = .empty
    var actionTitle: String?  = nil
    var action: (() -> Void)? = nil

    enum Variant { case empty, error }

    var body: some View {
        ContentUnavailableView {
            Label(title, systemImage: systemImage)
                .foregroundStyle(variant == .error ? AppColor.danger : AppColor.muted)
        } description: {
            if let msg = message {
                Text(msg)
                    .font(AppFont.label)
                    .foregroundStyle(AppColor.muted)
            }
        } actions: {
            if let title = actionTitle, let action {
                AppButton(title: title, variant: variant == .error ? .danger : .subtle, action: action)
            }
        }
    }
}

// MARK: - Preview

#Preview {
    VStack(spacing: AppSpacing.s6) {
        EmptyStateView(
            title: "Niciun meci",
            message: "Nu ai niciun meci programat.",
            systemImage: "sportscourt",
            actionTitle: "Rezervă un meci",
            action: {}
        )
        EmptyStateView(
            title: "Eroare la încărcare",
            message: "Nu s-a putut conecta la server.",
            systemImage: "wifi.slash",
            variant: .error,
            actionTitle: "Încearcă din nou",
            action: {}
        )
    }
    .background(AppColor.background)
}
