import EnquiriesList from "./enquiries-list";
import {
  getUserRoleFromClaims,
  getVerifiedTokenOrRedirect,
} from "@/lib/auth/gaurds";
import EnquirySearchFiltersCreate from "@/components/custom/enquiry-search-filters-create";
import { redirect } from "next/navigation";

export default async function Enquiries() {
  const verifiedToken = await getVerifiedTokenOrRedirect();
  const role = getUserRoleFromClaims(verifiedToken);
  const isAdmin = role === "admin" || role === "sales";

  // Staff roles (dispatcher/accountant) are not allowed in enquiries.
  if (verifiedToken?.admin && !isAdmin) {
    redirect("/order-history");
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-4">
      <div
        className={`fixed inset-x-0 top-0 z-30 mx-auto flex h-45 w-full max-w-6xl flex-col items-end justify-end rounded-lg bg-white px-4 pb-4 shadow-md md:h-50`}
      >
        <div className="flex w-full flex-col gap-2">
          <div className="bg- flex w-full flex-col items-start justify-between">
            <h1 className="text-xl font-semibold tracking-wide text-cyan-950 md:text-2xl">
              <span className="text-lg">
                {isAdmin ? "Enquiry Management" : "Help Center"}
              </span>
            </h1>
            <span className="text-muted-foreground text-sm">
              {isAdmin
                ? "Manage all the queries from one place"
                : "All your queries at one place"}
            </span>
          </div>
          <EnquirySearchFiltersCreate />
        </div>
      </div>
      <div className={`flex w-full flex-1 overflow-auto pt-27`}>
        <EnquiriesList isAdmin={isAdmin} userId={verifiedToken?.uid} />
      </div>
    </div>
  );
}
