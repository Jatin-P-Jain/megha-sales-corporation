import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen -mt-16 h-screen w-full items-center justify-center flex-col gap-4 relative">
      <Image
        src="/hero.jpg"
        alt="Logo"
        fill
        className="absolute w-full h-full object-cover"
      />
      <div className="size-full bg-black/55 absolute top-0 left-0 backdrop-blur-sm" />
      <div className="text-2xl md:text-4xl stracking-wider font-bold  text-white z-10 w-[70%] text-center flex flex-col gap-2 leading-10">
        Live where your heart feels at home.
        <span className="text-sm md:text-lg font-normal leading-6">
          Carefully curated homes for every lifestyle.
        </span>
        <Button
          className="h-15 uppercase text-sm cursor-pointer border-2 mt-30 w-60 mx-auto"
          asChild
        >
          <Link href={"/property-search"}>
            <SearchIcon className="size-5 mr-0" />
            <span>Explore Now</span>
          </Link>
        </Button>
      </div>
    </main>
  );
}
