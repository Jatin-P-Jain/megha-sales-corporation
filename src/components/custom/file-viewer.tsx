"use client";
import { getFileType } from "@/lib/utils";
import Image from "next/image";

type FileViewerProps = {
  url: string;
  fileName: string;
  className?: string;
};

export function FileViewer({ url, fileName, className }: FileViewerProps) {
  const type = getFileType(fileName);

  switch (type) {
    case "image":
      return (
        <div className={className}>
          <Image
            src={url}
            alt={fileName}
            width={300}
            height={200}
            objectFit="contain"
          />
        </div>
      );

    case "video":
      return <video className={"h-[70vh]"} src={url} controls />;

    case "pdf":
      return (
        <div className="flex h-[80vh] w-[90vw] items-center justify-center">
          <object
            className={"aspect-[4/3] h-full w-full"}
            data={url}
            type="application/pdf"
          >
            <p className="text-muted-foreground bg-muted flex w-full flex-col rounded p-4">
              Unable to display PDF.
            </p>
            <a className={className} href={url} download>
              Download {fileName}
            </a>
          </object>
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
