"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Project, Guest } from "@/types/database";

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Roboto",
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#ec4899",
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#be185d",
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#374151",
    backgroundColor: "#fdf2f8",
    padding: 8,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 6,
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#374151",
    paddingVertical: 6,
    backgroundColor: "#f9fafb",
  },
  cell: {
    flex: 1,
    paddingHorizontal: 4,
  },
  cellSmall: {
    width: 40,
    paddingHorizontal: 4,
    textAlign: "center",
  },
  cellMedium: {
    width: 70,
    paddingHorizontal: 4,
  },
  cellLarge: {
    flex: 2,
    paddingHorizontal: 4,
  },
  bold: {
    fontWeight: "bold",
  },
  summaryBox: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    padding: 10,
    backgroundColor: "#fdf2f8",
    borderRadius: 4,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#be185d",
  },
  summaryLabel: {
    fontSize: 9,
    color: "#6b7280",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 8,
  },
  badgeConfirmed: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
  },
  badgePending: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  badgeDeclined: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  checkInBox: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: "#374151",
    marginHorizontal: "auto",
  },
});

interface GuestListReportProps {
  project: Project;
  guests: Guest[];
}

const rsvpLabels: Record<string, string> = {
  confirmed: "Xac nhan",
  pending: "Cho",
  declined: "Tu choi",
};

const getRsvpStyle = (status: string) => {
  switch (status) {
    case "confirmed":
      return styles.badgeConfirmed;
    case "declined":
      return styles.badgeDeclined;
    default:
      return styles.badgePending;
  }
};

export function GuestListReport({ project, guests }: GuestListReportProps) {
  const confirmed = guests.filter((g) => g.rsvp_status === "confirmed");
  const pending = guests.filter((g) => g.rsvp_status === "pending");

  const totalAttendees = confirmed.reduce((sum, g) => sum + (g.rsvp_count || 1), 0);

  const groupedGuests: Record<string, Guest[]> = {};
  guests.forEach((guest) => {
    const group = guest.group_name || "Khac";
    if (!groupedGuests[group]) {
      groupedGuests[group] = [];
    }
    groupedGuests[group].push(guest);
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Danh sach khach moi</Text>
          <Text style={styles.subtitle}>
            {project.name} - {new Date().toLocaleDateString("vi-VN")}
          </Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{guests.length}</Text>
            <Text style={styles.summaryLabel}>Tong khach</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{confirmed.length}</Text>
            <Text style={styles.summaryLabel}>Xac nhan</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{pending.length}</Text>
            <Text style={styles.summaryLabel}>Cho phan hoi</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalAttendees}</Text>
            <Text style={styles.summaryLabel}>Tong nguoi den</Text>
          </View>
        </View>

        {/* Guest List by Group */}
        {Object.entries(groupedGuests).map(([groupName, groupGuests]) => (
          <View key={groupName} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {groupName} ({groupGuests.length} khach)
            </Text>
            <View style={styles.headerRow}>
              <Text style={[styles.cellSmall, styles.bold]}>STT</Text>
              <Text style={[styles.cellLarge, styles.bold]}>Ho ten</Text>
              <Text style={[styles.cell, styles.bold]}>SDT</Text>
              <Text style={[styles.cellMedium, styles.bold]}>Trang thai</Text>
              <Text style={[styles.cellSmall, styles.bold]}>+1</Text>
              <Text style={[styles.cellSmall, styles.bold]}>Check</Text>
            </View>
            {groupGuests.map((guest, index) => (
              <View key={guest.id} style={styles.row}>
                <Text style={styles.cellSmall}>{index + 1}</Text>
                <Text style={styles.cellLarge}>{guest.name}</Text>
                <Text style={styles.cell}>{guest.phone || "-"}</Text>
                <View style={styles.cellMedium}>
                  <Text style={[styles.badge, getRsvpStyle(guest.rsvp_status)]}>
                    {rsvpLabels[guest.rsvp_status] || guest.rsvp_status}
                  </Text>
                </View>
                <Text style={styles.cellSmall}>{guest.rsvp_count > 1 ? `+${guest.rsvp_count - 1}` : "-"}</Text>
                <View style={styles.cellSmall}>
                  <View style={styles.checkInBox} />
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* Footer */}
        <Text style={styles.footer}>
          In ngay {new Date().toLocaleString("vi-VN")} | Task Management System
        </Text>
      </Page>
    </Document>
  );
}
