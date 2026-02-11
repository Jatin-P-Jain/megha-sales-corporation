// app/privacy-policy/page.tsx
export default function PrivacyPolicy() {
  return (
    <article className="prose dark:prose-invert container mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-4 text-3xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        Effective Date: February 11, 2026
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold">1. Data Collection</h2>
        <p>
          Megha Sales Corporation collects your name and email address via
          Google OAuth to provide secure access to your business dashboard.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold">
          2. Google API Limited Use Disclosure
        </h2>
        <p className="bg-muted border-primary border-l-4 p-4 italic">
          Megha Sales Corporation&apos;s use and transfer to any other app of
          information received from Google APIs will adhere to the
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            className="ml-1 underline"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold">3. Data Retention</h2>
        <p>
          We retain your data only as long as your account is active. You may
          request data deletion by contacting our support team.
        </p>
      </section>
    </article>
  );
}
