export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-screen-lg mx-auto p-6 md:p-8 lg:p-10">{children}</div>
  );
}
