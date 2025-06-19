import { Loader2Icon } from "lucide-react";
import { useState } from "react";

type FilePreviewProps = {
  mediaUrl: string;
  onClick: () => void;
};

export function PdfPreviewCard({ mediaUrl, onClick }: FilePreviewProps) {
  const [loading, setLoading] = useState(true);

  return (
    <div
      className="bg-muted relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded"
      onClick={onClick}
    >
      {loading && (
        <div className="bg-muted/60 absolute inset-0 z-10 flex items-center justify-center">
          <Loader2Icon className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      )}

      <object
        className="no-scrollbar pointer-events-none h-full w-full ml-2"
        data={mediaUrl}
        type="application/pdf"
        onLoad={() => setLoading(false)}
      >
        <p className="text-muted-foreground p-4 text-sm">
          Unable to display PDF.
        </p>
      </object>
    </div>
  );
}
