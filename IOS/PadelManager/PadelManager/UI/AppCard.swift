//
//  AppCard.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import SwiftUI

// MARK: - Supporting types

enum AppCardVariant {
    case `default`, error, muted
}

// MARK: - AppCard

/// Static card container. Wrap in a `Button` using `AppCardButtonStyle` to make it tappable.
struct AppCard<Content: View>: View {
    var variant: AppCardVariant = .default
    @ViewBuilder let content: () -> Content

    var body: some View {
        content()
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(AppSpacing.card)
            .background(backgroundColor)
            .clipShape(.rect(cornerRadius: AppRadius.medium))
            .overlay {
                RoundedRectangle(cornerRadius: AppRadius.medium)
                    .stroke(borderColor, lineWidth: 1)
            }
    }

    private var backgroundColor: Color {
        switch variant {
        case .default: AppColor.surface
        case .error:   AppColor.dangerBackground
        case .muted:   AppColor.surfaceMuted
        }
    }

    private var borderColor: Color {
        switch variant {
        case .default, .muted: AppColor.border
        case .error:           AppColor.dangerBorder
        }
    }
}

// MARK: - AppCardButtonStyle

/// Apply to any `Button` whose label is an `AppCard` to get the correct press animation.
struct AppCardButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.99 : 1)
            .shadow(
                color: .black.opacity(configuration.isPressed ? 0.08 : 0),
                radius: configuration.isPressed ? 10 : 0,
                y: configuration.isPressed ? 5 : 0
            )
            .animation(.easeInOut(duration: 0.12), value: configuration.isPressed)
    }
}

// MARK: - Preview

#Preview {
    ScrollView {
        VStack(spacing: AppSpacing.s3) {
            AppCard {
                VStack(alignment: .leading, spacing: AppSpacing.s2) {
                    Text("Meci programat").font(AppFont.cardTitle).foregroundStyle(AppColor.text)
                    Text("Court Central · 18:00").font(AppFont.label).foregroundStyle(AppColor.muted)
                }
            }

            Button {
            } label: {
                AppCard {
                    Text("Card interactiv (apasă-mă)").font(AppFont.bodyBold).foregroundStyle(AppColor.text)
                }
            }
            .buttonStyle(AppCardButtonStyle())

            AppCard(variant: .error) {
                Text("Eroare la încărcare").font(AppFont.bodyBold).foregroundStyle(AppColor.danger)
            }
        }
        .padding(AppSpacing.screenH)
    }
    .background(AppColor.background)
}
