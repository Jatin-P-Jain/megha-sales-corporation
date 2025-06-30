"use client";
import { getFileType } from "@/lib/utils";
import ImageViewer from "./image-viewer";
import PdfViewer from "./pdf-view-card";

type FileViewerProps = {
  url: string;
  fileName: string;
  className?: string;
};

export function FileViewer({ url, fileName, className }: FileViewerProps) {
  const type = getFileType(fileName);

  switch (type) {
    case "image":
      return <ImageViewer url={url} fileName={fileName} />;

    case "video":
      return <video className={"h-[70vh]"} src={url} controls />;

    case "pdf":
      return (
        <div className="flex h-full w-full items-center justify-center">
          <PdfViewer pdfUrl={url} width="100%" />
        </div>
      );

    case "excel":
      return (
        <iframe
          className={className}
          src={`https://docs.google.com/gview?url=${encodeURIComponent(
            url,
          )}&embedded=true`}
          width="100%"
          height="600px"
        />
      );

    case "word":
      return (
        <div className="h-[80vh] w-[90vw]">
          <iframe
            className={className}
            src={`https://docs.google.com/gview?url=${encodeURIComponent(
              url,
            )}&embedded=true`}
            width="100%"
            height="100%"
          />
        </div>
      );

    default:
      return (
        <a className={className} href={url} download>
          Download {fileName}
        </a>
      );
  }
}
