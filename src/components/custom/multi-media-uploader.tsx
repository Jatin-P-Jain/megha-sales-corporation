"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Button } from "../ui/button";
import { FullscreenIcon, UploadIcon, XIcon } from "lucide-react";
import Image from "next/image";
import PDFIcon from "../../assets/icons/pdf-icon.svg";
import ExcelIcon from "../../assets/icons/excel-icon.svg";
import WordIcon from "../../assets/icons/excel-icon.svg";
import ImageFileIcon from "../../assets/icons/image-file-icon.svg";
import VideoFileIcon from "../../assets/icons/video-file-icon.svg";
import FileIcon from "../../assets/icons/video-file-icon.svg";
import { FileType, getFileType, truncateMiddle } from "@/lib/utils";
import { FileViewer } from "./file-viewer";
import { Progress } from "../ui/progress";

export type MediaUpload = {
  id: string;
  url: string;
  fileName?: string;
  file?: File;
};
type Props = {
  progressMap?: Record<string, number>;
  media?: MediaUpload[];
  onMediaChange: (media: MediaUpload[]) => void;
  disabled?: boolean; // Added disabled prop
  urlFormatter?: (media: MediaUpload) => string;
};

export default function MultiMediaUploader({
  progressMap = {},
  media = [],
  onMediaChange,
  disabled = false, // Default to false
  urlFormatter,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>("");
  const [mediaSizeError, setMediaSizeError] = useState(false);
  const MAX_SIZE_MB = 5;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return; // Prevent adding images if disabled
    const files = Array.from(e.target?.files || []);

    const newMedia = files.map((file, index) => {
      if (file.size > MAX_SIZE_BYTES) {
        return null;
      }
      return {
        id: `${Date.now()}--${index}--${file.name}`,
        fileName: file.name,
        url: URL.createObjectURL(file),
        file,
      };
    });
    const nullMedia = newMedia.filter((media) => media == null);
    if (nullMedia.length > 0) {
      setMediaSizeError(true);
    } else {
      setMediaSizeError(false);
    }
    const newMediaSized = newMedia.filter((media) => media !== null);
    onMediaChange([...media, ...newMediaSized]);
  };

  const handleDeleteImage = (mediaId: string) => {
    if (disabled) return; // Prevent deleting images if disabled
    const newImages = media.filter((media) => media.id != mediaId);
    onMediaChange(newImages);
  };

  function IconForFile(fileName?: string) {
    const type: FileType = getFileType(fileName || "");

    switch (type) {
      case "image":
        return ImageFileIcon;
      case "video":
        return VideoFileIcon;
      case "pdf":
        return PDFIcon;
      case "excel":
        return ExcelIcon;
      case "word":
        return WordIcon;
      default:
        return FileIcon;
    }
  }

  return (
    <div className="max-w-3xl w-full mx-auto py-4">
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
        className="w-full mx-auto"
        variant={"outline"}
        type="button"
        onClick={() => {
          if (disabled) return; // Prevent opening file dialog if disabled
          inputRef?.current?.click();
        }}
        disabled={disabled} // Disable button if disabled
      >
        <UploadIcon />
        Upload Media
      </Button>
      {mediaSizeError ? (
        <p className={`flex flex-col w-full text-xs text-center text-yellow-700`}>
          One or more files selected were larger than {MAX_SIZE_MB}MB and have been
          skipped.
        </p>
      ) : (
        <p className={`w-full text-xs text-center text-muted-foreground`}>
          Supported formats: PDF, Word, Excel, CSV, Images, and Videos.{" "}
          <strong>Max size: {MAX_SIZE_MB}MB.</strong>
        </p>
      )}

      {media.length > 0 && (
        <div className="max-h-60 shadow-sm overflow-auto rounded mt-2">
          {media.map((item, index) => {
            const progress = progressMap[item.fileName || ""];
            const icon = IconForFile(item?.fileName);
            return (
              <div className="relative p-1 px-1" key={index}>
                <div className="bg-gray-100 flex items-center rounded-lg overflow-hidden gap-3 p-1 px-4">
                  <div className="size-8 relative">
                    <Image
                      src={icon}
                      alt=""
                      fill
                      className="object-center w-full h-full"
                    />
                  </div>
                  <div className="flex-col flex-grow">
                    <p className="text-sm font-medium text-ellipsis">
                      {truncateMiddle(item?.fileName, 20, 10, 10)}
                    </p>
                    {item?.file && (
                      <>
                        <Progress className="w-full mt-2" value={progress} />
                        <span className="text-xs text-muted-foreground">
                          {!progress ? "Ready to upload" : "Uploading"}
                          {` - ${progress ?? 0} %`}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 md:gap-3 items-center">
                    <button
                      type="button"
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewFile(
                          urlFormatter ? urlFormatter(item) : item.url
                        );
                        setPreviewFileName(item?.fileName || "");
                      }}
                      disabled={disabled} // Disable button if disabled
                    >
                      <FullscreenIcon className="size-5 text-gray-800" />
                    </button>
                    <button
                      type="button"
                      className="cursor-pointer"
                      onClick={() => handleDeleteImage(item.id)}
                      disabled={disabled} // Disable button if disabled
                    >
                      <XIcon className="size-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewFile && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 flex-col"
          onClick={() => {
            setPreviewFile(null);
            setPreviewFileName("");
          }} // Close modal on background click
        >
          <div className="flex w-[90vw] h-auto justify-end ">
            <div
              onClick={() => {
                setPreviewFile(null);
                setPreviewFileName("");
              }}
              className="bg-muted flex cursor-pointer text-muted-foreground px-1 rounded gap-1 text-sm font-bold justify-center items-center"
            >
              Close
              <XIcon className="size-4" />
            </div>
          </div>
          <div
            className="bg-white/0 p-4 rounded-lg "
            onClick={(e) => e.stopPropagation()} // Prevent background click from closing modal
          >
            <FileViewer url={previewFile} fileName={previewFileName} />
          </div>
        </div>
      )}
    </div>
  );
}
