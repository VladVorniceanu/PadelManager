//
//  AppConfig.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import Foundation

enum AppConfig {
    #if DEBUG
    static let apiBaseURL = URL(string: "http://localhost:4000/api")!
    #else
    static let apiBaseURL = URL(string: "https://your-production-domain.com/api")!
    #endif
}
