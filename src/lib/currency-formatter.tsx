export default function currencyFormatter(price: number) {
  return (
    <>
      ₹{" "}
      {new Intl.NumberFormat("en-IN", {
        maximumSignificantDigits: 3,
      }).format(price)}
    </>
  );
}
