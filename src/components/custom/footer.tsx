// components/footer.tsx
import { SafeLink } from "./utility/SafeLink";

export function Footer() {
  return (
    <footer className="bg-background fixed right-0 bottom-0 z-50 w-full md:w-fit md:rounded-tl-md md:border">
      <div className="flex items-center justify-center gap-4 p-0 px-4 md:justify-end">
        <div className="text-muted-foreground flex gap-4 text-sm font-medium">
          <SafeLink
            href="/privacy-policy"
            className="hover:text-primary text-xs underline-offset-4 hover:underline"
          >
            Privacy Policy
          </SafeLink>
          <SafeLink
            href="/terms-of-service"
            className="hover:text-primary text-xs underline-offset-4 hover:underline"
          >
            Terms of Service
          </SafeLink>
        </div>
      </div>
    </footer>
  );
}
