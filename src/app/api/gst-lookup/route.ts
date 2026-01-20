export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gstin = searchParams.get("gstin");
  const apiKey = process.env.GST_LOOKUP_API_KEY; // Get from https://www.knowyourgst.com

  const res = await fetch(
    `http://sheet.gstincheck.co.in/check/${apiKey}/${gstin}`,
  );
  const data = await res.json();
  return Response.json(data);
}
