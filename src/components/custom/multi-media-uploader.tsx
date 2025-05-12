"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Button } from "../ui/button";
import {
  FullscreenIcon,
  UploadIcon,
  XIcon,
  ZoomInIcon,
} from "lucide-react";
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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return; // Prevent adding images if disabled
    const files = Array.from(e.target?.files || []);
    console.log(files);

    const newMedia = files.map((file, index) => {
      return {
        id: `${Date.now()}--${index}--${file.name}`,
        fileName: file.name,
        url: URL.createObjectURL(file),
        file,
      };
    });
    onMediaChange([...media, ...newMedia]);
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
        Upload Media
      </Button>
      {media.length > 0 && (
        <div className="max-h-60 shadow-sm overflow-auto rounded">
          {media.map((item, index) => {
            console.log("item -- ", item);
            console.log("item id -- ", item.fileName);
            console.log("progressMap -- ", progressMap);

            const progress = progressMap[item.fileName || ""];
            console.log("progress", progress);

            const icon = IconForFile(item?.fileName);
            return (
              <div className="relative p-1 px-2" key={index}>
                <div className="bg-gray-100 flex items-center rounded-lg overflow-hidden gap-1 p-2">
                  <div className="size-8 relative">
                    <Image
                      src={icon}
                      alt=""
                      fill
                      className="object-center w-full h-full"
                    />
                    {/* <Image
                            src={urlFormatter ? urlFormatter(item) : item.url}
                            alt=""
                            fill
                            className="object-cover"
                          /> */}
                  </div>
                  <div className="flex-col flex-grow">
                    <p className="text-sm font-medium text-ellipsis">
                      {truncateMiddle(item?.fileName)}
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
                  <div className="flex gap-3 items-center pr-4">
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
                  <div className="mb-2">
                    {/* <span>{m.fileName}</span> */}

                    {/* {!!item.file && (
                      
                    )} */}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewFile && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 flex-col"
          onClick={() => {
            setPreviewFile(null);
            setPreviewFileName("");
          }} // Close modal on background click
        >
          <div className="flex w-full h-auto justify-end px-35">
            <XIcon
              onClick={() => {
                setPreviewFile(null);
                setPreviewFileName("");
              }}
              className="cursor-pointer text-gray-200 "
            />
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
