"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Button } from "../ui/button";
import { PencilIcon, UploadIcon } from "lucide-react";
import Image from "next/image";

export type ImageUpload = {
  id: string;
  url: string;
  file?: File;
};
type Props = {
  image: ImageUpload;
  onMediaChange: (image: ImageUpload) => void;
  disabled?: boolean; // Added disabled prop
  urlFormatter?: (image: ImageUpload | undefined) => string;
};

export default function ImageUploader({
  image,
  onMediaChange,
  disabled = false, // Default to false
  urlFormatter,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return; // Prevent adding images if disabled
    const files = e.target?.files || [];
    const newImage = {
      id: `${Date.now()}--${files[0]?.name}`,
      url: URL.createObjectURL(files?.[0]),
      file: files?.[0],
    };
    onMediaChange(newImage);
  };

  return (
    <div className="max-w-3xl w-full mx-auto pt-4 pb-0">
      {!image?.url ? (
        <>
          <input
            className="hidden"
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*,video/*"
            onChange={handleInputChange}
            disabled={disabled} // Disable input if disabled
          />
          <Button
            className="w-full mx-auto flex h-full border-dashed"
            variant={"outline"}
            type="button"
            onClick={() => {
              if (disabled) return; // Prevent opening file dialog if disabled
              inputRef?.current?.click();
            }}
            disabled={disabled} // Disable button if disabled
          >
            <UploadIcon />
            Upload Brand Logo
          </Button>
        </>
      ) : (
        <div className=" h-full w-full flex items-center justify-center flex-col gap-1">
          <div className="relative border-1 rounded-lg overflow-hidden h-full w-full">
            <Image
              src={urlFormatter ? urlFormatter(image) : image?.url}
              alt="Logo"
              fill
              className="object-contain"
            />
          </div>
          <input
            className="hidden"
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*,video/*"
            onChange={handleInputChange}
            disabled={disabled} // Disable input if disabled
          />
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
            Change Brand Logo
          </Button>
        </div>
      )}
    </div>
  );
}
