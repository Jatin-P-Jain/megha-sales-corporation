"use client";
import React, { useState } from "react";
import clsx from "clsx";
import Image from "next/image";
import { Loader2Icon } from "lucide-react";

interface ImageViewerProps {
  url: string;
  fileName: string;
  className?: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  url,
  className,
  fileName,
}) => {
  const [loading, setLoading] = useState(true);

  return (
    <>
      {loading && (
        <div className="text-muted-foreground flex h-full w-full items-center justify-center">
          <Loader2Icon className="size-4 animate-spin" />
        </div>
      )}

      <div
        className={clsx(
          className,
          "relative flex h-full w-full items-center justify-center",
        )}
      >
        <Image
          src={url}
          alt={fileName}
          
          width={200}
          height={200}
          className="h-full w-full object-contain"
          sizes=""
          onLoad={() => setLoading(false)}
        />
      </div>
    </>
  );
};

export default ImageViewer;
