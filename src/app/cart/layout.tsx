export default function layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto h-[100%] max-w-screen-lg">
      {children}
    </div>
  );
}
