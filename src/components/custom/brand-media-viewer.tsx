"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { BrandMedia } from "@/types/brand";
import imageUrlFormatter from "@/lib/image-urlFormatter";
import { DownloadIcon, OctagonAlertIcon, XIcon } from "lucide-react";
import { FileViewer } from "./file-viewer";
import { FileType, getFileType, truncateMiddle } from "@/lib/utils";
import PDFIcon from "../../assets/icons/pdf-icon.svg";
import ExcelIcon from "../../assets/icons/excel-icon.svg";
import WordIcon from "../../assets/icons/word-icon.svg";
import ImageFileIcon from "../../assets/icons/image-file-icon.svg";
import VideoFileIcon from "../../assets/icons/video-file-icon.svg";
import FileIcon from "../../assets/icons/video-file-icon.svg";
import { PdfPreviewCard } from "./pdf-view-card";
import useIsMobile from "@/hooks/useIsMobile";
import { Button } from "../ui/button";

export function BrandMediaViewer({ brandMedia }: { brandMedia: BrandMedia[] }) {
  const isMobile = useIsMobile();
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>("");

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
    <>
      {brandMedia?.length > 0 && (
        <div>
          <h2 className="mb-2 text-xl font-semibold">Brand Media</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4">
            {brandMedia.map((media, index) => {
              const mediaUrl = imageUrlFormatter(media.fileUrl);
              const type: FileType = getFileType(media?.fileName || "");
              const isImage = type === "image";
              const isVideo = type === "video";
              const isPDF = type === "pdf";

              const isWord = type === "word";

              const icon = IconForFile(media?.fileName);
              return (
                <Card
                  key={index}
                  className="gap-0 overflow-hidden p-0"
                  onClick={() => {
                    setPreviewFile(mediaUrl);
                    setPreviewFileName(media?.fileName);
                  }}
                >
                  <CardContent className="relative h-30 overflow-hidden p-0 md:h-40">
                    {isImage ? (
                      <Image
                        src={mediaUrl}
                        alt={media.fileName}
                        fill
                        className="h-auto w-full object-fill"
                      />
                    ) : isVideo ? (
                      <video controls className="h-auto w-full">
                        <source src={mediaUrl} />
                      </video>
                    ) : isPDF ? (
                      <PdfPreviewCard
                        mediaUrl={mediaUrl}
                        onClick={() => {
                          setPreviewFile(mediaUrl);
                        }}
                      />
                    ) : isWord ? (
                      <iframe
                        src={`https://docs.google.com/gview?url=${encodeURIComponent(
                          mediaUrl,
                        )}&embedded=true`}
                        width="100%"
                        height="600px"
                        className="no-scrollbar pointer-events-none"
                      />
                    ) : (
                      <div className="flex flex-col">
                        <div>
                          <div className="text-muted-foreground flex flex-col items-center gap-2 p-4 text-sm">
                            <OctagonAlertIcon className="size-8 text-yellow-600" />
                            <span>
                              This file can’t be previewed, but you can{" "}
                              <a
                                href={mediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline"
                              >
                                download it instead
                              </a>
                              .
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex items-center justify-start gap-2 p-2">
                    <div className="relative size-8">
                      <Image
                        src={icon}
                        alt=""
                        fill
                        className="h-full w-full object-center"
                      />
                    </div>
                    <span className="text-primary text-xs">
                      {isMobile
                        ? truncateMiddle(media?.fileName, 15, 8, 4)
                        : truncateMiddle(media?.fileName, 20, 18, 4)}
                    </span>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70"
          onClick={() => {
            setPreviewFile(null);
            setPreviewFileName("");
          }} // Close modal on background click
        >
          <div
            className="flex h-fit w-fit flex-col items-center justify-center rounded-lg bg-white p-4"
            onClick={(e) => e.stopPropagation()} // Prevent background click from closing modal
          >
            <div className="flex w-full items-center justify-between">
              <div className="text-primary flex font-semibold">
                {previewFileName}
              </div>
              <div className="mb-3 flex flex-row items-center justify-between gap-4">
                <Button variant={"default"} className="" asChild>
                  <a
                    href={`${previewFile}&response-content-disposition=attachment`}
                    download
                    className="text-primary flex items-center"
                    target="_blank"
                  >
                    Download
                    <DownloadIcon className="size-4" />
                  </a>
                </Button>

                <Button
                  onClick={() => {
                    setPreviewFile(null);
                    setPreviewFileName("");
                  }}
                  variant={"secondary"}
                >
                  Close
                  <XIcon className="size-4" />
                </Button>
              </div>
            </div>
            <FileViewer url={previewFile} fileName={previewFileName} />
          </div>
        </div>
      )}
    </>
  );
}
