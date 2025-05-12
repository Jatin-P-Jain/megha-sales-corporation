// components/FileViewer.tsx
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
  console.log("type -- ", type);

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
          className={"h-[100vh]"}
          data={url}
          type="application/pdf"
          width="200%"
        >
          <p>
            Unable to display PDF. <a href={url}>Download instead</a>.
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
