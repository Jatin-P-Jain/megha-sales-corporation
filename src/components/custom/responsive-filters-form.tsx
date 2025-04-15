"use client";

import FiltersForm from "@/app/property-search/filters-form";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState, Suspense } from "react";

export default function ResponsiveFilter() {
  const [isMobile, setIsMobile] = useState(false);
  const [openFilters, setOpenFilters] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.screen.width <= 768);
    }
  }, []);

  return (
    <>
      <div className="flex flex-row items-center justify-between">
        <div className="text-lg mb-0">Filters</div>
        {isMobile && (
          <div
            className="cursor-pointer"
            onClick={() => setOpenFilters(!openFilters)}
          >
            {openFilters ? <ChevronUp /> : <ChevronDown />}
          </div>
        )}
      </div>
      {!isMobile ? (
        <div>
          <Suspense>
            <FiltersForm />
          </Suspense>
        </div>
      ) : openFilters ? (
        <div>
          <Suspense>
            <FiltersForm />
          </Suspense>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}
