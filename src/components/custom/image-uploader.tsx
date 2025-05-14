"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Loader2, PencilIcon, Trash2Icon, UploadIcon } from "lucide-react";
import Image from "next/image";
import { Progress } from "../ui/progress";

export type ImageUpload = {
  id: string;
  url: string;
  file?: File;
};
type Props = {
  parent?: string;
  progressMap?: Record<string, number>;
  image?: ImageUpload;
  onMediaChange: (image: ImageUpload) => void;
  disabled?: boolean; // Added disabled prop
  urlFormatter?: (image: ImageUpload | undefined) => string;
};

export default function ImageUploader({
  parent,
  progressMap,
  image,
  onMediaChange,
  disabled = false, // Default to false
  urlFormatter,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageSizeError, setImageSizeError] = useState(false);
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return; // Prevent adding images if disabled
    const files = e.target?.files || [];
    const MAX_SIZE_MB = 5;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    if (files[0]?.size > MAX_SIZE_BYTES) {
      setImageSizeError(true);
      return;
    } else {
      setImageSizeError(false);
    }

    const newImage = {
      id: `${Date.now()}--${files[0]?.name}`,
      url: URL.createObjectURL(files?.[0]),
      file: files?.[0],
    };
    onMediaChange(newImage);
  };

  return (
    <div className="max-w-3xl w-full mx-auto md:pt-4 pb-0">
      {!image?.url ? (
        <div className={`${parent === "brand" ? "h-40" : ""}`}>
          <input
            className="hidden"
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            disabled={disabled} // Disable input if disabled
          />
          <Button
            className="w-full mx-auto flex !h-full border-dashed"
            variant={"outline"}
            type="button"
            onClick={() => {
              if (disabled) return; // Prevent opening file dialog if disabled
              inputRef?.current?.click();
            }}
            disabled={disabled} // Disable button if disabled
          >
            <UploadIcon />
            {parent === "brand" ? "Upload Brand Logo" : "Upload Product Image"}
          </Button>
          {imageSizeError ? (
            <p
              className={`flex flex-col w-full text-xs text-center text-red-700`}
            >
              Selected file exceeded max size: 5MB.
            </p>
          ) : (
            <p
              className={`flex flex-col w-full text-xs text-center text-muted-foreground`}
            >
              All image formats (JPG, PNG, WebP, etc.)
              <strong>Max size: 5MB.</strong>
            </p>
          )}
        </div>
      ) : (
        <div className=" h-full w-full flex items-center justify-center flex-col gap-1">
          <div className="relative border-1 rounded-lg overflow-hidden h-35 w-full flex justify-center flex-col items-center">
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/50">
                <Loader2 className="animate-spin h-6 w-6 text-primary" />
              </div>
            )}
            <div
              className="absolute top-0 right-0 z-30 bg-muted/80 rounded-bl-lg p-2 flex justify-center items-center cursor-pointer"
              onClick={() => {
                onMediaChange({ id: "", url: "" });
              }}
            >
              <Trash2Icon className="size-4" />
            </div>
            <Image
              src={urlFormatter ? urlFormatter(image) : image?.url}
              alt="Logo"
              fill
              className="object-contain"
              onLoad={() => setIsImageLoading(false)}
            />
            {progressMap && progressMap[image?.file?.name || ""] && (
              <Progress
                value={progressMap[image?.file?.name || ""]}
                className="absolute bottom-0"
              />
            )}
          </div>
          <input
            className="hidden"
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            disabled={disabled} // Disable input if disabled
          />
          {imageSizeError ? (
            <p
              className={`flex flex-col w-full text-xs text-center text-red-700`}
            >
              Selected file exceeded max size: 5MB.
            </p>
          ) : (
            <p
              className={`flex flex-col w-full text-xs text-center text-muted-foreground`}
            >
              All image formats (JPG, PNG, WebP, etc.)
              <strong>Max size: 5MB.</strong>
            </p>
          )}

          <Button
            className="w-1/2 mx-auto flex border-none shadow-none text-[10px] font-semibold text-primary bg-accent relative py-0"
            variant={"outline"}
            type="button"
            size={"sm"}
            onClick={() => {
              if (disabled) return; // Prevent opening file dialog if disabled
              inputRef?.current?.click();
            }}
            disabled={disabled} // Disable button if disabled
          >
            <PencilIcon className="!w-4 !h-4" />
            {parent === "brand" ? "Change Brand Logo" : "Change Product Image"}
          </Button>
        </div>
      )}
    </div>
  );
}
