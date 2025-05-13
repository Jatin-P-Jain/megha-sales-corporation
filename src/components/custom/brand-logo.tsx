"use client";
import imageUrlFormatter from "@/lib/image-urlFormatter";
import { ImageOffIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface BrandLogoProps {
  brandLogo?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ brandLogo }: BrandLogoProps) => {
  const [loading, setLoading] = useState(true);
  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/50">
          <Loader2 className="animate-spin h-6 w-6 text-primary" />
        </div>
      )}
      {!!brandLogo ? (
        <Image
          src={imageUrlFormatter(brandLogo)}
          alt="img"
          fill
          className="object-contain"
          onLoad={() => {
            setLoading(false);
          }}
        />
      ) : (
        <>
          <ImageOffIcon />
          <small>No Image</small>
        </>
      )}
    </div>
  );
};

export default BrandLogo;
