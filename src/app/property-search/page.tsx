import { Card, CardContent } from "@/components/ui/card";
import { getProperties } from "@/data/properties";
import imageUrlFormatter from "@/lib/image-urlFormatter";
import Image from "next/image";
import { BathIcon, BedIcon, HomeIcon } from "lucide-react";
import currencyFormatter from "@/lib/currency-formatter";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import FavouriteButton from "@/components/custom/toggle-favourites";
import getUserFavourites from "@/data/favourites";
import { cookies } from "next/headers";
import { auth } from "@/firebase/server";
import { DecodedIdToken } from "firebase-admin/auth";
import ResponsiveFilter from "@/components/custom/responsive-filters-form";

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

  const properties = await getProperties({
    filters: {
      minPrice: minPrice,
      maxPrice: maxPrice,
      minBedrooms: minBedrooms,
      status: ["for-sale"],
    },
    pagination: { page: page, pageSize: 6 },
  });

  const { data, totalPages } = properties;

  const favourites = await getUserFavourites();

  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  let verifiedToken: DecodedIdToken | null;

  if (token) {
    verifiedToken = await auth.verifyIdToken(token);
  }

  return (
    <div className="max-w-6xl mx-auto p-3 py-6">
      <h1 className="text-2xl font-[600] text-sky-950 py-4 tracking-wide">
        Property Search
      </h1>
      <div className="flex flex-col gap-4">
        <Card className="p-5">
          <ResponsiveFilter />
        </Card>
        {data.length > 0 && (
          <div className="grid grid-cols-1 mt-5 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {data.map((property) => {
              const addressLine = [
                property.address1,
                property.address2,
                property.city,
                property.postalCode,
              ]
                .filter((line) => !!line)
                .join(", ");
              return (
                <Card
                  key={property.id}
                  className="p-0 overflow-hidden relative"
                >
                  <CardContent className="p-0 ">
                    <div className="h-55 relative bg-sky-100 flex flex-col items-center justify-center text-black/40">
                      {(!verifiedToken || !verifiedToken.admin) && (
                        <FavouriteButton
                          propertyId={property.id}
                          isFavourite={favourites[property.id]}
                        />
                      )}
                      {!!property?.images?.[0] ? (
                        <Image
                          src={imageUrlFormatter(property.images[0])}
                          alt="img"
                          fill
                          className="object-center"
                        />
                      ) : (
                        <>
                          <HomeIcon />
                          <small>No Image</small>
                        </>
                      )}
                    </div>
                    <div className="flex flex-col p-5.5 gap-5">
                      <div className="text-sky-900 font-medium tracking-wide line-clamp-2">
                        {addressLine}
                      </div>
                      <div className="flex gap-6 ">
                        <div className="flex text-sky-900 font-medium gap-2">
                          <BedIcon />
                          {property.bedrooms}
                        </div>
                        <div className="flex text-sky-900 font-medium gap-2">
                          <BathIcon />
                          {property.bathrooms}
                        </div>
                      </div>
                      <div className="text-lg font-medium">
                        {currencyFormatter(property.price)}
                      </div>
                      <div className="flex w-full items-center justify-center ">
                        <Button asChild>
                          <Link href={`/property/${property.id}`}>
                            View Property
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        {data.length === 0 && (
          <div className="text-center text-sky-900 font-medium">
            No properties found
          </div>
        )}
      </div>
      <div className="flex gap-4 items-center justify-center p-6">
        {Array.from({ length: totalPages }).map((_, i) => {
          const newSearchParams = new URLSearchParams();
          if (searchParamsValues.minPrice) {
            newSearchParams.set("minPrice", searchParamsValues.minPrice);
          }
          if (searchParamsValues.maxPrice) {
            newSearchParams.set("maxPrice", searchParamsValues.maxPrice);
          }
          if (searchParamsValues.minBedrooms) {
            newSearchParams.set("minBedrooms", searchParamsValues.minBedrooms);
          }
          newSearchParams.set("page", `${i + 1}`);
          return (
            <Button
              asChild={page != i + 1}
              disabled={i + 1 === page}
              key={i}
              variant={"outline"}
            >
              <Link href={`/property-search?${newSearchParams}`}>{i + 1}</Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
