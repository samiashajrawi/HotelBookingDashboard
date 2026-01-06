// tests/part1/dataTransform.test.js
const { transformData } = require("../../src/part1/dataTransform");

const bookings = [
  { id: 1, category: "Hotel", location: { city: "Bangkok", country: "TH" }, price: 120, nights: 2 },
  { id: 2, category: "Flight", location: { city: "Tokyo", country: "JP" }, price: 450, passengers: 1 },
  { id: 3, category: "Hotel", location: { city: "Bangkok", country: "TH" }, price: 80, nights: 3 },
  { id: 4, category: "Hotel", location: { city: "Dubai", country: "AE" }, price: 200, nights: 1 },
  { id: 5, category: "Flight", location: { city: "Bangkok", country: "TH" }, price: 300, passengers: 2 },
];

describe("transformData", () => {
  test("groups + sum/avg + sort", () => {
    const out = transformData(bookings, {
      groupBy: "category",
      aggregations: { price: "sum", nights: "avg" },
      sortBy: { field: "price", order: "desc" },
    });

    expect(out[0].category).toBe("Hotel");
    expect(out[0].aggregates.price).toBe(400);
    expect(out[0].aggregates.nights).toBeCloseTo(2); // (2+3+1)/3
    expect(out[1].category).toBe("Flight");
    expect(out[1].aggregates.price).toBe(750);
  });

  test("supports nested groupBy", () => {
    const out = transformData(bookings, {
      groupBy: "location.city",
      aggregations: { price: "max" },
      sortBy: { field: "price", order: "asc" },
    });

    const tokyo = out.find((g) => g.city === "Tokyo");
    expect(tokyo.aggregates.price).toBe(450);
  });

  test("supports composite groupBy + count", () => {
    const out = transformData(bookings, {
      groupBy: ["category", "location.city"],
      aggregations: { id: "count" },
    });

    const row = out.find((g) => g.category === "Flight" && g.city === "Bangkok");
    expect(row.aggregates.id).toBe(1);
  });

  test("skips missing/non-numeric values for numeric aggregations", () => {
    const out = transformData(bookings, {
      groupBy: "category",
      aggregations: { passengers: "avg" },
    });

    const hotel = out.find((g) => g.category === "Hotel");
    expect(hotel.aggregates.passengers).toBeNull();
  });

  test("throws on invalid inputs", () => {
    expect(() => transformData(null, {})).toThrow();
    expect(() => transformData([], { groupBy: "", aggregations: { price: "sum" } })).toThrow();
    expect(() => transformData([], { groupBy: "x", aggregations: {} })).toThrow();
  });
});
