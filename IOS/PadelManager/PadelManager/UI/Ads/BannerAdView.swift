//
//  BannerAdView.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//
//  ── Ad Setup Instructions ────────────────────────────────────────────────────
//  1. Add the Google Mobile Ads SDK via Swift Package Manager:
//     https://github.com/googleads/swift-package-manager-google-mobile-ads
//     Select product: GoogleMobileAds
//
//  2. Add to Info.plist:
//     GADApplicationIdentifier  →  your AdMob App ID (ca-app-pub-XXXXXXXX~YYYYYYYY)
//
//  3. Replace `BannerAdView.testUnitID` below with your real Ad Unit ID when releasing.
//
//  Once the SDK is installed, uncomment the `#if canImport(GoogleMobileAds)` block.
// ─────────────────────────────────────────────────────────────────────────────

import SwiftUI

// MARK: - BannerAdView

struct BannerAdView: View {
    /// Height matches the standard AdMob banner (50 pt) with a 1 pt border separator.
    static let height: CGFloat = 50
    @State private var availableWidth: CGFloat = 320 // Track width to size the adaptive banner appropriately


    /// Test Ad Unit ID — replace with real unit ID before release.
    static let testUnitID = "ca-app-pub-3940256099942544/2934735716"

    var body: some View {
        // ── Placeholder ─────────────────────────────────────────────────────
        // This renders an invisible, correctly-sized reservation in the layout.
        // After adding the Google Mobile Ads SDK, replace this body with the
        // UIViewRepresentable wrapper shown in the comment block below.
//        Color.clear
//            .frame(height: BannerAdView.height)

        // ── Real Implementation (uncomment after installing SDK) ─────────────
        // Host the banner in a GeometryReader so we can pass the current width to compute an adaptive size.
        GeometryReader { geo in
            BannerAdRepresentable(width: geo.size.width)
                .frame(width: geo.size.width, height: 50, alignment: .center) // Reserve typical banner height; adaptive banners may adjust internally
                .background(.ultraThinMaterial) // Slight material background to separate ad from content visually
                .overlay(Divider(), alignment: .top) // Subtle divider to delineate content and ad area
                .ignoresSafeArea(edges: .bottom) // Allow the banner to extend to the bottom edge safely
                .onAppear { availableWidth = geo.size.width } // Initialize width on first layout
                .onChange(of: geo.size.width) { availableWidth = $0 } // Update width as the device rotates or layout changes
        }
        .frame(height: 50, alignment: .bottom) // Constrain the GeometryReader's height so it doesn't take over t
//         BannerAdRepresentable(adUnitID: BannerAdView.testUnitID)
//             .frame(height: BannerAdView.height)
    }
}

// MARK: - UIViewRepresentable wrapper (uncomment after installing SDK)

 import GoogleMobileAds

 private struct BannerAdRepresentable: UIViewRepresentable {
     let adUnitID: String = "ca-app-pub-3940256099942544/2934735716"
     let width: CGFloat

     func makeUIView(context: Context) -> BannerView {
         let banner = BannerView(adSize: AdSizeBanner)
         banner.adUnitID = adUnitID
         banner.delegate = context.coordinator
         banner.rootViewController = UIApplication.shared.firstKeyWindowRootViewController()
         banner.load(Request())
         return banner
     }

     func updateUIView(_ uiView: BannerView, context: Context) {
         let newSize = currentOrientationAnchoredAdaptiveBanner(width: width)
         if !CGSizeEqualToSize(newSize.size, uiView.adSize.size) { // Only update and reload if the size actually changed to avoid redundant requests
             uiView.adSize = newSize // Apply the new adaptive size
             uiView.load(Request()) // Reload the banner for the new size
         }
     }

     func makeCoordinator() -> Coordinator { Coordinator() }

     // Implement the banner delegate to observe ad load results. Useful for logging, analytics,
     // or triggering UI changes when an ad loads or fails.
     final class Coordinator: NSObject, BannerViewDelegate {
         func bannerViewDidReceiveAd(_ bannerView: BannerView) { print("Banner loaded") } // Called when an ad successfully loads
         func bannerView(_ bannerView: BannerView, didFailToReceiveAdWithError error: Error) {
             print("Banner failed: \(error.localizedDescription)")
         } // Called when an ad fails to load (inspect error for details)
     }
 }

// Helper to find a root view controller for presenting from UIKit APIs. Google Mobile Ads requires
// a valid UIViewController to present clickthroughs and other full-screen content.
private extension UIApplication {
    func firstKeyWindowRootViewController() -> UIViewController? {
        connectedScenes // Support multi-scene apps (iPadOS/macOS Catalyst); find the active key window
            .compactMap { ($0 as? UIWindowScene)?.keyWindow }
            .first?
            .rootViewController
    }
}

// Convenience to get the current key window from a scene
private extension UIWindowScene {
    var keyWindow: UIWindow? { windows.first(where: { $0.isKeyWindow }) }
}

// MARK: - Preview

#Preview {
    VStack {
        Text("Conținut de deasupra")
        BannerAdView()
        Text("Conținut de dedesubt")
    }
}
