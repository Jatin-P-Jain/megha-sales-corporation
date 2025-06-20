"use client";

import clsx from "clsx";

export default function PdfViewer({
  pdfUrl,
  onClick,
  className,
  width,
}: {
  pdfUrl: string;
  onClick?: () => void;
  className?: string;
  width?: string;
}) {
  return (
    <div className="h-full w-full" onClick={onClick}>
      <iframe
        src={pdfUrl}
        width={width}
        height="100%"
        className={clsx(className)}
      />
    </div>
  );
}
