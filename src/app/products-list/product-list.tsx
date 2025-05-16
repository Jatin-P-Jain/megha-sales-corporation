import ProductImage from "@/components/custom/product-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { slugify } from "@/lib/utils";
import { Product } from "@/types/product";
import { PencilIcon, PlusSquareIcon } from "lucide-react";
import Link from "next/link";

export default async function ProductList({
  productsPromise,
  isAdmin,
  searchParamsValues,
  page,
}: {
  productsPromise: Promise<{ data: Product[]; totalPages: number }>;
  isAdmin: boolean;
  searchParamsValues: {
    page: string;
  };
  page: number;
}) {
  const [products] = await Promise.all([productsPromise]);
  const { data, totalPages } = products;
  console.log({ searchParamsValues });

  return (
    <>
      {data.length > 0 && (
        <div className="flex h-full min-h-[calc(100vh-300px)] w-full flex-1 flex-col justify-between">
          <div className="flex w-full flex-1 flex-grow flex-col gap-5">
            {data.map((product) => {
              return (
                <Card
                  key={product?.id}
                  className="relative gap-0 overflow-hidden p-4 px-1 shadow-md"
                >
                  <CardContent className="grid text-sm md:grid-cols-[3fr_1fr] md:text-base">
                    <div className="flex flex-col gap-1 md:w-3/4 md:gap-2">
                      <div className="text-primary flex w-full items-center justify-between font-bold">
                        <span className="text-sm font-normal">Brand :</span>
                        {product.brandName}
                      </div>
                      <div className="text-primary flex w-full items-center justify-between font-bold">
                        <span className="text-sm font-normal">Part Name :</span>
                        <span className="line-clamp-1">{product.partName}</span>
                      </div>
                      <div className="text-primary flex w-full items-center justify-between font-bold">
                        <span className="text-sm font-normal">
                          Part Number :
                        </span>
                        {product.partNumber}
                      </div>

                      <div className="text-primary flex w-full items-center justify-between font-bold">
                        <span className="w-full text-sm font-normal">
                          Vehicle Name :
                        </span>
                        <span className="line-clamp-1">
                          {" "}
                          {product.vehicleCompany + " - "}
                          {product?.vehicleName?.map((vehicleName, index) => {
                            if (
                              product?.vehicleName &&
                              index == product?.vehicleName?.length - 1
                            ) {
                              return <span key={index}>{vehicleName} </span>;
                            } else {
                              return <span key={index}>{vehicleName}, </span>;
                            }
                          })}
                        </span>
                      </div>
                      <div className="text-primary flex w-full items-center justify-between font-bold">
                        <span className="text-sm font-normal">Category :</span>{" "}
                        {product.partCategory}
                      </div>
                    </div>
                    <div className="flex min-h-15 w-full items-end justify-end justify-self-end md:min-h-30 md:w-3/4">
                      <ProductImage productImage={product?.image} />
                    </div>
                  </CardContent>
                  <CardFooter className="grid grid-cols-2 items-end justify-center md:grid-cols-[3fr_1fr]">
                    <div className="flex w-full flex-col items-start justify-start md:flex-row md:justify-between">
                      <div className="text-primary flex items-center gap-2 text-lg font-semibold">
                        <span className="text-foreground text-base font-normal">
                          Price :
                        </span>
                        ₹{product?.price}
                      </div>
                      <div className="text-primary flex items-center gap-2 text-sm font-semibold">
                        <span className="text-foreground text-sm font-normal">
                          Discount :
                        </span>
                        {product?.discount}%
                      </div>
                      <div className="text-primary flex items-center gap-2 text-sm font-semibold">
                        <span className="text-foreground font-normal">
                          GST :
                        </span>
                        {product?.gst}%
                      </div>
                    </div>
                    <div className="flex w-full items-center justify-end">
                      {isAdmin ? (
                        <Button variant={"outline"} asChild>
                          <Link
                            href={`/admin-dashboard/edit-product/${slugify(product?.brandName)}/${product?.id}`}
                          >
                            <PencilIcon />
                            Edit Product
                          </Link>
                        </Button>
                      ) : (
                        <Button className="w-full md:w-3/4">
                          <PlusSquareIcon className="size-4" />
                          Add to Cart
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-4 p-2">
            {Array.from({ length: totalPages }).map((_, i) => {
              const newSearchParams = new URLSearchParams();
              // if (searchParamsValues.minPrice) {
              //   newSearchParams.set("minPrice", searchParamsValues.minPrice);
              // }
              // if (searchParamsValues.maxPrice) {
              //   newSearchParams.set("maxPrice", searchParamsValues.maxPrice);
              // }
              // if (searchParamsValues.minBedrooms) {
              //   newSearchParams.set(
              //     "minBedrooms",
              //     searchParamsValues.minBedrooms,
              //   );
              // }
              newSearchParams.set("page", `${i + 1}`);
              return (
                <Button
                  asChild={page != i + 1}
                  disabled={i + 1 === page}
                  key={i}
                  variant={"outline"}
                >
                  <Link href={`/products-list?${newSearchParams}`}>
                    {i + 1}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      )}
      {data.length === 0 && (
        <div className="text-center font-medium text-cyan-900">
          No Products found
        </div>
      )}
    </>
  );
}
