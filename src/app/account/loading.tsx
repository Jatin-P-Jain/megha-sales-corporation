import { Loader2Icon } from "lucide-react";

export default function Loading() {
  return (
    <div className="absolute top-0 left-0 flex h-screen w-full flex-col items-center justify-center gap-4">
      <Loader2Icon className="animate-spin" />
      <div className="text-2xl font-bold text-gray-700">Loading page...</div>
      <div className="text-lg text-gray-500">
        Please wait while the content is being loaded for you.
      </div>
    </div>
  );
}
