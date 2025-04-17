import FavouriteButton from "@/components/custom/toggle-favourites";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import currencyFormatter from "@/lib/currency-formatter";
import imageUrlFormatter from "@/lib/image-urlFormatter";
import { Property } from "@/types/property";
import { DecodedIdToken } from "firebase-admin/auth";
import { BathIcon, BedIcon, HomeIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function PropertyGrid({
  propertiesPromise,
  favouritesPromise,
  verifiedTokenPromise,
  searchParamsValues,
  page,
}: {
  propertiesPromise: Promise<{ data: Property[]; totalPages: number }>;
  favouritesPromise: Promise<Record<string, boolean>>;
  verifiedTokenPromise: Promise<DecodedIdToken> | null;
  searchParamsValues: {
    page: string;
    minPrice: string;
    maxPrice: string;
    minBedrooms: string;
  };
  page: number;
}) {
  const [properties, favourites, verifiedToken] = await Promise.all([
    propertiesPromise,
    favouritesPromise,
    verifiedTokenPromise,
  ]);
  const { data, totalPages } = properties;
  return (
    <>
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
              <Card key={property.id} className="p-0 overflow-hidden relative">
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
    </>
  );
}
