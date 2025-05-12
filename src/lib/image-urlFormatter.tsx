export default function imageUrlFormatter(imagePath: string) {
  return `https://firebasestorage.googleapis.com/v0/b/megha-sales-corporation.firebasestorage.app/o/${encodeURIComponent(
    imagePath
  )}?alt=media`;
}
