export default function imageUrlFormatter(imagePath: string) {
  return `https://firebasestorage.googleapis.com/v0/b/hot-homes-8a814.firebasestorage.app/o/${encodeURIComponent(
    imagePath
  )}?alt=media`;
}
