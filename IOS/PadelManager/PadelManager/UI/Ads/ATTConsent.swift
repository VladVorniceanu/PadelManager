//
//  ATTConsent.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/25/26.
//

import Foundation
import AppTrackingTransparency

enum ATTAuthorization {
    static func requestIfNeeded() {
        guard ATTrackingManager.trackingAuthorizationStatus == .notDetermined else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            ATTrackingManager.requestTrackingAuthorization { _ in }
        }
    }
}
