//
//  AppTextField.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import SwiftUI

// MARK: - AppTextField

struct AppTextField: View {
    let label: String
    @Binding var text: String
    var isSecure: Bool           = false
    var keyboardType: UIKeyboardType = .default
    var textContentType: UITextContentType? = nil
    var errorMessage: String?    = nil
    var isDisabled: Bool         = false

    @FocusState private var isFocused: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.s1) {
            Group {
                if isSecure {
                    SecureField(label, text: $text)
                } else {
                    TextField(label, text: $text)
                        .keyboardType(keyboardType)
                        .textInputAutocapitalization(keyboardType == .emailAddress ? .never : .sentences)
                        .autocorrectionDisabled(keyboardType == .emailAddress)
                }
            }
            .font(AppFont.body)
            .foregroundStyle(AppColor.text)
            .frame(minHeight: 44)
            .padding(.horizontal, 12)
            .background(AppColor.surface)
            .clipShape(.rect(cornerRadius: AppRadius.small))
            .overlay {
                RoundedRectangle(cornerRadius: AppRadius.small)
                    .stroke(borderColor, lineWidth: 1)
            }
            .textContentType(textContentType)
            .focused($isFocused)
            .disabled(isDisabled)
            .animation(.easeInOut(duration: 0.15), value: isFocused)

            if let error = errorMessage {
                Text(error)
                    .font(AppFont.label)
                    .foregroundStyle(AppColor.danger)
            }
        }
    }

    private var borderColor: Color {
        if errorMessage != nil { return AppColor.dangerBorder }
        return isFocused ? AppColor.primary : AppColor.border
    }
}

// MARK: - Preview

#Preview {
    @Previewable @State var email = ""
    @Previewable @State var password = ""

    VStack(spacing: AppSpacing.s3) {
        AppTextField(label: "Email", text: $email, keyboardType: .emailAddress)
        AppTextField(label: "Parolă", text: $password, isSecure: true)
        AppTextField(label: "Email invalid", text: $email, errorMessage: "Adresa de email nu este validă.")
    }
    .padding()
    .background(AppColor.background)
}
