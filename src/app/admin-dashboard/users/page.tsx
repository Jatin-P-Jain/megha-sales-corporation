import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/firebase/server";
import EllipsisBreadCrumbs from "@/components/custom/ellipsis-bread-crumbs";
import UserSearchAndFilters from "@/components/custom/user-search-filters";
import UsersList from "./users-list";

export default async function Users() {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  const verifiedToken = token ? await auth.verifyIdToken(token) : null;
  const isAdmin = verifiedToken?.admin;
  const userRole = (verifiedToken?.userRole ?? "admin") as string;
  const canAssignRoles = userRole === "admin";

  // User Directory is admin-only
  if (!isAdmin || userRole !== "admin") {
    redirect("/admin-dashboard");
  }
  const breadcrumbs = [
    {
      href: isAdmin ? "/admin-dashboard/" : "/",
      label: isAdmin ? "Admin Dashboard" : "Home",
    },
    {
      label: "User Management",
    },
  ];

  return (
    <div className="mx-auto flex w-full flex-col gap-4">
      <div
        className={`fixed inset-x-0 top-0 z-30 mx-auto flex h-48 w-full max-w-6xl flex-col items-end justify-end rounded-lg bg-white px-4 shadow-md md:h-55`}
      >
        <div className="mx-auto flex w-full flex-col pt-8 pb-4 md:pt-6 md:pb-4">
          <EllipsisBreadCrumbs items={breadcrumbs} />
          <div className="mb-0 flex w-full flex-row items-center justify-between">
            <h1 className="py-2 text-xl font-semibold tracking-wide text-cyan-950 md:text-2xl">
              <span className="text-xl">User Management</span>
            </h1>
          </div>
          <UserSearchAndFilters />
        </div>
      </div>
      <div className={`flex w-full flex-1 overflow-auto pt-30 md:pt-20`}>
        <UsersList canAssignRoles={canAssignRoles} />
      </div>
    </div>
  );
}
