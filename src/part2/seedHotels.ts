// src/part2/seedHotels.ts
import type { Hotel } from "./types";

export const HOTELS: Hotel[] = [
  {
    id: 1,
    name: "Agoda Palace",
    city: "Bangkok",
    price: 120,
    rating: 4.5,
    amenities: ["WiFi", "Pool", "Gym"],
    availability: { checkIn: "2025-01-15", checkOut: "2025-01-20" },
  },
  {
    id: 2,
    name: "Seaside View",
    city: "Phuket",
    price: 80,
    rating: 4.2,
    amenities: ["WiFi", "Beach"],
    availability: { checkIn: "2025-01-10", checkOut: "2025-01-25" },
  },
  {
    id: 3,
    name: "Mountain Stay",
    city: "Chiang Mai",
    price: 100,
    rating: 4.8,
    amenities: ["WiFi", "Gym", "Spa"],
    availability: { checkIn: "2025-01-05", checkOut: "2025-01-30" },
  },
  {
    id: 4,
    name: "Urban Loft",
    city: "Bangkok",
    price: 150,
    rating: 4.6,
    amenities: ["WiFi", "Pool"],
    availability: { checkIn: "2025-01-12", checkOut: "2025-01-18" },
  },
  {
    id: 5,
    name: "Tropical Resort",
    city: "Phuket",
    price: 200,
    rating: 4.9,
    amenities: ["WiFi", "Pool", "Beach", "Spa"],
    availability: { checkIn: "2025-01-08", checkOut: "2025-01-22" },
  },
];
