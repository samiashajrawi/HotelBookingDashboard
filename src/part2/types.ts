// src/part2/types.ts
export type Hotel = {
  id: number;
  name: string;
  city: string;
  price: number;
  rating: number;
  amenities: string[];
  availability: {
    checkIn: string; // ISO date string (YYYY-MM-DD)
    checkOut: string;
  };
};

export type SortField = "price" | "rating" | "name";
export type SortOrder = "asc" | "desc";

export type SortSpec = {
  primary: { field: SortField; order: SortOrder };
  secondary: { field: SortField; order: SortOrder };
};

export type Filters = {
  search: string;
  priceMin: number;
  priceMax: number;
  minRating: number;
  amenities: string[];
  dateFrom: string;
  dateTo: string;
};
