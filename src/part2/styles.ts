// src/part2/styles.ts
import type * as React from "react";

export const remember: Record<string, React.CSSProperties> = {
  container: { maxWidth: 1100, margin: "0 auto", padding: 16, fontFamily: "system-ui, sans-serif" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  badge: { display: "inline-block", padding: "2px 8px", borderRadius: 999, background: "#eee" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginTop: 12 },
  card: { border: "1px solid #ddd", borderRadius: 8, padding: 12 },
  label: { display: "block", fontSize: 12, marginBottom: 4 },
  row: { display: "flex", gap: 8, alignItems: "center" },
  tableWrap: { overflowX: "auto", marginTop: 12, border: "1px solid #ddd", borderRadius: 8 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: 10, borderBottom: "1px solid #ddd", whiteSpace: "nowrap" },
  td: { padding: 10, borderBottom: "1px solid #eee", whiteSpace: "nowrap" },
  controls: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  btn: { padding: "8px 10px", borderRadius: 8, border: "1px solid #ccc", background: "white", cursor: "pointer" },
  btnPrimary: { padding: "8px 10px", borderRadius: 8, border: "1px solid #ccc", background: "#f7f7f7", cursor: "pointer" },
  error: { color: "#b00020", marginTop: 8 },
  muted: { color: "#666" },
};
