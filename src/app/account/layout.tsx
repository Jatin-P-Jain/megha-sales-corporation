export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-screen-lg p-4 py-2 md:pt-8 md:pb-0 pb-24">
      {children}
    </div>
  );
}
