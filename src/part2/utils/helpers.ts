// src/part2/utils/helpers.ts
import type { Hotel, SortField, SortOrder } from "../types";

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function parseNumber(val: string, fallback: number): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

export function compare(a: Hotel, b: Hotel, field: SortField, order: SortOrder): number {
  const dir = order === "asc" ? 1 : -1;
  const av = a[field];
  const bv = b[field];

  if (typeof av === "number" && typeof bv === "number") {
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  }
  const as = String(av).toLowerCase();
  const bs = String(bv).toLowerCase();
  if (as < bs) return -1 * dir;
  if (as > bs) return 1 * dir;
  return 0;
}

export function dateLeq(a: string, b: string): boolean {
  return a <= b; // ISO YYYY-MM-DD lexical compare
}

export function includesAllAmenities(hotelAmenities: string[], selected: string[]): boolean {
  if (selected.length === 0) return true;
  const set = new Set(hotelAmenities);
  return selected.every((a) => set.has(a));
}

export function exportCsv(hotels: Hotel[]): void {
  const header = ["id", "name", "city", "price", "rating", "amenities", "checkIn", "checkOut"];
  const rows = hotels.map((h) => [
    h.id,
    `"${h.name.replaceAll('"', '""')}"`,
    `"${h.city.replaceAll('"', '""')}"`,
    h.price,
    h.rating,
    `"${h.amenities.join("|").replaceAll('"', '""')}"`,
    h.availability.checkIn,
    h.availability.checkOut,
  ]);
  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "filtered_hotels.csv";
  a.click();

  URL.revokeObjectURL(url);
}
