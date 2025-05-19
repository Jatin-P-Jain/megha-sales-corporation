import { Loader2Icon } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex w-full items-center justify-center flex-col gap-4 absolute h-screen top-0 left-0">
      <Loader2Icon className="animate-spin" />
      <div className="text-2xl font-bold text-gray-700">Loading page...</div>
      <div className="text-lg text-gray-500">
        Please wait while the content is being loaded for you.
      </div>
    </div>
  );
}
