import EnquiriesList from "./enquiries-list";
import { requireProfileCompleteOrRedirect } from "@/lib/auth/gaurds";
import EnquirySearchFiltersCreate from "@/components/custom/enquiry-search-filters-create";

export default async function Enquiries() {
  const verifiedToken =
    await requireProfileCompleteOrRedirect("/order-history");
  const isAdmin = Boolean(verifiedToken?.admin);

  return (
    <div className="mx-auto flex w-full flex-col gap-4">
      <div
        className={`fixed inset-x-0 top-0 z-30 mx-auto flex h-45 md:h-50 w-full max-w-6xl flex-col items-end justify-end rounded-lg bg-white px-4 pb-4 shadow-md`}
      >
        <div className="flex w-full flex-col gap-2">
          <div className="flex w-full flex-col items-start justify-between bg-">
            <h1 className="text-xl font-semibold tracking-wide text-cyan-950 md:text-2xl">
              <span className="text-lg">
                {isAdmin ? "Enquiry Management" : "Help Center"}
              </span>
            </h1>
            <span className="text-sm text-muted-foreground">
              {isAdmin ? "Manage all the queries from one place" : "All your queries at one place"}
            </span>
          </div>
          <EnquirySearchFiltersCreate />
        </div>
      </div>
      <div className={`flex w-full flex-1 overflow-auto pt-25`}>
        <EnquiriesList isAdmin={isAdmin} userId={verifiedToken?.uid} />
      </div>
    </div>
  );
}
