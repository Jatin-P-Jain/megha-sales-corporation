import Image from "next/image";
import BrandLogo from "../../../../../public/brand-logo-colored.svg";

export default function Loading() {
  return (
    <div className="absolute top-0 left-0 flex h-screen w-full flex-col items-center justify-center gap-6 p-6">
      {/* Logo with spinner ring around it */}
      <div className="relative flex h-24 w-24 items-center justify-center md:h-32 md:w-32">
        {/* Spinning ring */}
        <span className="border-primary/80 absolute inset-0 animate-spin rounded-full border-4 border-t-transparent" />
        {/* Logo */}
        <Image
          src={BrandLogo}
          alt="Megha Sales Corporation Logo"
          width={60}
          height={60}
          className="h-16 w-16 animate-pulse object-contain md:h-16 md:w-16"
        />
      </div>

      {/* Text below */}
      <div className="flex flex-col items-center gap-1 text-center">
        <div className="text-sm font-semibold text-gray-500 md:text-base">
          Please wait while the page loads...
        </div>
        <div className="text-xs text-gray-400 md:text-sm">
          This may take a few seconds.
        </div>
      </div>
    </div>
  );
}
