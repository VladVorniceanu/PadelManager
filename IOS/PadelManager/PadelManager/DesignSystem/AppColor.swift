//
//  AppColor.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import SwiftUI

/// Semantic color tokens backed by the asset catalog.
/// Light / dark variants are resolved automatically by iOS.
enum AppColor {

    // MARK: - Brand
    static let primary    = Color("AppPrimary")
    static let onPrimary  = Color.white

    // MARK: - Backgrounds
    static let background   = Color("AppBackground")
    static let surface      = Color("AppSurface")
    static let surfaceMuted = Color("AppSurfaceMuted")

    // MARK: - Text
    static let text  = Color("AppText")
    static let muted = Color("AppMuted")

    // MARK: - Structure
    static let border  = Color("AppBorder")
    static let overlay = Color("AppOverlay")

    // MARK: - State: Danger
    static let danger           = Color("AppDanger")
    static let dangerBackground = Color("AppDangerBackground")
    static let dangerBorder     = Color("AppDangerBorder")

    // MARK: - State: Warning
    static let warning           = Color("AppWarning")
    static let warningBackground = Color("AppWarningBackground")

    // MARK: - State: Success
    static let success           = Color("AppSuccess")
    static let successBackground = Color("AppSuccessBackground")
}
