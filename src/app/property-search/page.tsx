import { Card } from "@/components/ui/card";
import { getProperties } from "@/data/properties";
import getUserFavourites from "@/data/favourites";
import { cookies } from "next/headers";
import { auth } from "@/firebase/server";
import ResponsiveFilter from "@/components/custom/responsive-filters-form";
import { Suspense } from "react";
import PropertyGrid from "./property-grid";
import PropertyCardLoading from "./property-card-loading";

export default async function PropertySearch({
  searchParams,
}: {
  searchParams: Promise<{
    page: string;
    minPrice: string;
    maxPrice: string;
    minBedrooms: string;
  }>;
}) {
  const searchParamsValues = await searchParams;
  const parsedPage = parseInt(searchParamsValues.page);
  const parsedMinPrice = parseInt(searchParamsValues.minPrice);
  const parsedMaxPrice = parseInt(searchParamsValues.maxPrice);
  const parsedMinBedrooms = parseInt(searchParamsValues.minBedrooms);
  const page = isNaN(parsedPage) ? 1 : parsedPage;
  const minPrice = isNaN(parsedMinPrice) ? null : parsedMinPrice;
  const maxPrice = isNaN(parsedMaxPrice) ? null : parsedMaxPrice;
  const minBedrooms = isNaN(parsedMinBedrooms) ? null : parsedMinBedrooms;

  const propertiesPromise = getProperties({
    filters: {
      minPrice: minPrice,
      maxPrice: maxPrice,
      minBedrooms: minBedrooms,
      status: ["for-sale"],
    },
    pagination: { page: page, pageSize: 6 },
  });

  const favouritesPromise = getUserFavourites();

  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;

  return (
    <div className="max-w-6xl mx-auto p-3 py-6">
      <h1 className="text-2xl font-[600] text-sky-950 py-4 tracking-wide">
        Property Search
      </h1>
      <div className="flex flex-col gap-4">
        <Card className="p-3 gap-0 sm:p-5 ">
          <ResponsiveFilter />
        </Card>
        <Suspense
          fallback={
            <div className="grid sm:grid-cols-2 md:grid-cols-3 grid-cols-1 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <PropertyCardLoading key={index} />
              ))}
            </div>
          }
        >
          <PropertyGrid
            propertiesPromise={propertiesPromise}
            favouritesPromise={favouritesPromise}
            verifiedTokenPromise={token ? auth.verifyIdToken(token) : null}
            searchParamsValues={searchParamsValues}
            page={page}
          />
        </Suspense>
      </div>
    </div>
  );
}
