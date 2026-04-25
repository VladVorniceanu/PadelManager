//
//  AppFont.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import SwiftUI

/// Typography tokens mirroring the web design system's type scale.
/// Uses SF Pro with heavy weights (Black / Heavy) to replicate the web's 800–950 font-weight identity.
enum AppFont {
    /// 22 pt · Black — page heroes and section titles
    static let title     = Font.system(size: 22, weight: .black)
    /// 17 pt · Black — card group headers
    static let headline  = Font.system(size: 17, weight: .black)
    /// 15 pt · Black — card titles
    static let cardTitle = Font.system(size: 15, weight: .black)
    /// 14 pt · Regular — body copy
    static let body      = Font.system(size: 14, weight: .regular)
    /// 14 pt · Black — emphasized body (used in card metadata rows)
    static let bodyBold  = Font.system(size: 14, weight: .black)
    /// 12 pt · Bold — labels, pills, secondary info
    static let label     = Font.system(size: 12, weight: .bold)
    /// 12 pt · Black — prominent status labels
    static let labelBold = Font.system(size: 12, weight: .black)
}
