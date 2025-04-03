import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import FiltersForm from "./filters-form";
import { Suspense } from "react";
import { getProperties } from "@/data/properties";
import imageUrlFormatter from "@/lib/image-urlFormatter";
import Image from "next/image";
import { BathIcon, BedIcon, HeartIcon, HomeIcon } from "lucide-react";
import currencyFormatter from "@/lib/currency-formatter";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function PropertySearch({
  searchParams,
}: {
  searchParams: Promise<any>;
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
    pagination: { page: page, pageSize: 3 },
  });

  const { data, totalPages } = properties;

  // console.log({ data });

  return (
    <div className="max-w-6xl mx-auto p-3 py-6">
      <h1 className="text-2xl font-[600] text-sky-950 py-4 tracking-wide">
        Property Search
      </h1>
      <div className="flex flex-col gap-4">
        <Card className="p-5">
          <div>
            <div className="text-lg mb-0">Filters</div>
          </div>
          <div>
            <Suspense>
              <FiltersForm />
            </Suspense>
          </div>
        </Card>
        <div className="grid grid-cols-3 mt-5 gap-5 ">
          {data.map((property, index) => {
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
                    <div className="text-sky-900 font-medium tracking-wide">
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
                <div className="bg-white w-8 h-8 absolute top-0 right-0 rounded-bl-2xl cursor-pointer flex items-center justify-center">
                  <HeartIcon className="" size="16" />
                </div>
              </Card>
            );
          })}
        </div>
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
