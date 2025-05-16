export default function layout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-screen-lg">
      {children}
      {modal}
    </div>
  );
}
