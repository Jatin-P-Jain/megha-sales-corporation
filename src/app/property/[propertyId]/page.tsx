import PropertyStatusBadge from "@/components/custom/property-status-badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { getPropertyById } from "@/data/properties";
import { ArrowLeftIcon, BathIcon, BedIcon } from "lucide-react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import BackButton from "./back-button";

export default async function EditProperty({
  params,
}: {
  params: Promise<any>;
}) {
  const paramsValue = await params;
  const { propertyId } = paramsValue;
  const property = await getPropertyById(propertyId);
  const addressLines = [
    property.address1,
    property.address2,
    property.city,
    property.postalCode,
  ].filter((line) => !!line);

  return (
    <div className="grid grid-cols-[1fr_500px]">
      <div>
        {!!property.images && (
          <Carousel className="w-full">
            <CarouselContent>
              {property?.images?.map((image, index) => (
                <CarouselItem key={image}>
                  <div className="relative h-[80vh] min-h-80">
                    <Image
                      src={`https://firebasestorage.googleapis.com/v0/b/hot-homes-8a814.firebasestorage.app/o/${encodeURIComponent(
                        image
                      )}?alt=media`}
                      alt={`Image${index}`}
                      fill
                      className="object-center"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {property?.images?.length > 1 && (
              <>
                <CarouselPrevious className="translate-x-20" />
                <CarouselNext className="-translate-x-20" />
              </>
            )}
          </Carousel>
        )}
        <div
          className={"property-description max-w-screen mx-auto py-10 px-20"}
        >
          <BackButton />
          <ReactMarkdown>{property.description}</ReactMarkdown>
        </div>
      </div>
      <div className="bg-blue-300/65 h-screen sticky top-0 grid p-40 px-10">
        <div className="flex flex-col gap-10 w-full">
          <PropertyStatusBadge
            status={property.status}
            className="text-sm font-medium"
          />
          <h1 className="text-2xl font-semibold tracking-wide text-black/80">
            {addressLines.map((addressLine, index) => (
              <div key={index}>
                {addressLine}
                {index < addressLines.length - 1 && ","}
              </div>
            ))}
          </h1>
          <h2 className="font-medium text-3xl">
            ₹
            {new Intl.NumberFormat("en-IN", {
              maximumSignificantDigits: 3,
            }).format(property.price)}
          </h2>
          <div className="flex items-center gap-8 text-black/80 font-medium">
            <p className="flex items-center gap-2">
              <BedIcon /> {property.bedrooms} Bedroom(s)
            </p>
            <p className="flex items-center gap-2">
              <BathIcon /> {property.bedrooms} Bathroom(s)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
