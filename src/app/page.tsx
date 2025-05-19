import Greetings from "@/components/custom/greetings";
import { getUserFromDB } from "@/data/user";

export default async function Home() {
  const clientUser = await getUserFromDB(); // From Firestore

  return (
    <main className="flex h-full flex-col items-center justify-center p-5">
      <Greetings user={clientUser} />
    </main>
  );
}
