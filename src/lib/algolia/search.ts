import { ProductHit } from "@/types/product";
import { algoliasearch } from "algoliasearch";

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID as string,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY as string,
);

export async function searchProducts(query: string) {
  const res = await searchClient.searchSingleIndex<ProductHit>({
    indexName: "products",
    searchParams: { query },
  });
  return res.hits;
}
