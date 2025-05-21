import { Loader2Icon } from "lucide-react";

export default function Loading() {
  return (
    <div className="absolute top-0 left-0 flex h-screen w-full flex-col items-center justify-center gap-4 p-6">
      <Loader2Icon className="animate-spin" />
      <div className="text-2xl font-bold text-gray-700">Loading page...</div>
      <div className="flex flex-col gap-2 text-center text-sm font-semibold text-gray-500 md:text-lg">
        Please wait!{" "}
        <span className="font-normal">
          The content is being loaded for you.
        </span>
      </div>
    </div>
  );
}
