//
//  HeroAdCard.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//
//  ── Ad Setup Instructions ────────────────────────────────────────────────────
//  See BannerAdView.swift for SDK installation steps.
//  This component shows a native ad styled as an AppCard inside a list.
//  Replace the placeholder body with the GADNativeAdView wrapper once the SDK
//  is installed.
//
//  Native Ad Unit Test ID: ca-app-pub-3940256099942544/3986624511
// ─────────────────────────────────────────────────────────────────────────────

import SwiftUI

// MARK: - HeroAdCard

/// A card-sized native ad slot that blends naturally inside match / location lists.
struct HeroAdCard: View {
    /// Test Ad Unit ID — replace before release.
    static let testUnitID = "ca-app-pub-3940256099942544/3986624511"

    var body: some View {
        // ── Placeholder ─────────────────────────────────────────────────────
        // Renders a labeled empty card so layout is preserved during development.
        // After installing the SDK, replace this with the real native ad view.
        AppCard(variant: .muted) {
            HStack(spacing: AppSpacing.s3) {
                Image(systemName: "rectangle.fill")
                    .font(.system(size: 36))
                    .foregroundStyle(AppColor.border)
                    .frame(width: 56, height: 56)
                    .background(AppColor.surface)
                    .clipShape(.rect(cornerRadius: AppRadius.small))

                VStack(alignment: .leading, spacing: AppSpacing.s1) {
                    Text("Publicitate")
                        .font(AppFont.labelBold)
                        .foregroundStyle(AppColor.muted)
                    Text("Titlu reclamă")
                        .font(AppFont.cardTitle)
                        .foregroundStyle(AppColor.text)
                    Text("Descriere reclamă sponsor")
                        .font(AppFont.label)
                        .foregroundStyle(AppColor.muted)
                }
                Spacer()
            }
        }
    }
}

// MARK: - Preview

#Preview {
    HeroAdCard()
        .padding()
        .background(AppColor.background)
}
