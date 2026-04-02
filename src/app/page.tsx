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
  searchParams: Promise<{ page?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;

  let verifiedToken: { admin?: boolean; exp?: number } | null = null;

  if (token) {
    try {
      verifiedToken = await auth.verifyIdToken(token);
    } catch (err: unknown) {
      if ((err as { code?: string }).code === "auth/id-token-expired") {
        return redirect(
          `/api/refresh-token?redirect=${encodeURIComponent("/")}`,
        );
      }
      return redirect("/login");
    }
  }

  const isAdmin = !!verifiedToken?.admin;
  const exp = verifiedToken?.exp;

  if (exp && (exp - 5 * 60) * 1000 < Date.now()) {
    redirect(`/api/refresh-token?redirect=${encodeURIComponent("/")}`);
  }

  const sp = await searchParams;
  const page = sp?.page ? parseInt(sp.page) : 1;

  const brandFilters: BrandStatus[] = [];
  if (!isAdmin || !verifiedToken) brandFilters.push("live");

  const brandsPromise = getBrands({
    filters: { status: brandFilters },
    pagination: { page, pageSize: PAGE_SIZE + 10 },
  });

  return (
    <main className="mx-auto flex max-w-screen-lg flex-col items-center justify-center">
      <HomePage brandsPromise={brandsPromise} />
    </main>
  );
}
