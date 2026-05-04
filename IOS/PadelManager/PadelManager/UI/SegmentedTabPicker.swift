//
//  SegmentedTabPicker.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import SwiftUI

/// Styled segmented control matching the web's `UiSegmented` component.
/// Tabs get the primary teal background when selected.
struct SegmentedTabPicker<Option: Hashable>: View {
    let options: [Option]
    let labelFor: (Option) -> String
    @Binding var selection: Option

    var body: some View {
        HStack(spacing: 0) {
            ForEach(options, id: \.self) { option in
                Button(labelFor(option)) {
                    selection = option
                }
                .font(AppFont.labelBold)
                .foregroundStyle(selection == option ? AppColor.onPrimary : AppColor.text)
                .frame(maxWidth: .infinity)
                .frame(minHeight: 40)
                .background(selection == option ? AppColor.primary : Color.clear)
                .animation(.easeInOut(duration: 0.12), value: selection)
            }
        }
        .background(AppColor.surface)
        .clipShape(.rect(cornerRadius: AppRadius.small))
        .overlay {
            RoundedRectangle(cornerRadius: AppRadius.small)
                .stroke(AppColor.border, lineWidth: 1)
        }
    }
}

// MARK: - Preview

#Preview {
    @Previewable @State var selection = "Viitoare"
    let opts = ["Viitoare", "Trecute", "Anulate"]

    SegmentedTabPicker(options: opts, labelFor: { $0 }, selection: $selection)
        .padding()
        .background(AppColor.background)
}
