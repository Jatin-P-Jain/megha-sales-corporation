import { cookies } from "next/headers";
import { auth } from "@/firebase/server";
import type { UserRole } from "@/types/userGate";
import { AdminServiceCards } from "./admin-service-cards";

const AdminDashboard = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  const verifiedToken = token ? await auth.verifyIdToken(token) : null;
  const userRole = (verifiedToken?.userRole ?? "admin") as UserRole;

  return (
    <div className="container mx-auto flex max-w-4xl flex-col gap-4 p-2">
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
