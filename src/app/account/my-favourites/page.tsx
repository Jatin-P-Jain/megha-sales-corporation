import PropertiesTable from "@/components/custom/properties-table";
import getUserFavourites from "@/data/favourites";
import { getPropertiesById } from "@/data/properties";
import { redirect } from "next/navigation";

const MyFavourites = async ({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) => {
  const searchParamsValues = await searchParams;
  const page = searchParamsValues.page ? parseInt(searchParamsValues?.page) : 1;
  const pageSize = 2;
  const favourites = await getUserFavourites();
  const allFavourites = Object.keys(favourites);
  const totalPages = Math.ceil(allFavourites.length / pageSize);
  const paginatedFavourites = allFavourites.slice(
    (page - 1) * pageSize,
    page * pageSize
  );
  if (!paginatedFavourites.length && page > 1) {
    redirect(`/account/my-favourites?page=${totalPages}`);
  }
  const favouritesData = await getPropertiesById(paginatedFavourites);

  return (
    <div className="flex flex-col">
      <h1 className="text-3xl text-cyan-950 font-semibold">My Favourites</h1>
      <PropertiesTable
        data={favouritesData}
        totalPages={totalPages}
        page={page}
        isFavouritesTable
      />
    </div>
  );
};

export default MyFavourites;
