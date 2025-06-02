import HomePage from "./home-page";
import { getBrands } from "@/data/brands";
import { BrandStatus } from "@/types/brandStatus";
import { auth } from "@/firebase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  const verifiedToken = token ? await auth.verifyIdToken(token) : null;
  const isAdmin = verifiedToken?.admin;

  const exp = verifiedToken?.exp;

  if (exp && (exp - 5 * 60) * 1000 < Date.now()) {
    redirect(`/api/refresh-token?redirect=${"/"}`);
  }

  const searchParamsValue = await searchParams;
  const page = searchParamsValue?.page ? parseInt(searchParamsValue.page) : 1;
  const brandFilters: BrandStatus[] = [];
  if (!isAdmin || !verifiedToken) {
    brandFilters.push("live");
  } else {
  }
  console.log({ brandFilters });

  const brandsPromise = getBrands({
    filters: { status: brandFilters },
    pagination: { page, pageSize: 10 },
  });
  return (
    <main className="mx-auto flex h-full max-w-screen-lg flex-col items-center justify-center p-3 px-4 md:p-8 lg:p-10">
      <HomePage brandsPromise={brandsPromise} />
    </main>
  );
}
