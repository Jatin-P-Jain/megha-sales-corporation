// components/footer.tsx
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-background w-fit border fixed bottom-0 right-0 rounded-tl-md">
      <div className="flex items-center justify-end gap-4 px-4 py-2">
        <div className="text-muted-foreground flex gap-4 text-sm font-medium">
          <Link
            href="/privacy-policy"
            className="hover:text-primary underline-offset-4 hover:underline"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms-of-service"
            className="hover:text-primary underline-offset-4 hover:underline"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
