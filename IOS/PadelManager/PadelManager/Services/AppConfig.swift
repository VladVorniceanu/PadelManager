//
//  AppConfig.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import Foundation

enum AppConfig {
    static let apiBaseURL: URL = {
        guard let s = Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String,
              let url = URL(string: s) else {
            fatalError("API_BASE_URL missing from Info.plist — check Config/Secrets.xcconfig")
        }
        return url
    }()
}
