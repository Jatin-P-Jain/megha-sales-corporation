"use client";

import FiltersForm from "@/app/property-search/filters-form";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Suspense, useEffect, useState } from "react";

export default function ResponsiveFilter() {
  const [isMobile, setIsMobile] = useState(true);
  const [openFilters, setOpenFilters] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.screen.width <= 768);
    }
  }, []);

  return (
    <>
      <div className={`flex flex-row items-center justify-between `}>
        <div className="text-lg m-0">Filters</div>
        {isMobile && (
          <div
            className="cursor-pointer"
            onClick={() => setOpenFilters(!openFilters)}
          >
            {openFilters ? <ChevronUp /> : <ChevronDown />}
          </div>
        )}
      </div>
      {isMobile ? (
        <div>
          <Suspense>
            <FiltersForm openFilters={openFilters} />
          </Suspense>
        </div>
      ) : (
        <div>
          <Suspense>
            <FiltersForm openFilters={true} />
          </Suspense>
        </div>
      )}
    </>
  );
}
