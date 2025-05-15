"use client";

import imageUrlFormatter from "@/lib/image-urlFormatter";
import { ImageOffIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface ProductImageProps {
  productImage?: string;
}
const ProductImage: React.FC<ProductImageProps> = ({
  productImage,
}: ProductImageProps) => {
  const [loading, setLoading] = useState(true);
  return (
    <div className="relative flex h-full w-full items-end justify-end justify-self-end">
      {!!productImage && loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50">
          <Loader2 className="text-primary h-6 w-6 animate-spin" />
        </div>
      )}
      {!!productImage ? (
        <Image
          src={imageUrlFormatter(productImage)}
          alt="img"
          fill
          className="object-contain"
          onLoad={() => {
            setLoading(false);
          }}
        />
      ) : (
        <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center text-sm">
          <ImageOffIcon />
          <small>No Image</small>
        </div>
      )}
    </div>
  );
};

export default ProductImage;
