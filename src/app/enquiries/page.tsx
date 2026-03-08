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
        className={`fixed inset-x-0 top-0 z-30 mx-auto flex h-48 w-full max-w-6xl flex-col items-end justify-end rounded-lg bg-white px-4 shadow-md pb-4`}
      >
        <div className="mx-auto flex w-full flex-col ">
          <div className="mb-0 flex w-full flex-row items-center justify-between">
            <h1 className="py-2 text-xl font-semibold tracking-wide text-cyan-950 md:text-2xl">
              <span className="text-xl">Enquiry Management</span>
            </h1>
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
