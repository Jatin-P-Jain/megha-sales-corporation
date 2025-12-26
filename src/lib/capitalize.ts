export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
export function capitalizePhrase(phrase: string): string {
  const strParts = phrase.split(" ");
  const capitalizedParts = strParts.map((part) => capitalize(part));
  return capitalizedParts.join(" ");
}
