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
        <object
          className={"h-full w-full aspect-[4/3]"}
          data={url}
          type="application/pdf"
        >
          <p className="text-muted-foreground bg-muted p-4 rounded flex w-full flex-col">
            Unable to display PDF.
          </p>
        </object>
      );

    case "excel":
      return (
        <iframe
          className={className}
          src={`https://docs.google.com/gview?url=${encodeURIComponent(
            url
          )}&embedded=true`}
          width="100%"
          height="600px"
        />
      );

    case "word":
      return (
        <iframe
          className={className}
          src={`https://docs.google.com/gview?url=${encodeURIComponent(
            url
          )}&embedded=true`}
          width="100%"
          height="600px"
        />
      );

    default:
      return (
        <a className={className} href={url} download>
          Download {fileName}
        </a>
      );
  }
}
