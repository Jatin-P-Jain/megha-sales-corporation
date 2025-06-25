"use client";
import "../../app/styles/vendor/cropper.css";

import React, { useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import Cropper from "react-cropper";
import type { ReactCropperElement } from "react-cropper";

type Props = {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (result: { blobUrl: string; file: File }) => void;
};

export default function CropperModal({
  open,
  imageSrc,
  onClose,
  onCropComplete,
}: Props) {
  const cropperRef = useRef<ReactCropperElement>(null);

  const handleCrop = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    cropper.getCroppedCanvas().toBlob((blob: Blob | null) => {
      if (!blob) return;
      const blobUrl = URL.createObjectURL(blob);
      const file = new File([blob], `cropped_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      onCropComplete({ blobUrl, file });
      onClose();
    }, "image/jpeg");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogTitle className="text-lg font-semibold">Crop Image</DialogTitle>

        <div className="relative h-[400px] w-full">
          <Cropper
            src={imageSrc}
            style={{ height: 400, width: "100%" }}
            initialAspectRatio={NaN} // ❌ no enforced aspect ratio
            aspectRatio={NaN} // ✅ Freeform cropping
            viewMode={1}
            background={false}
            responsive={true}
            autoCropArea={1}
            guides={true}
            ref={cropperRef}
          />
        </div>

        <div className="mt-4 flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCrop}>Crop & Use</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
