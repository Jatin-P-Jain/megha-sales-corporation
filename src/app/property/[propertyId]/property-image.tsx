"use client";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function PropertyImage({
  image,
  index,
}: {
  image: string;
  index: number;
}) {
  const [loaded, setIsLoaded] = useState(false);
  console.log(
    `https://firebasestorage.googleapis.com/v0/b/hot-homes-8a814.firebasestorage.app/o/${encodeURIComponent(
      image
    )}?alt=media`
  );

  console.log({ loaded });

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100/50">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-900" />
        </div>
      )}
      <Image
        src={`https://firebasestorage.googleapis.com/v0/b/hot-homes-8a814.firebasestorage.app/o/${encodeURIComponent(
          image
        )}?alt=media&v=1`}
        alt={`Image${index}`}
        fill
        className={`object-cover duration-300 ease-in ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => {
          setIsLoaded(true);
        }}
      />
    </>
  );
}
