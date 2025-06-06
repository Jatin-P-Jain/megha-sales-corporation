import HomePage from "./home-page";
import { getBrands } from "@/data/brands";
import { BrandStatus } from "@/types/brandStatus";
import { auth } from "@/firebase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PAGE_SIZE } from "@/lib/utils";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  let verifiedToken: { admin?: boolean; exp?: number } | null = null;

  if (token) {
    try {
      // If the token is expired or invalid, this throws
      verifiedToken = await auth.verifyIdToken(token);
    } catch (err: unknown) {
      // If it’s specifically “token expired,” send them to refresh (or login)
      if ((err as { code?: string }).code === "auth/id-token-expired") {
        // Redirect to your refresh‐route (which should get a new ID token)
        return redirect(
          `/api/refresh-token?redirect=${encodeURIComponent("/")}`,
        );
      }
      // Any other verification error → force them to log in
      return redirect("/login");
    }
  }
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

  const brandsPromise = getBrands({
    filters: { status: brandFilters },
    pagination: { page, pageSize: PAGE_SIZE + 10 },
  });
  return (
    <main className="mx-auto flex h-full max-w-screen-lg flex-col items-center justify-center p-4 px-4 pb-8 md:p-8 lg:p-10">
      <HomePage brandsPromise={brandsPromise} />
    </main>
  );
}
