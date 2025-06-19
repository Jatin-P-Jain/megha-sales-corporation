"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";
import useIsMobile from "@/hooks/useIsMobile";

interface AboutBrandButtonProps {
  brandId: string;
  brandName: string;
}

const AboutBrandButton: React.FC<AboutBrandButtonProps> = ({
  brandId,
  brandName,
}) => {
  const isMobile = useIsMobile();
  return (
    <Button
      className="border-1 border-yellow-600 !px-8 !py-2 text-sm text-yellow-600 shadow-md hover:text-yellow-600 md:!px-24 md:!py-4"
      variant="outline"
      asChild
    >
      <Link href={`/brands/${brandId}`}>
        <InfoIcon className="size-5" /> Info
        {!isMobile && (
          <span className="text-base font-semibold">{brandName}</span>
        )}
      </Link>
    </Button>
  );
};

export default AboutBrandButton;
