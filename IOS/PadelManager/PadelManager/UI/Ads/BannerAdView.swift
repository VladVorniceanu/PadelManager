//
//  BannerAdView.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//
//  Inline AdMob banner using Google's adaptive banner sizing:
//  - Width is taken from the host layout (GeometryReader)
//  - Height is whatever Google returns for the current orientation
//  - The view auto-reloads if the layout width changes (rotation, split view)
//
//  Test Ad Unit ID is hardcoded for development. Replace with the real
//  unit ID before release. The AdMob app identifier is read from Info.plist
//  via `GADApplicationIdentifier` and is injected at build time from the
//  Secrets.xcconfig file.
//

import SwiftUI
import GoogleMobileAds

// MARK: - BannerAdView

/// A full-width inline AdMob banner. Sizes itself adaptively to the host
/// layout's width and reports its height back via a measured frame.
struct BannerAdView: View {
    /// Google's official test banner unit. Always returns a fill ad in dev.
    static let testUnitID = "ca-app-pub-3940256099942544/2934735716"

    /// Override the unit ID (e.g. when reusing the banner for the in-list slot).
    var adUnitID: String = BannerAdView.testUnitID

    var body: some View {
        GeometryReader { geo in
            let size = currentOrientationAnchoredAdaptiveBanner(width: geo.size.width)
            BannerAdRepresentable(adUnitID: adUnitID, adSize: size)
                .frame(width: geo.size.width, height: size.size.height)
        }
        // Reserve the standard banner height so the banner doesn't push other
        // content during the first ad load. AdMob ships 50pt tall banners on
        // iPhone in portrait; the adaptive size may grow slightly on iPad.
        .frame(height: 50)
    }
}

// MARK: - UIViewRepresentable wrapper

private struct BannerAdRepresentable: UIViewRepresentable {
    let adUnitID: String
    let adSize: AdSize

    func makeUIView(context: Context) -> BannerView {
        let banner = BannerView(adSize: adSize)
        banner.adUnitID = adUnitID
        banner.delegate = context.coordinator
        banner.rootViewController = UIApplication.shared.firstKeyWindowRootViewController()
        banner.load(Request())
        return banner
    }

    func updateUIView(_ uiView: BannerView, context: Context) {
        // Only reload when the size actually changes — avoids redundant requests
        // on every SwiftUI body invalidation.
        if !CGSizeEqualToSize(adSize.size, uiView.adSize.size) {
            uiView.adSize = adSize
            uiView.load(Request())
        }
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    final class Coordinator: NSObject, BannerViewDelegate {
        func bannerViewDidReceiveAd(_ bannerView: BannerView) {
            #if DEBUG
            print("[Ads] Banner loaded — \(bannerView.adUnitID ?? "?")")
            #endif
        }

        func bannerView(_ bannerView: BannerView, didFailToReceiveAdWithError error: Error) {
            #if DEBUG
            print("[Ads] Banner failed: \(error.localizedDescription)")
            #endif
        }
    }
}

// MARK: - UIApplication helpers

private extension UIApplication {
    /// AdMob requires a root view controller for click-through presentation.
    /// Find the first active key window across all connected scenes (multi-scene safe).
    func firstKeyWindowRootViewController() -> UIViewController? {
        connectedScenes
            .compactMap { ($0 as? UIWindowScene)?.keyWindow }
            .first?
            .rootViewController
    }
}

private extension UIWindowScene {
    var keyWindow: UIWindow? { windows.first(where: { $0.isKeyWindow }) }
}

// MARK: - Preview

#Preview {
    VStack {
        Text("Conținut de deasupra")
        BannerAdView()
            .padding(.horizontal)
        Text("Conținut de dedesubt")
    }
}
