"use client";

import { useEffect, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import GetDirectionsButton from "./get-directions-button";

const containerStyle = {
  width: "100%",
  height: "400px",
};

export default function MapWithAddress({ address }: { address: string }) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

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

  if (!isLoaded) return <p>Loading Google Maps...</p>;
  if (!coords) return <p>Looking up address...</p>;

  return (
    <>
      <GoogleMap mapContainerStyle={containerStyle} center={coords} zoom={15}>
        <Marker position={coords} />
      </GoogleMap>
      <GetDirectionsButton destination={address} />
    </>
  );
}
