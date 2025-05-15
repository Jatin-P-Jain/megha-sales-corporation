
import { Loader2Icon } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex w-full items-center justify-center flex-col gap-4 absolute h-screen top-0 left-0 p-6">
      <Loader2Icon className="animate-spin" />
      <div className="text-2xl font-bold text-gray-700">Loading page...</div>
      <div className="flex flex-col text-sm md:text-lg text-gray-500 text-center gap-2 font-semibold">
        Please wait!{" "}
        <span className="font-normal">
          The content is being loaded for you.
        </span>
      </div>
    </div>
  );
}
