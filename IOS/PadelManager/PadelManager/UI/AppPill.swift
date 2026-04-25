//
//  AppPill.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import SwiftUI

// MARK: - Supporting types

enum AppPillVariant {
    case neutral, primary, success, warning, danger

    var foreground: Color {
        switch self {
        case .neutral: AppColor.text
        case .primary: AppColor.primary
        case .success: AppColor.success
        case .warning: AppColor.warning
        case .danger:  AppColor.danger
        }
    }

    var background: Color {
        switch self {
        case .neutral: AppColor.surfaceMuted
        case .primary: AppColor.primary.opacity(0.12)
        case .success: AppColor.successBackground
        case .warning: AppColor.warningBackground
        case .danger:  AppColor.dangerBackground
        }
    }

    var border: Color {
        switch self {
        case .neutral: AppColor.border
        case .primary: AppColor.primary.opacity(0.3)
        case .success: AppColor.success.opacity(0.3)
        case .warning: AppColor.warning.opacity(0.3)
        case .danger:  AppColor.dangerBorder
        }
    }
}

// MARK: - AppPill

struct AppPill: View {
    let title: String
    var variant: AppPillVariant = .neutral
    var systemImage: String?    = nil

    var body: some View {
        HStack(spacing: 4) {
            if let icon = systemImage {
                Image(systemName: icon)
            }
            Text(title)
        }
        .font(AppFont.labelBold)
        .foregroundStyle(variant.foreground)
        .padding(.horizontal, 10)
        .frame(height: 24)
        .background(variant.background)
        .clipShape(Capsule())
        .overlay {
            Capsule().stroke(variant.border, lineWidth: 1)
        }
    }
}

// MARK: - Convenience factory for match status

extension AppPill {
    static func matchStatus(_ status: String) -> AppPill {
        switch status.lowercased() {
        case "scheduled": AppPill(title: "Programat",  variant: .neutral,  systemImage: "clock")
        case "ongoing":   AppPill(title: "În curs",    variant: .primary,  systemImage: "sportscourt.fill")
        case "completed": AppPill(title: "Finalizat",  variant: .success,  systemImage: "checkmark.circle")
        case "cancelled": AppPill(title: "Anulat",     variant: .danger,   systemImage: "xmark.circle")
        default:          AppPill(title: status,       variant: .neutral)
        }
    }
}

// MARK: - Preview

#Preview {
    HStack(spacing: AppSpacing.s2) {
        AppPill(title: "Programat", variant: .neutral, systemImage: "clock")
        AppPill(title: "În curs",   variant: .primary, systemImage: "sportscourt.fill")
        AppPill(title: "Finalizat", variant: .success, systemImage: "checkmark.circle")
        AppPill(title: "Anulat",    variant: .danger,  systemImage: "xmark.circle")
    }
    .padding()
    .background(AppColor.background)
}
