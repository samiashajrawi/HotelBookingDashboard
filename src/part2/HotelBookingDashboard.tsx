// src/part2/HotelBookingDashboard.tsx
import * as React from "react";
import type { SortField, SortSpec } from "./types";
import { HOTELS } from "./seedHotels";
import { remember } from "./styles";
import { useDebounce } from "./hooks/useDebounce";
import { useHotelFilters } from "./hooks/useHotelFilters";
import { clamp, compare, dateLeq, exportCsv, includesAllAmenities, parseNumber } from "./utils/helpers";
import { HotelRow } from "./components/HotelRow";

export default function HotelBookingDashboard() {
  const hotels = HOTELS;

  const { filters, update, clearAll, allAmenities, priceBounds, activeFilterCount } =
    useHotelFilters(hotels);

  const [sort, setSort] = React.useState<SortSpec>({
    primary: { field: "price", order: "asc" },
    secondary: { field: "rating", order: "desc" },
  });

  const [page, setPage] = React.useState<number>(1);
  const pageSize = 10;

  const debouncedSearch = useDebounce(filters.search, 300);
  const isSearching = debouncedSearch !== filters.search;

  const dateError = React.useMemo(() => {
    if (filters.dateFrom && filters.dateTo && !dateLeq(filters.dateFrom, filters.dateTo)) {
      return "Invalid date range: 'From' must be before or equal to 'To'.";
    }
    return null;
  }, [filters.dateFrom, filters.dateTo]);

  React.useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    filters.priceMin,
    filters.priceMax,
    filters.minRating,
    filters.amenities.join(","),
    filters.dateFrom,
    filters.dateTo,
    sort.primary.field,
    sort.primary.order,
    sort.secondary.field,
    sort.secondary.order,
  ]);

  const filteredAndSorted = React.useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    const minP = Math.min(filters.priceMin, filters.priceMax);
    const maxP = Math.max(filters.priceMin, filters.priceMax);

    const withinDate = (h: typeof hotels[number]) => {
      const from = filters.dateFrom;
      const to = filters.dateTo;
      if (!from && !to) return true;
      if (from && !dateLeq(h.availability.checkIn, from)) return false;
      if (to && !dateLeq(to, h.availability.checkOut)) return false;
      return true;
    };

    return hotels
      .filter((h) => {
        if (needle) {
          const hay = `${h.name} ${h.city}`.toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        if (h.price < minP || h.price > maxP) return false;
        if (h.rating < filters.minRating) return false;
        if (!includesAllAmenities(h.amenities, filters.amenities)) return false;
        if (dateError) return false;
        if (!withinDate(h)) return false;
        return true;
      })
      .slice()
      .sort((a, b) => {
        const p = compare(a, b, sort.primary.field, sort.primary.order);
        if (p !== 0) return p;
        return compare(a, b, sort.secondary.field, sort.secondary.order);
      });
  }, [
    hotels,
    debouncedSearch,
    filters.priceMin,
    filters.priceMax,
    filters.minRating,
    filters.amenities,
    filters.dateFrom,
    filters.dateTo,
    sort,
    dateError,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const currentPage = clamp(page, 1, totalPages);

  const pageItems = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, currentPage]);

  // Handlers
  const onSearchChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => update("search", e.target.value),
    [update]
  );

  const onMinRatingChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => update("minRating", clamp(parseNumber(e.target.value, 0), 0, 5)),
    [update]
  );

  const onPriceMinChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = clamp(parseNumber(e.target.value, priceBounds.min), priceBounds.min, priceBounds.max);
      update("priceMin", v);
    },
    [update, priceBounds.min, priceBounds.max]
  );

  const onPriceMaxChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = clamp(parseNumber(e.target.value, priceBounds.max), priceBounds.min, priceBounds.max);
      update("priceMax", v);
    },
    [update, priceBounds.min, priceBounds.max]
  );

  const toggleAmenity = React.useCallback(
    (amenity: string) => {
      update(
        "amenities",
        filters.amenities.includes(amenity)
          ? filters.amenities.filter((a) => a !== amenity)
          : [...filters.amenities, amenity]
      );
    },
    [filters.amenities, update]
  );

  const onDateFromChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => update("dateFrom", e.target.value),
    [update]
  );
  const onDateToChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => update("dateTo", e.target.value),
    [update]
  );

  const setPrimarySort = React.useCallback((field: SortField) => {
    setSort((s) => ({
      ...s,
      primary: { field, order: s.primary.field === field ? (s.primary.order === "asc" ? "desc" : "asc") : "asc" },
    }));
  }, []);

  const setSecondarySort = React.useCallback((field: SortField) => {
    setSort((s) => ({
      ...s,
      secondary: { field, order: s.secondary.field === field ? (s.secondary.order === "asc" ? "desc" : "asc") : "asc" },
    }));
  }, []);

  const goPrev = React.useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const goNext = React.useCallback(() => setPage((p) => Math.min(totalPages, p + 1)), [totalPages]);

  const onExport = React.useCallback(() => exportCsv(filteredAndSorted), [filteredAndSorted]);

  return (
    <main style={remember.container} aria-label="Hotel booking dashboard">
      <header style={remember.header}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20 }}>Hotel Booking Dashboard</h1>
          <div style={remember.muted}>
            Results: <strong>{filteredAndSorted.length}</strong>{" "}
            <span style={remember.badge} aria-label={`Active filters: ${activeFilterCount}`}>
              Filters: {activeFilterCount}
            </span>
          </div>
        </div>

        <div style={remember.controls}>
          <button type="button" onClick={onExport} style={remember.btn} aria-label="Export filtered results to CSV">
            Export CSV
          </button>
          <button type="button" onClick={clearAll} style={remember.btnPrimary} aria-label="Clear all filters">
            Clear all filters
          </button>
        </div>
      </header>

      <section style={remember.grid} aria-label="Filters">
        <div style={remember.card}>
          <label style={remember.label} htmlFor="search">
            Search (name or city)
          </label>
          <input
            id="search"
            type="text"
            value={filters.search}
            onChange={onSearchChange}
            placeholder="e.g., Bangkok"
            aria-label="Search hotels by name or city"
            style={{ width: "100%", padding: 8 }}
          />
          <div aria-live="polite" style={{ marginTop: 6, fontSize: 12 }}>
            {isSearching ? "Searching..." : "\u00A0"}
          </div>
        </div>

        <div style={remember.card}>
          <div style={remember.row}>
            <div style={{ flex: 1 }}>
              <label style={remember.label} htmlFor="priceMin">
                Price min (${priceBounds.min}–${priceBounds.max})
              </label>
              <input
                id="priceMin"
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                value={filters.priceMin}
                onChange={onPriceMinChange}
                aria-label="Minimum price"
                style={{ width: "100%" }}
              />
              <input
                type="number"
                value={filters.priceMin}
                onChange={onPriceMinChange}
                aria-label="Minimum price number input"
                style={{ width: "100%", padding: 6, marginTop: 6 }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label style={remember.label} htmlFor="priceMax">
                Price max
              </label>
              <input
                id="priceMax"
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                value={filters.priceMax}
                onChange={onPriceMaxChange}
                aria-label="Maximum price"
                style={{ width: "100%" }}
              />
              <input
                type="number"
                value={filters.priceMax}
                onChange={onPriceMaxChange}
                aria-label="Maximum price number input"
                style={{ width: "100%", padding: 6, marginTop: 6 }}
              />
            </div>
          </div>

          <div style={{ marginTop: 8, fontSize: 12 }}>
            Selected range: <strong>${Math.min(filters.priceMin, filters.priceMax)}</strong>–<strong>${Math.max(filters.priceMin, filters.priceMax)}</strong>
          </div>
        </div>

        <div style={remember.card}>
          <label style={remember.label} htmlFor="minRating">
            Minimum rating (0–5)
          </label>
          <input
            id="minRating"
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={filters.minRating}
            onChange={onMinRatingChange}
            aria-label="Minimum rating"
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={remember.card}>
          <div style={remember.label}>Amenities</div>
          <div role="group" aria-label="Amenity filters" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {allAmenities.map((a) => (
              <label key={a} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={filters.amenities.includes(a)}
                  onChange={() => toggleAmenity(a)}
                  aria-label={`Filter by amenity ${a}`}
                />
                <span>{a}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={remember.card}>
          <div style={remember.label}>Availability (date range)</div>
          <div style={remember.row}>
            <div style={{ flex: 1 }}>
              <label style={remember.label} htmlFor="from">
                From
              </label>
              <input id="from" type="date" value={filters.dateFrom} onChange={onDateFromChange} aria-label="From date" style={{ width: "100%", padding: 8 }} />
            </div>

            <div style={{ flex: 1 }}>
              <label style={remember.label} htmlFor="to">
                To
              </label>
              <input id="to" type="date" value={filters.dateTo} onChange={onDateToChange} aria-label="To date" style={{ width: "100%", padding: 8 }} />
            </div>
          </div>

          {dateError ? (
            <div role="alert" style={remember.error}>
              {dateError}
            </div>
          ) : (
            <div style={{ fontSize: 12, marginTop: 6, color: "#666" }}>
              Hotels must fully cover your selected range.
            </div>
          )}
        </div>

        <div style={remember.card}>
          <div style={remember.label}>Sorting</div>

          <div style={{ display: "grid", gap: 8 }}>
            <div>
              <div style={{ fontSize: 12, marginBottom: 4 }}>
                Primary sort: <strong>{sort.primary.field}</strong> ({sort.primary.order})
              </div>
              <div style={remember.controls}>
                {(["price", "rating", "name"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setPrimarySort(f)}
                    style={remember.btn}
                    aria-label={`Set primary sort to ${f}`}
                    aria-pressed={sort.primary.field === f}
                  >
                    {f}
                    {sort.primary.field === f ? (sort.primary.order === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, marginBottom: 4 }}>
                Secondary sort: <strong>{sort.secondary.field}</strong> ({sort.secondary.order})
              </div>
              <div style={remember.controls}>
                {(["price", "rating", "name"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setSecondarySort(f)}
                    style={remember.btn}
                    aria-label={`Set secondary sort to ${f}`}
                    aria-pressed={sort.secondary.field === f}
                  >
                    {f}
                    {sort.secondary.field === f ? (sort.secondary.order === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Results">
        {filteredAndSorted.length === 0 ? (
          <div style={{ marginTop: 16, padding: 12, border: "1px dashed #bbb", borderRadius: 8 }} role="status" aria-live="polite">
            No hotels match your filters. Try clearing some filters.
          </div>
        ) : (
          <>
            <div style={remember.tableWrap} role="region" aria-label="Hotel results table" tabIndex={0}>
              <table style={remember.table}>
                <thead>
                  <tr>
                    <th style={remember.th}>Name</th>
                    <th style={remember.th}>City</th>
                    <th style={remember.th}>Price</th>
                    <th style={remember.th}>Rating</th>
                    <th style={remember.th}>Amenities</th>
                    <th style={remember.th}>Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((h) => (
                    <HotelRow key={h.id} hotel={h} />
                  ))}
                </tbody>
              </table>
            </div>

            <nav aria-label="Pagination" style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
              <button type="button" onClick={goPrev} disabled={currentPage === 1} style={remember.btn} aria-label="Previous page">
                Prev
              </button>
              <span>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>
              <button type="button" onClick={goNext} disabled={currentPage === totalPages} style={remember.btn} aria-label="Next page">
                Next
              </button>
            </nav>
          </>
        )}
      </section>
    </main>
  );
}
