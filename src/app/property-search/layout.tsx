export default function layout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <div className="px-3">
      {children}
      {modal}
    </div>
  );
}
