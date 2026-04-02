export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gstin = searchParams.get("gstin")?.trim();
  const apiKey = process.env.GST_LOOKUP_API_KEY;

  if (!gstin) {
    return Response.json({ error: "Missing gstin parameter" }, { status: 400 });
  }

  if (!apiKey) {
    return Response.json(
      { error: "GST lookup is not configured" },
      { status: 500 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      `https://sheet.gstincheck.co.in/check/${apiKey}/${encodeURIComponent(
        gstin
      )}`,
      { signal: controller.signal }
    );

    if (!res.ok) {
      return Response.json(
        { error: "GST lookup failed" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json(
      { error: "GST lookup request failed" },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
