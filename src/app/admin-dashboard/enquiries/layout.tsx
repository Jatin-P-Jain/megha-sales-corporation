export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-5xl md:p-8 lg:p-10">{children}</div>;
}
