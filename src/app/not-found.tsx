import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen overflow-hidden w-full max-w-md text-center px-1 md:px-4">
      <h1 className="text-xl md:text-4xl font-bold mb-4">Page Coming Soon</h1>
      <p className="text-md md:text-lg text-gray-700 mb-2">
        We are putting the finishing touches on this page. Hang tight!
      </p>
      <p className="text-xs md:text-sm text-gray-500 mb-6">
        Expect it to be live within the next few days.
      </p>
      <Button asChild>
        <Link href="/">← Back to Home</Link>
      </Button>
    </div>
  );
}
