"use client";

import { useEffect, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import GetDirectionsButton from "./get-directions-button";
import { Loader2Icon } from "lucide-react";

const containerStyle = {
  width: "100%",
  height: "250px",
  margin: "auto",
};

export default function GoogleMapComponent({ address }: { address: string }) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });
  console.log({ isLoaded });

  useEffect(() => {
    if (!isLoaded) return;

    const geocode = new google.maps.Geocoder();
    geocode.geocode({ address }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const location = results[0].geometry.location;
        setCoords({ lat: location.lat(), lng: location.lng() });
      } else {
        console.error("Geocoding failed:", status);
      }
    });
  }, [isLoaded]);

  if (!isLoaded || !coords)
    return (
      <p className="flex w-full flex-col items-center justify-center gap-2">
        <Loader2Icon className="size-4 animate-spin" />
        Loading Google Maps...
      </p>
    );

  return (
    <div className="w-full md:w-3/4">
      <GoogleMap mapContainerStyle={containerStyle} center={coords} zoom={15}>
        <Marker position={coords} />
      </GoogleMap>
      <GetDirectionsButton destination={address} />
    </div>
  );
}
