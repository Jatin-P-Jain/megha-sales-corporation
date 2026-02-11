// app/terms/page.tsx
export default function TermsOfService() {
  return (
    <article className="prose dark:prose-invert container mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-4 text-3xl font-bold">Terms of Service</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        Last Updated: February 11, 2026
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold">1. Services Provided</h2>
        <p>
          Megha Sales Corporation provides an enterprise-level platform for
          managing sales and distribution networks.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold">2. User Responsibilities</h2>
        <p>
          Users are responsible for maintaining the confidentiality of their
          credentials and for all activities that occur under their account.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold">3. Prohibited Activities</h2>
        <p>
          You may not use our service for any illegal activities, including
          unauthorized data scraping or attempting to breach our security
          protocols.
        </p>
      </section>
    </article>
  );
}
