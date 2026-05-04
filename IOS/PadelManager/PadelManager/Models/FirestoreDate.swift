//
//  FirestoreDate.swift
//  PadelManager
//
//  The web client always sees dates as ISO 8601 strings because Express
//  serializes Date objects via JSON.stringify. But two server code paths
//  bypass that: `getUserProfile` does a raw Firestore spread, leaking the
//  REST shape `{_seconds, _nanoseconds}`. We accept both here so iOS models
//  can keep their ISO-string contract without breaking on raw docs.
//

import Foundation

enum FirestoreDate {
    /// Decode a date-ish field as an ISO 8601 string. Accepts:
    /// - an ISO string (already correct)
    /// - a Firestore Timestamp REST object `{_seconds, _nanoseconds}`
    /// - a numeric epoch-seconds value
    /// - missing/null → `nil`
    static func decode<K: CodingKey>(
        from container: KeyedDecodingContainer<K>,
        key: K
    ) -> String? {
        if let s = try? container.decodeIfPresent(String.self, forKey: key), !s.isEmpty {
            return s
        }
        if let stamp = try? container.decodeIfPresent(FirestoreTimestamp.self, forKey: key) {
            return stamp.iso8601String
        }
        if let secs = try? container.decodeIfPresent(Double.self, forKey: key) {
            return Date(timeIntervalSince1970: secs).iso8601String
        }
        return nil
    }
}

private struct FirestoreTimestamp: Decodable {
    let seconds: Double
    let nanoseconds: Int

    enum CodingKeys: String, CodingKey {
        case seconds = "_seconds"
        case nanoseconds = "_nanoseconds"
    }

    var iso8601String: String {
        let interval = seconds + Double(nanoseconds) / 1_000_000_000
        return Date(timeIntervalSince1970: interval).iso8601String
    }
}

private extension Date {
    var iso8601String: String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f.string(from: self)
    }
}
