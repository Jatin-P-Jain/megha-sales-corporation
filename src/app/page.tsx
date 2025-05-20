import Greetings from "@/components/custom/greetings";

export default async function Home() {
  return (
    <main className="flex h-full flex-col items-center justify-center p-5">
      <Greetings />
    </main>
  );
}
