// src/part2/components/HotelRow.tsx
import * as React from "react";
import type { Hotel } from "../types";

export const HotelRow = React.memo(function HotelRow({ hotel }: { hotel: Hotel }) {
  return (
    <tr>
      <td>{hotel.name}</td>
      <td>{hotel.city}</td>
      <td>${hotel.price}</td>
      <td>{hotel.rating.toFixed(1)}</td>
      <td>{hotel.amenities.join(", ")}</td>
      <td>
        {hotel.availability.checkIn} → {hotel.availability.checkOut}
      </td>
    </tr>
  );
});
