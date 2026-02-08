// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createWhatsAppPayloadFromInput } from "../../../../whatsappTemplates";
import { recipientsForTemplate } from "./whatsappRecipients";

// optional: if you used the typed version earlier, import TemplateKey instead
type TemplateKey =
  | "account_approval_request"
  | "admin_order_recieved_v1"
  | "customer_inquiry_recieved";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isString = (v: unknown): v is string => typeof v === "string";

const isTemplateKey = (v: unknown): v is TemplateKey =>
  v === "account_approval_request" ||
  v === "admin_order_recieved_v1" ||
  v === "customer_inquiry_recieved";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    if (!isRecord(raw)) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const {
      templateKey,
      customerUserId,
      customerName,
      orderId,
      customerPhone,
      customerMessage,
      customerEmail,
      customerWANumber,
      customerBusinessProfile,
      // optional override: allow ad-hoc extra recipients
      toNumbers,
    } = raw;

    if (!isTemplateKey(templateKey)) {
      return NextResponse.json(
        { success: false, error: "Invalid templateKey" },
        { status: 400 }
      );
    }

    const phoneNumberId = requireEnv("WHATSAPP_PHONE_NUMBER_ID");
    const token = requireEnv("WHATSAPP_TOKEN");

    // 1) recipients from role-map
    const roleRecipients = recipientsForTemplate(templateKey);

    // 2) optional ad-hoc recipients from payload (array of E.164)
    const extraRecipients = Array.isArray(toNumbers)
      ? toNumbers.filter(isString)
      : [];

    const allRecipientPhones = Array.from(
      new Set([...roleRecipients.map((r) => r.phoneE164), ...extraRecipients])
    );

    if (allRecipientPhones.length === 0) {
      return NextResponse.json(
        { success: false, error: "No recipients configured for this template" },
        { status: 400 }
      );
    }

    // Send to each recipient (one request per `to`) [web:234]
    const results = await Promise.allSettled(
      allRecipientPhones.map(async (to) => {
        const recipient =
          roleRecipients.find((r) => r.phoneE164 === to) ?? null;

        const whatsappPayload = createWhatsAppPayloadFromInput({
          templateKey,
          to,
          inputParams: {
            adminName: recipient?.name ?? "Admin",
            customerUserId: customerUserId as string,
            customerName: customerName as string,
            customerPhone: customerPhone as string,
            customerEmail: customerEmail as string,
            orderId: orderId as string,
            customerMessage: customerMessage as string,
            customerWANumber: customerWANumber as string,
            customerBusinessProfile: customerBusinessProfile as string,
          },
        });

        const resp = await fetch(
          `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(whatsappPayload),
          }
        );

        const text = await resp.text();
        if (!resp.ok) {
          return {
            to,
            ok: false,
            status: resp.status,
            error: text,
          };
        }

        return {
          to,
          ok: true,
          status: resp.status,
          data: JSON.parse(text),
        };
      })
    );

    // Normalize results
    const sent = results.map((r) =>
      r.status === "fulfilled"
        ? r.value
        : { ok: false, status: 0, to: "unknown", error: String(r.reason) }
    );

    const anySuccess = sent.some((s) => s.ok);

    return NextResponse.json(
      {
        success: anySuccess,
        templateKey,
        orderId: isString(orderId) ? orderId : undefined,
        recipients: sent,
      },
      { status: anySuccess ? 200 : 502 }
    );
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
