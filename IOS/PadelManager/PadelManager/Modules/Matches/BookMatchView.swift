//
//  BookMatchView.swift
//  PadelManager
//
//  Created by Vlad Vorniceanu on 4/24/26.
//

import SwiftUI

private enum BookStep: Int, CaseIterable {
    case location, court, slot, confirm
    var title: String {
        switch self {
        case .location: "Locație"
        case .court:    "Teren"
        case .slot:     "Oră"
        case .confirm:  "Confirmare"
        }
    }
}

@Observable
@MainActor
private final class BookMatchViewModel {
    var step: BookStep = .location
    var locations: [Location] = []
    var selectedLocation: Location?
    var selectedCourt: Court?
    var selectedDate: Date = .now
    var availableSlots: [AvailabilitySlot] = []
    var selectedSlot: AvailabilitySlot?
    var isLoading: Bool = true
    var errorMessage: String?
    var isBooked: Bool = false

    private let api: APIClient
    private let cache: DataCache
    private let currentUserUID: String

    init(api: APIClient, cache: DataCache, currentUserUID: String) {
        self.api = api
        self.cache = cache
        self.currentUserUID = currentUserUID
    }

    func loadLocations() async {
        isLoading = true
        defer { isLoading = false }
        // Use the shared cache as the source of truth so a load here also
        // warms the home / matches lists.
        await cache.loadLocations()
        locations = cache.locationsById.values.sorted { $0.name < $1.name }
        if locations.isEmpty {
            errorMessage = "Nu s-au putut încărca locațiile."
        }
    }

    func loadSlots() async {
        guard let court = selectedCourt else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            // Server expects YYYY-MM-DD in the venue's timezone — emit in the user's calendar.
            let dateString = Self.dateFormatter.string(from: selectedDate)
            availableSlots = try await api.getAvailability(
                courtId: court.id,
                date: dateString,
                durationMinutes: 90
            )
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        return f
    }()

    func confirmBooking() async {
        guard let location = selectedLocation,
              let court = selectedCourt,
              let slot = selectedSlot else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            _ = try await api.createReservation(body: CreateReservationBody(
                locationId: location.id,
                courtId: court.id,
                startAt: slot.startAt,
                endAt: slot.endAt,
                durationMinutes: nil,
                teams: nil
            ))
            isBooked = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct BookMatchView: View {
    @Environment(AuthService.self) private var authService
    @Environment(APIClient.self) private var api
    @Environment(DataCache.self) private var cache
    @Environment(\.dismiss) private var dismiss
    @State private var vm: BookMatchViewModel?

    var body: some View {
        let resolvedVM = vm ?? BookMatchViewModel(
            api: api,
            cache: cache,
            currentUserUID: authService.currentUser?.uid ?? ""
        )
        content(vm: resolvedVM)
            .onAppear { if vm == nil { vm = resolvedVM } }
            .task { await resolvedVM.loadLocations() }
            .navigationTitle("Rezervă meci")
            .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder
    private func content(vm: BookMatchViewModel) -> some View {
        if vm.isBooked {
            bookedConfirmation
        } else {
            VStack(spacing: 0) {
                stepIndicator(current: vm.step)
                    .padding(AppSpacing.screenH)

                Divider()

                ScrollView {
                    VStack(spacing: AppSpacing.s4) {
                        switch vm.step {
                        case .location: locationStep(vm: vm)
                        case .court:    courtStep(vm: vm)
                        case .slot:     slotStep(vm: vm)
                        case .confirm:  confirmStep(vm: vm)
                        }

                        if let error = vm.errorMessage {
                            Text(error)
                                .font(AppFont.label)
                                .foregroundStyle(AppColor.danger)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.horizontal, AppSpacing.screenH)
                        }
                    }
                    .padding(.vertical, AppSpacing.screenV)
                }
                .background(AppColor.background)
            }
        }
    }

    private func stepIndicator(current: BookStep) -> some View {
        HStack(spacing: 0) {
            ForEach(BookStep.allCases, id: \.self) { step in
                let isDone = step.rawValue < current.rawValue
                let isCurrent = step == current
                VStack(spacing: AppSpacing.s1) {
                    Circle()
                        .fill(isDone || isCurrent ? AppColor.primary : AppColor.border)
                        .frame(width: 24, height: 24)
                        .overlay {
                            if isDone {
                                Image(systemName: "checkmark")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundStyle(.white)
                            } else {
                                Text("\(step.rawValue + 1)")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundStyle(isCurrent ? .white : AppColor.muted)
                            }
                        }
                    Text(step.title)
                        .font(AppFont.label)
                        .foregroundStyle(isCurrent ? AppColor.primary : AppColor.muted)
                }
                if step != BookStep.allCases.last {
                    Rectangle()
                        .fill(isDone ? AppColor.primary : AppColor.border)
                        .frame(height: 2)
                        .padding(.bottom, AppSpacing.s4)
                }
            }
        }
    }

    @ViewBuilder
    private func locationStep(vm: BookMatchViewModel) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.s3) {
            Text("Selectează locația")
                .font(AppFont.headline)
                .foregroundStyle(AppColor.text)
                .padding(.horizontal, AppSpacing.screenH)

            if vm.isLoading {
                ForEach(0..<3, id: \.self) { _ in
                    AppCard { Text("Loading location").frame(height: 44) }
                        .redacted(reason: .placeholder)
                        .padding(.horizontal, AppSpacing.screenH)
                }
            } else {
                ForEach(vm.locations) { location in
                    Button {
                        vm.selectedLocation = location
                        vm.step = .court
                    } label: {
                        AppCard {
                            HStack {
                                VStack(alignment: .leading, spacing: AppSpacing.s1) {
                                    Text(location.name)
                                        .font(AppFont.cardTitle)
                                        .foregroundStyle(AppColor.text)
                                    Text(location.displayAddress)
                                        .font(AppFont.label)
                                        .foregroundStyle(AppColor.muted)
                                }
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .foregroundStyle(AppColor.muted)
                            }
                        }
                    }
                    .buttonStyle(AppCardButtonStyle())
                    .padding(.horizontal, AppSpacing.screenH)
                }
            }
        }
    }

    @ViewBuilder
    private func courtStep(vm: BookMatchViewModel) -> some View {
        if let location = vm.selectedLocation {
            VStack(alignment: .leading, spacing: AppSpacing.s3) {
                Text("Selectează terenul")
                    .font(AppFont.headline)
                    .foregroundStyle(AppColor.text)
                    .padding(.horizontal, AppSpacing.screenH)

                ForEach(location.courts) { court in
                    Button {
                        vm.selectedCourt = court
                        vm.step = .slot
                        Task { await vm.loadSlots() }
                    } label: {
                        AppCard {
                            HStack {
                                VStack(alignment: .leading, spacing: AppSpacing.s1) {
                                    Text(court.name)
                                        .font(AppFont.cardTitle)
                                        .foregroundStyle(AppColor.text)
                                    Text(court.isIndoor ? "Interior" : "Exterior")
                                        .font(AppFont.label)
                                        .foregroundStyle(AppColor.muted)
                                }
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .foregroundStyle(AppColor.muted)
                            }
                        }
                    }
                    .buttonStyle(AppCardButtonStyle())
                    .padding(.horizontal, AppSpacing.screenH)
                }

                AppButton(title: "Înapoi", variant: .subtle, size: .medium, isFullWidth: true) {
                    vm.step = .location
                }
                .padding(.horizontal, AppSpacing.screenH)
            }
        }
    }

    @ViewBuilder
    private func slotStep(vm: BookMatchViewModel) -> some View {
        @Bindable var bindable = vm
        VStack(alignment: .leading, spacing: AppSpacing.s4) {
            VStack(alignment: .leading, spacing: AppSpacing.s3) {
                Text("Selectează data")
                    .font(AppFont.headline)
                    .foregroundStyle(AppColor.text)

                DatePicker(
                    "Data",
                    selection: $bindable.selectedDate,
                    in: Date()...,
                    displayedComponents: .date
                )
                .datePickerStyle(.graphical)
                .tint(AppColor.primary)
                .onChange(of: vm.selectedDate) {
                    Task { await vm.loadSlots() }
                }
            }
            .padding(.horizontal, AppSpacing.screenH)

            VStack(alignment: .leading, spacing: AppSpacing.s3) {
                Text("Ore disponibile")
                    .font(AppFont.headline)
                    .foregroundStyle(AppColor.text)
                    .padding(.horizontal, AppSpacing.screenH)

                if vm.isLoading {
                    ProgressView().frame(maxWidth: .infinity)
                } else if vm.availableSlots.isEmpty {
                    Text("Nu există ore disponibile pentru data selectată.")
                        .font(AppFont.body)
                        .foregroundStyle(AppColor.muted)
                        .padding(.horizontal, AppSpacing.screenH)
                } else {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 100))], spacing: AppSpacing.s2) {
                        ForEach(vm.availableSlots) { slot in
                            let isSelected = vm.selectedSlot?.id == slot.id
                            Button {
                                vm.selectedSlot = slot
                            } label: {
                                Text(slot.label)
                                    .font(AppFont.bodyBold)
                                    .foregroundStyle(isSelected ? Color.white : AppColor.text)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, AppSpacing.s3)
                                    .background(isSelected ? AppColor.primary : AppColor.surface)
                                    .clipShape(.rect(cornerRadius: AppRadius.small))
                                    .overlay {
                                        RoundedRectangle(cornerRadius: AppRadius.small)
                                            .stroke(isSelected ? AppColor.primary : AppColor.border, lineWidth: 1)
                                    }
                            }
                        }
                    }
                    .padding(.horizontal, AppSpacing.screenH)
                }
            }

            HStack(spacing: AppSpacing.s3) {
                AppButton(title: "Înapoi", variant: .subtle, size: .medium) {
                    vm.step = .court
                }
                AppButton(
                    title: "Continuă",
                    variant: .primary,
                    size: .medium,
                    isFullWidth: true
                ) {
                    if vm.selectedSlot != nil { vm.step = .confirm }
                }
            }
            .padding(.horizontal, AppSpacing.screenH)
        }
    }

    @ViewBuilder
    private func confirmStep(vm: BookMatchViewModel) -> some View {
        VStack(spacing: AppSpacing.s4) {
            AppCard {
                VStack(alignment: .leading, spacing: AppSpacing.s3) {
                    summaryRow(icon: "mappin.circle.fill", label: "Locație", value: vm.selectedLocation?.name ?? "–")
                    summaryRow(icon: "sportscourt.fill", label: "Teren", value: vm.selectedCourt?.name ?? "–")
                    summaryRow(icon: "clock.fill", label: "Oră", value: vm.selectedSlot?.label ?? "–")
                }
            }
            .padding(.horizontal, AppSpacing.screenH)

            HStack(spacing: AppSpacing.s3) {
                AppButton(title: "Înapoi", variant: .subtle, size: .medium) {
                    vm.step = .slot
                }
                AppButton(
                    title: "Confirmă",
                    variant: .primary,
                    size: .medium,
                    isLoading: vm.isLoading,
                    isFullWidth: true
                ) {
                    Task { await vm.confirmBooking() }
                }
            }
            .padding(.horizontal, AppSpacing.screenH)
        }
    }

    private func summaryRow(icon: String, label: String, value: String) -> some View {
        HStack(spacing: AppSpacing.s3) {
            Image(systemName: icon)
                .foregroundStyle(AppColor.primary)
                .frame(width: 20)
            Text(label)
                .font(AppFont.body)
                .foregroundStyle(AppColor.muted)
            Spacer()
            Text(value)
                .font(AppFont.bodyBold)
                .foregroundStyle(AppColor.text)
        }
    }

    private var bookedConfirmation: some View {
        VStack(spacing: AppSpacing.s4) {
            Spacer()
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 72))
                .foregroundStyle(AppColor.success)
            Text("Rezervare confirmată!")
                .font(AppFont.title)
                .foregroundStyle(AppColor.text)
            Text("Terenul a fost rezervat cu succes.")
                .font(AppFont.body)
                .foregroundStyle(AppColor.muted)
                .multilineTextAlignment(.center)
            AppButton(title: "Închide", variant: .primary, size: .large, isFullWidth: true) {
                dismiss()
            }
            .padding(.horizontal, AppSpacing.screenH)
            Spacer()
        }
        .background(AppColor.background)
    }
}

#Preview {
    NavigationStack {
        BookMatchView()
            .environment(AuthService())
    }
}
