"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"; // or your preferred button component
import { Send } from "lucide-react";

export default function GetDirectionsButton({
  destination,
}: {
  destination: string; // or lat,lng string
}) {
  const [mapsUrl, setMapsUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          const origin = `${latitude},${longitude}`;
          const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${encodeURIComponent(
            destination,
          )}&travelmode=driving`;

          setMapsUrl(url);
        },
        (error) => {
          console.error("Geolocation error:", error);
          // fallback: let Google use user's location by default
          const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            destination,
          )}&travelmode=driving`;
          setMapsUrl(url);
        },
      );
    }
  }, [destination]);

  return mapsUrl ? (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full items-center justify-center"
    >
      <Button
        variant={"link"}
        className="text-md border-0 !p-0 text-cyan-900 shadow-none focus:ring-0 focus:outline-none"
      >
        <Send />
        Get Directions
      </Button>
    </a>
  ) : (
    <Button disabled>Please allow the app for location permissions</Button>
  );
}
