import { ProductHit } from "@/types/product";
import { algoliasearch } from "algoliasearch";

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID as string,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY as string
);

export async function searchProducts(query: string) {
  const res = await searchClient.searchSingleIndex<ProductHit>({
    indexName: "products",
    searchParams: { query },
  });
  return res.hits;
}

export async function searchProductsByBrands(
  query: string,
  brandIds: string[] = []
) {
  const scopedBrandIds = brandIds.map((id) => id.trim()).filter(Boolean);

  const filters =
    scopedBrandIds.length > 0
      ? scopedBrandIds
          .map((id) => `brandId:"${id.replace(/"/g, '\\"')}"`)
          .join(" OR ")
      : undefined;

  const res = await searchClient.searchSingleIndex<ProductHit>({
    indexName: "products",
    searchParams: {
      query,
      ...(filters ? { filters } : {}),
    },
  });
  return res.hits;
}
