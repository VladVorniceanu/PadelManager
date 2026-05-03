//
//  HeroAdCard.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//
//  Card-styled AdMob banner used as an in-list interstitial inside the
//  matches list. Renders the same adaptive AdMob banner as `BannerAdView`,
//  wrapped in our `AppCard` chrome and topped with a small "Publicitate"
//  label so it reads as sponsored content in line with App Store
//  disclosure expectations.
//
//  The `BannerAdView` reads the Ad Unit ID and Info.plist
//  `GADApplicationIdentifier` injected at build time from Secrets.xcconfig.
//

import SwiftUI

// MARK: - HeroAdCard

struct HeroAdCard: View {
    /// Test Ad Unit ID — replace before release. Reuses the banner test unit
    /// because the matches list slot is the same standard adaptive banner
    /// shape; switch to a native ad unit if the design moves to copy/icon.
    static let testUnitID = "ca-app-pub-3940256099942544/2934735716"

    var body: some View {
        AppCard(variant: .muted) {
            VStack(alignment: .leading, spacing: AppSpacing.s2) {
                Text("Publicitate")
                    .font(AppFont.labelBold)
                    .foregroundStyle(AppColor.muted)

                BannerAdView(adUnitID: Self.testUnitID)
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
