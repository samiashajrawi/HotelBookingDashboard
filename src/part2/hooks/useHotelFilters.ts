// src/part2/hooks/useHotelFilters.ts
import * as React from "react";
import type { Filters, Hotel } from "../types";
import { clamp } from "../utils/helpers";

const STORAGE_KEY = "clickup_hotel_filters_v1";

function safeLoadFilters(): Partial<Filters> | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Filters>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function safeSaveFilters(filters: Filters): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // ignore
  }
}

function getQuery(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

function readFiltersFromUrl(): Partial<Filters> {
  const q = getQuery();
  const amenities = q.get("amenities");
  return {
    search: q.get("search") ?? undefined,
    priceMin: q.get("priceMin") != null ? Number(q.get("priceMin")) : undefined,
    priceMax: q.get("priceMax") != null ? Number(q.get("priceMax")) : undefined,
    minRating: q.get("minRating") != null ? Number(q.get("minRating")) : undefined,
    amenities: amenities ? amenities.split(",").filter(Boolean) : undefined,
    dateFrom: q.get("from") ?? undefined,
    dateTo: q.get("to") ?? undefined,
  };
}

function writeFiltersToUrl(filters: Filters): void {
  const q = new URLSearchParams();
  if (filters.search) q.set("search", filters.search);
  q.set("priceMin", String(filters.priceMin));
  q.set("priceMax", String(filters.priceMax));
  q.set("minRating", String(filters.minRating));
  if (filters.amenities.length) q.set("amenities", filters.amenities.join(","));
  if (filters.dateFrom) q.set("from", filters.dateFrom);
  if (filters.dateTo) q.set("to", filters.dateTo);

  const newUrl = `${window.location.pathname}?${q.toString()}`;
  window.history.replaceState(null, "", newUrl);
}

export function useHotelFilters(hotels: Hotel[]) {
  const priceBounds = React.useMemo(() => {
    const prices = hotels.map((h) => h.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [hotels]);

  const allAmenities = React.useMemo(() => {
    const set = new Set<string>();
    hotels.forEach((h) => h.amenities.forEach((a) => set.add(a)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [hotels]);

  const defaultFilters: Filters = React.useMemo(
    () => ({
      search: "",
      priceMin: priceBounds.min,
      priceMax: priceBounds.max,
      minRating: 0,
      amenities: [],
      dateFrom: "",
      dateTo: "",
    }),
    [priceBounds.min, priceBounds.max]
  );

  const [filters, setFilters] = React.useState<Filters>(() => {
    const fromUrl = readFiltersFromUrl();
    const fromStorage = safeLoadFilters();
    const merged = { ...defaultFilters, ...(fromStorage ?? {}), ...(fromUrl ?? {}) };

    return {
      ...merged,
      priceMin: clamp(Number(merged.priceMin), priceBounds.min, priceBounds.max),
      priceMax: clamp(Number(merged.priceMax), priceBounds.min, priceBounds.max),
      minRating: clamp(Number(merged.minRating), 0, 5),
      amenities: Array.isArray(merged.amenities) ? merged.amenities.filter(Boolean) : [],
      search: String(merged.search ?? ""),
      dateFrom: String(merged.dateFrom ?? ""),
      dateTo: String(merged.dateTo ?? ""),
    };
  });

  React.useEffect(() => {
    safeSaveFilters(filters);
    writeFiltersToUrl(filters);
  }, [filters]);

  const update = React.useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearAll = React.useCallback(() => setFilters(defaultFilters), [defaultFilters]);

  const activeFilterCount = React.useMemo(() => {
    let c = 0;
    if (filters.search.trim()) c += 1;
    if (filters.priceMin !== priceBounds.min || filters.priceMax !== priceBounds.max) c += 1;
    if (filters.minRating > 0) c += 1;
    if (filters.amenities.length > 0) c += 1;
    if (filters.dateFrom || filters.dateTo) c += 1;
    return c;
  }, [filters, priceBounds.min, priceBounds.max]);

  return { filters, update, clearAll, allAmenities, priceBounds, activeFilterCount };
}
