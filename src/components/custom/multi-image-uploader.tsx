"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Button } from "../ui/button";
import {
  CrossIcon,
  MoveIcon,
  UploadIcon,
  XIcon,
  ZoomInIcon,
} from "lucide-react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";
import Image from "next/image";
import { Badge } from "../ui/badge";

export type ImageUpload = {
  id: string;
  url: string;
  file?: File;
};
type Props = {
  images?: ImageUpload[];
  onImagesChange: (images: ImageUpload[]) => void;
  disabled?: boolean; // Added disabled prop
  urlFormatter?: (image: ImageUpload) => string;
};

export default function MultiImageUploader({
  images = [],
  onImagesChange,
  disabled = false, // Default to false
  urlFormatter,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return; // Prevent adding images if disabled
    const files = Array.from(e.target?.files || []);
    const newImages = files.map((file, index) => {
      return {
        id: `${Date.now()}--${index}--${file.name}`,
        url: URL.createObjectURL(file),
        file,
      };
    });
    onImagesChange([...images, ...newImages]);
  };

  const handleDragEnd = (result: DropResult) => {
    if (disabled) return; // Prevent reordering images if disabled
    const items = [...images];
    if (!result.destination) return;
    const [reorderedImage] = items.splice(result.source.index, 1);
    items.splice(result.destination?.index, 0, reorderedImage);
    onImagesChange(items);
  };

  const handleDeleteImage = (imageId: string) => {
    if (disabled) return; // Prevent deleting images if disabled
    const newImages = images.filter((image) => image.id != imageId);
    onImagesChange(newImages);
  };

  return (
    <div className="max-w-3xl w-full mx-auto py-4">
      <input
        className="hidden"
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleInputChange}
        disabled={disabled} // Disable input if disabled
      />
      <Button
        className="w-full mx-auto mb-2"
        variant={"outline"}
        type="button"
        onClick={() => {
          if (disabled) return; // Prevent opening file dialog if disabled
          inputRef?.current?.click();
        }}
        disabled={disabled} // Disable button if disabled
      >
        <UploadIcon />
        Upload Images
      </Button>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="property-images" direction="vertical">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {images.map((image, index) => (
                <Draggable
                  key={image.id}
                  draggableId={image.id}
                  index={index}
                  isDragDisabled={disabled}
                >
                  {(provided) => (
                    <div
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      ref={provided.innerRef}
                      className="relative p-2"
                    >
                      <div className="bg-gray-100 flex items-center rounded-lg overflow-hidden gap-3">
                        <div className="size-16 relative">
                          <Image
                            src={urlFormatter ? urlFormatter(image) : image.url}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-col flex-grow">
                          <p className="text-sm font-medium">
                            Image {index + 1}
                          </p>
                          {index === 0 && (
                            <Badge variant={"success"}>Featured</Badge>
                          )}
                        </div>
                        <div className="flex gap-3 items-center pr-4">
                          <button
                            type="button"
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(
                                urlFormatter ? urlFormatter(image) : image.url
                              );
                            }}
                            disabled={disabled} // Disable button if disabled
                          >
                            <ZoomInIcon className="size-4 text-gray-800" />
                          </button>
                          <button
                            type="button"
                            className="cursor-pointer"
                            onClick={() => handleDeleteImage(image.id)}
                            disabled={disabled} // Disable button if disabled
                          >
                            <XIcon className="size-5 text-red-600" />
                          </button>
                          <div>
                            <MoveIcon className="size-4 text-gray-800" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 flex-col"
          onClick={() => setPreviewImage(null)} // Close modal on background click
        >
          <div className="flex w-full h-auto justify-end px-35">
            <XIcon
              onClick={() => setPreviewImage(null)}
              className="cursor-pointer text-gray-200 "
            />
          </div>
          <div
            className="bg-white/0 p-4 rounded-lg "
            onClick={(e) => e.stopPropagation()} // Prevent background click from closing modal
          >
            <div className="relative w-[80vw] h-[80vh]">
              <Image
                src={previewImage}
                alt="Preview"
                fill
                className="object-center overflow-hidden rounded-4xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
