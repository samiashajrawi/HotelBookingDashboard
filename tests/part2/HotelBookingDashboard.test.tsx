// tests/part2/HotelBookingDashboard.test.tsx
import * as React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import HotelBookingDashboard from "../../src/part2/HotelBookingDashboard";

jest.useFakeTimers();

describe("HotelBookingDashboard", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    window.localStorage.clear();
  });

  test("renders results and supports debounced search", async () => {
    render(<HotelBookingDashboard />);

    expect(screen.getByText(/Hotel Booking Dashboard/i)).toBeInTheDocument();
    // baseline results count exists
    expect(screen.getByText(/Results:/i)).toBeInTheDocument();

    const search = screen.getByLabelText(/Search hotels by name or city/i);
    fireEvent.change(search, { target: { value: "Bangkok" } });

    // Immediately shows searching…
    expect(screen.getByText(/Searching\.\.\./i)).toBeInTheDocument();

    // Advance debounce
    act(() => {
      jest.advanceTimersByTime(310);
    });

    // Now should no longer show "Searching..."
    expect(screen.queryByText(/Searching\.\.\./i)).not.toBeInTheDocument();
  });

  test("availability date range filters hotels", () => {
    render(<HotelBookingDashboard />);

    fireEvent.change(screen.getByLabelText(/From date/i), { target: { value: "2025-01-16" } });
    fireEvent.change(screen.getByLabelText(/To date/i), { target: { value: "2025-01-19" } });

    // Agoda Palace covers 15-20 => should remain
    expect(screen.getByText("Agoda Palace")).toBeInTheDocument();
    // Urban Loft covers 12-18 => should be filtered out (to=19)
    expect(screen.queryByText("Urban Loft")).not.toBeInTheDocument();
  });

  test("clear all filters resets search", () => {
    render(<HotelBookingDashboard />);
    const search = screen.getByLabelText(/Search hotels by name or city/i);
    fireEvent.change(search, { target: { value: "Phuket" } });

    act(() => {
      jest.advanceTimersByTime(310);
    });

    fireEvent.click(screen.getByRole("button", { name: /Clear all filters/i }));
    expect((screen.getByLabelText(/Search hotels by name or city/i) as HTMLInputElement).value).toBe("");
  });
});
