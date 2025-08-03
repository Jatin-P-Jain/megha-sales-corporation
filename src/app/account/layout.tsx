export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-screen-lg p-4 py-2 md:py-8">{children}</div>;
}
