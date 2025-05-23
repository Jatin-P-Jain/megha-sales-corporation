import PropertyStatusBadge from "@/components/custom/property-status-badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { getPropertyById } from "@/data/properties";
import { BathIcon, BedIcon } from "lucide-react";
import BackButton from "./back-button";
import PropertyImage from "./property-image";
import MapComponent from "@/components/custom/google-map";
import Description from "./description";

export const dynamic = "force-static";

export default async function EditProperty({
  params,
}: {
  params: Promise<{ propertyId: string }>;
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
    <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_30vw]">
      <div className="order-2 md:order-1 pb-60 md:pb-0">
        {!!property.images && (
          <Carousel className="w-full">
            <CarouselContent>
              {property?.images?.map((image, index) => (
                <CarouselItem key={image}>
                  <div className="relative h-[15vh] lg:h-[70vh] min-h-70">
                    <PropertyImage image={image} index={index} />
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
          className={
            "property-description max-w-screen mx-auto py-5 lg:py-10  px-10 lg:px-20"
          }
        >
          <BackButton />
          <Description description={property.description} />
          <MapComponent address={addressLines.join(",")} />
        </div>
      </div>
      <div className="order-1 md:order-2 bg-blue-300 md:bg-blue-300/65 md:h-screen md:sticky fixed bottom-0 w-full md:top-0 grid p-4 px-5 md:p-40 md:px-10 rounded-t-3xl md:rounded-none z-10">
        <div className="flex flex-col gap-3 md:gap-10 w-full">
          <PropertyStatusBadge
            status={property.status}
            className="text-sm font-medium"
          />
          <h1 className="text-sm md:text-2xl font-semibold tracking-wide text-black/80">
            {addressLines.map((addressLine, index) => (
              <div key={index}>
                {addressLine}
                {index < addressLines.length - 1 && ","}
              </div>
            ))}
          </h1>
          <h2 className="font-medium text-lg md:text-3xl">
            ₹
            {new Intl.NumberFormat("en-IN", {
              maximumSignificantDigits: 3,
            }).format(property.price)}
          </h2>
          <div className="flex text-sm sm:text-md md:flex-col xl:flex-row gap-8 text-black/80 font-medium justify-start justify-self-start">
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
