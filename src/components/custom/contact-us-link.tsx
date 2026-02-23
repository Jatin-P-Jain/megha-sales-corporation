import Link from "next/link";
import Image from "next/image";
import AboutUsContactIcon from "@/assets/icons/about-contact.svg";

export default function ContactUsLink() {
  return (
    <Link
      href="/about-contact"
      className="text-sm tracking-wider whitespace-nowrap uppercase hover:underline md:text-base"
    >
      {/* Mobile (< md) */}
      <span className="relative h-full md:hidden">
        <Image
          src={AboutUsContactIcon}
          alt=""
          width={25}
          height={25}
          className="object-center"
        />
      </span>

      {/* Desktop (>= md) */}
      <span className="hidden h-full items-center justify-center gap-2 md:flex">
        <span className="relative h-full">
          <Image
            src={AboutUsContactIcon}
            alt=""
            width={30}
            height={30}
            className="h-full object-center"
          />
        </span>
        <span className="hidden lg:flex">About & Contact</span>
      </span>
    </Link>
  );
}
