"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Loader2, PencilIcon, Trash2Icon, UploadIcon } from "lucide-react";
import Image from "next/image";
import { Progress } from "../ui/progress";
import CropperModal from "./cropper-modal";

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
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

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
    const objectUrl = URL.createObjectURL(files[0]);
    setTempImageUrl(objectUrl);
    setCropperOpen(true);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-3xl pb-0 md:pt-4">
        {!image?.url ? (
          <div className={`${parent === "brand" ? "mb-5 h-35" : ""}`}>
            <input
              className="hidden"
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              disabled={disabled} // Disable input if disabled
            />
            <Button
              className="mx-auto flex !h-full w-full border-dashed"
              variant={"outline"}
              type="button"
              onClick={() => {
                if (disabled) return; // Prevent opening file dialog if disabled
                inputRef?.current?.click();
              }}
              disabled={disabled} // Disable button if disabled
            >
              <UploadIcon />
              {parent === "brand"
                ? "Upload Brand Logo"
                : "Upload Product Image"}
            </Button>
            {imageSizeError ? (
              <p
                className={`flex w-full flex-col text-center text-xs text-red-700`}
              >
                Selected file exceeded max size: 5MB.
              </p>
            ) : (
              <p
                className={`text-muted-foreground flex w-full flex-col text-center text-xs`}
              >
                All image formats (JPG, PNG, WebP, etc.)
                <strong>Max size: 5MB.</strong>
              </p>
            )}
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1">
            <div className="relative flex h-35 w-full flex-col items-center justify-center overflow-hidden rounded-lg border-1">
              {isImageLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50">
                  <Loader2 className="text-primary h-6 w-6 animate-spin" />
                </div>
              )}
              <div
                className="bg-muted/80 absolute top-0 right-0 z-30 flex cursor-pointer items-center justify-center rounded-bl-lg p-2"
                onClick={() => {
                  onMediaChange({ id: "", url: "" });
                }}
              >
                <Trash2Icon className="size-4" />
              </div>
              <Image
                src={urlFormatter ? urlFormatter(image) : image?.url}
                alt="Logo"
                width={220}
                height={220}
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
                className={`flex w-full flex-col text-center text-xs text-red-700`}
              >
                Selected file exceeded max size: 5MB.
              </p>
            ) : (
              <p
                className={`text-muted-foreground flex w-full flex-col text-center text-xs`}
              >
                All image formats (JPG, PNG, WebP, etc.)
                <strong>Max size: 5MB.</strong>
              </p>
            )}

            <Button
              className="text-primary bg-accent relative mx-auto flex w-1/2 border-none py-0 text-[10px] font-semibold shadow-none"
              variant={"outline"}
              type="button"
              size={"sm"}
              onClick={() => {
                if (disabled) return; // Prevent opening file dialog if disabled
                inputRef?.current?.click();
              }}
              disabled={disabled} // Disable button if disabled
            >
              <PencilIcon className="!h-4 !w-4" />
              {parent === "brand"
                ? "Change Brand Logo"
                : "Change Product Image"}
            </Button>
          </div>
        )}
      </div>
      {tempImageUrl && (
        <CropperModal
          open={cropperOpen}
          imageSrc={tempImageUrl}
          onClose={() => setCropperOpen(false)}
          onCropComplete={({ blobUrl, file }) => {
            const newImage = {
              id: `${Date.now()}`,
              url: blobUrl,
              file,
            };
            onMediaChange(newImage);
          }}
        />
      )}
    </>
  );
}
