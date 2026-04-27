import type { UserRole } from "@/types/userGate";
import { AdminServiceCards } from "./admin-service-cards";
import {
  getUserRoleFromClaims,
  requireAllowedRolesOrRedirect,
} from "@/lib/auth/gaurds";

const AdminDashboard = async () => {
  const verifiedToken = await requireAllowedRolesOrRedirect(
    ["admin", "sales"],
    "/",
  );
  const userRole = getUserRoleFromClaims(verifiedToken) as UserRole;

  return (
    <div className="container mx-auto flex max-w-4xl flex-col gap-3">
      <div>
        <h1 className="text-xl font-bold md:text-2xl">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Manage your application from here
        </p>
      </div>
      <AdminServiceCards userRole={userRole} />
    </div>
  );
};

export default AdminDashboard;
