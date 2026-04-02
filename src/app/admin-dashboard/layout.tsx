import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/firebase/server";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;

  if (!token) {
    redirect("/login?deepLink=1&redirect=/admin-dashboard");
  }

  try {
    const verifiedToken = await auth.verifyIdToken(token);
    if (!verifiedToken?.admin) {
      redirect("/");
    }
  } catch {
    redirect("/login");
  }

  return <div className="mx-auto max-w-screen-lg">{children}</div>;
}
