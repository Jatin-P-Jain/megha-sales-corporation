import PropertyStatusBadge from "@/components/custom/property-status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Property } from "@/types/property";
import { EyeIcon, PencilIcon } from "lucide-react";
import Link from "next/link";

export default async function PropertiesTable({
  data,
  page,
  totalPages,
  isFavouritesTable,
}: {
  data: Property[];
  page: number;
  totalPages: number;
  isFavouritesTable?: boolean;
}) {
  return (
    <>
      {(!data || data.length == 0) && (
        <h1 className="py-20 text-center text-3xl font-bold text-zinc-400">
          {`You have no ${isFavouritesTable ? "favourited" : ""} properties.`}
        </h1>
      )}
      {data.length > 0 && (
        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead>Address</TableHead>
              <TableHead>Listing Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((property) => {
              const address = [
                property.address1,
                property.address2,
                property.city,
                property.postalCode,
              ]
                .filter((addressLine) => !!addressLine)
                .join(",");
              return (
                <TableRow key={property.id}>
                  <TableCell className="max-w-[100px] truncate overflow-hidden text-ellipsis whitespace-nowrap sm:max-w-[400px]">
                    {address}
                  </TableCell>
                  <TableCell>
                    ₹
                    {new Intl.NumberFormat("en-IN", {
                      maximumSignificantDigits: 3,
                    }).format(property.price)}
                  </TableCell>
                  <TableCell>
                    <PropertyStatusBadge status={property.status} />
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button asChild variant={"outline"} size={"sm"}>
                      <Link href={`/property/${property.id}`}>
                        <EyeIcon />
                      </Link>
                    </Button>
                    {isFavouritesTable ? (
                      <></>
                    ) : (
                      <Button asChild variant={"outline"} size={"sm"}>
                        <Link
                          href={`/admin-dashboard/edit-property/${property.id}`}
                        >
                          <PencilIcon />
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          {totalPages != 1 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    return (
                      <Button
                        disabled={page === i + 1}
                        asChild={page !== i + 1}
                        className="mx-2"
                        variant={"outline"}
                        key={i}
                      >
                        <Link
                          href={`${
                            isFavouritesTable
                              ? "/account/my-favourites"
                              : "/admin-dashboard"
                          }?page=${i + 1}`}
                        >
                          {i + 1}
                        </Link>
                      </Button>
                    );
                  })}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      )}
    </>
  );
}
