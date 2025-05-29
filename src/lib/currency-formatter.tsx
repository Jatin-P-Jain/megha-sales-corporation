export default function currencyFormatter(price: number) {
  return <>₹ {new Intl.NumberFormat("en-IN").format(price)}</>;
}
