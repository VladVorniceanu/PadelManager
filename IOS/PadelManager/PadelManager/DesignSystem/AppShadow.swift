//
//  AppShadow.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import SwiftUI

extension View {
    /// Subtle lift shadow for cards on interaction.
    /// Matches `--ui-shadow-soft: 0 10px 20px rgba(15,23,42,0.08)`.
    func shadowSoft() -> some View {
        shadow(color: .black.opacity(0.08), radius: 10, x: 0, y: 5)
    }

    /// Strong elevation shadow for modals and sheets.
    /// Matches `--ui-shadow: 0 18px 45px rgba(15,23,42,0.22)`.
    func shadowStrong() -> some View {
        shadow(color: .black.opacity(0.22), radius: 22, x: 0, y: 10)
    }
}
