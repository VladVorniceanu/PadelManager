//
//  AppButton.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import SwiftUI

// MARK: - Supporting types

enum AppButtonVariant {
    case primary, subtle, danger
}

enum AppButtonSize {
    case small, medium, large

    var minHeight: CGFloat {
        switch self {
        case .small:  40
        case .medium: 44
        case .large:  48
        }
    }

    var padding: EdgeInsets {
        switch self {
        case .small:  EdgeInsets(top: 8,  leading: 10, bottom: 8,  trailing: 10)
        case .medium: EdgeInsets(top: 10, leading: 12, bottom: 10, trailing: 12)
        case .large:  EdgeInsets(top: 12, leading: 14, bottom: 12, trailing: 14)
        }
    }

    var font: Font {
        switch self {
        case .small:          AppFont.labelBold
        case .medium, .large: AppFont.bodyBold
        }
    }
}

// MARK: - AppButton

struct AppButton: View {
    let title: String
    var systemImage: String?         = nil
    var variant: AppButtonVariant    = .primary
    var size: AppButtonSize          = .medium
    var isLoading: Bool              = false
    var isFullWidth: Bool            = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: AppSpacing.s2) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .tint(contentColor)
                        .controlSize(.small)
                } else if let icon = systemImage {
                    Image(systemName: icon)
                }
                Text(title)
            }
            .font(size.font)
            .frame(maxWidth: isFullWidth ? .infinity : nil)
            .frame(minHeight: size.minHeight)
            .padding(size.padding)
        }
        .buttonStyle(AppButtonStyle(variant: variant))
        .disabled(isLoading)
    }

    private var contentColor: Color {
        switch variant {
        case .primary: AppColor.onPrimary
        case .subtle:  AppColor.text
        case .danger:  AppColor.danger
        }
    }
}

// MARK: - ButtonStyle

struct AppButtonStyle: ButtonStyle {
    let variant: AppButtonVariant

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(foregroundColor)
            .background(backgroundColor(pressed: configuration.isPressed))
            .clipShape(.rect(cornerRadius: AppRadius.small))
            .overlay {
                RoundedRectangle(cornerRadius: AppRadius.small)
                    .stroke(borderColor, lineWidth: 1)
            }
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(.easeInOut(duration: 0.12), value: configuration.isPressed)
    }

    private var foregroundColor: Color {
        switch variant {
        case .primary: AppColor.onPrimary
        case .subtle:  AppColor.text
        case .danger:  AppColor.danger
        }
    }

    private func backgroundColor(pressed: Bool) -> Color {
        switch variant {
        case .primary: pressed ? AppColor.primary.opacity(0.82) : AppColor.primary
        case .subtle:  pressed ? AppColor.surfaceMuted.opacity(0.75) : AppColor.surfaceMuted
        case .danger:  pressed ? AppColor.dangerBackground.opacity(0.75) : AppColor.dangerBackground
        }
    }

    private var borderColor: Color {
        switch variant {
        case .primary: AppColor.primary
        case .subtle:  AppColor.border
        case .danger:  AppColor.dangerBorder
        }
    }
}

// MARK: - Preview

#Preview {
    VStack(spacing: AppSpacing.s3) {
        AppButton(title: "Rezervă meci", systemImage: "sportscourt.fill", action: {})
        AppButton(title: "Anulează", variant: .subtle, action: {})
        AppButton(title: "Șterge meciul", variant: .danger, size: .small, action: {})
        AppButton(title: "Se procesează…", isLoading: true, isFullWidth: true, action: {})
    }
    .padding()
    .background(AppColor.background)
}
