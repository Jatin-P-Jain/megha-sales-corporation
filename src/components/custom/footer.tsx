// components/footer.tsx
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-background fixed right-0 bottom-0 w-full md:border md:w-fit md:rounded-tl-md z-100">
      <div className="flex items-center justify-center gap-4 p-0 px-4 md:justify-end">
        <div className="text-muted-foreground flex gap-4 text-sm font-medium">
          <Link
            href="/privacy-policy"
            className="hover:text-primary text-xs underline-offset-4 hover:underline"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms-of-service"
            className="hover:text-primary text-xs underline-offset-4 hover:underline"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
