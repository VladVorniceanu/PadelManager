//
//  AppSpacing.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import CoreGraphics

/// Spacing scale matching the 4–24 pt CSS variable ladder (`--space-1` … `--space-6`).
enum AppSpacing {
    static let s1: CGFloat = 4
    static let s2: CGFloat = 8
    static let s3: CGFloat = 12
    static let s4: CGFloat = 16
    static let s5: CGFloat = 20
    static let s6: CGFloat = 24

    /// Card inner padding (14 pt — `--space-card`)
    static let card: CGFloat = 14
    /// Horizontal screen edge margins
    static let screenH: CGFloat = 16
    /// Vertical screen top / bottom padding
    static let screenV: CGFloat = 20
}
