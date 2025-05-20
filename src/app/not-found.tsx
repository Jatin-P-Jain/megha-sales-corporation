import GoHomeButton from "@/components/custom/go-home-button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center overflow-hidden px-1 text-center md:px-4">
      <h1 className="mb-4 text-xl font-bold md:text-4xl">Page Coming Soon</h1>
      <p className="text-md mb-2 text-gray-700 md:text-lg">
        We are putting the finishing touches on this page. Hang tight!
      </p>
      <p className="mb-6 text-xs text-gray-500 md:text-sm">
        Expect it to be live within the next few days.
      </p>
      <GoHomeButton />
    </div>
  );
}
