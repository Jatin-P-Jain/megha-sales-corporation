// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createWhatsAppPayloadFromInput } from "../../../../whatsappTemplates";
import { recipientsForTemplate } from "./whatsappRecipients";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SerializedError = {
  name?: string;
  message: string;
  stack?: string;
  cause?: {
    name?: string;
    message?: string;
    code?: string;
    errno?: string | number;
    syscall?: string;
    address?: string;
    port?: number;
  };
};

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

function toDigitsE164(to: string): string {
  // WhatsApp Cloud API expects phone number in international format (digits only is safest)
  // e.g. "+91 96362 45681" -> "919636245681"
  return (to ?? "").replace(/[^\d]/g, "");
}
function pickString(obj: Record<string, unknown>, key: string) {
  const v = obj[key];
  return typeof v === "string" ? v : undefined;
}
function pickNumber(obj: Record<string, unknown>, key: string) {
  const v = obj[key];
  return typeof v === "number" ? v : undefined;
}

function serializeError(err: unknown): SerializedError {
  if (err instanceof Error) {
    // In Node/undici, the real network reason is often in `err.cause` for "TypeError: fetch failed"
    const anyErr = err as Error & { cause?: unknown };
    const cause = anyErr.cause;

    let serializedCause: SerializedError["cause"] | undefined;

    if (isRecord(cause)) {
      serializedCause = {
        name: pickString(cause, "name"),
        message: pickString(cause, "message") ?? String(cause),
        code: pickString(cause, "code"),
        errno:
          pickString(cause, "errno") ??
          (typeof cause["errno"] === "number"
            ? String(cause["errno"])
            : undefined),
        syscall: pickString(cause, "syscall"),
        address: pickString(cause, "address"),
        port: pickNumber(cause, "port"),
      };
    } else if (cause != null) {
      serializedCause = { message: String(cause) };
    }

    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      cause: serializedCause,
    };
  }

  return { message: String(err) };
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms = 15000
): Promise<Response> {
  // AbortSignal.timeout is supported in modern Node runtimes; it prevents hanging requests. [web:451]
  return fetch(url, { ...init, signal: AbortSignal.timeout(ms) });
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

    console.log({ raw });

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

    const roleRecipients = recipientsForTemplate(templateKey);

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

    const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

    const results = await Promise.allSettled(
      allRecipientPhones.map(async (toRaw) => {
        const to = toDigitsE164(toRaw);
        const recipient =
          roleRecipients.find((r) => r.phoneE164 === toRaw) ?? null;

        const whatsappPayload = createWhatsAppPayloadFromInput({
          templateKey,
          to, // ✅ send digits-only
          inputParams: {
            adminName: recipient?.name ?? "Admin",
            customerUserId: isString(customerUserId) ? customerUserId : "",
            customerName: isString(customerName) ? customerName : "",
            customerPhone: isString(customerPhone) ? customerPhone : "",
            customerEmail: isString(customerEmail) ? customerEmail : "",
            orderId: isString(orderId) ? orderId : "",
            customerMessage: isString(customerMessage) ? customerMessage : "",
            customerWANumber: isString(customerWANumber)
              ? customerWANumber
              : "",
            customerBusinessProfile: isString(customerBusinessProfile)
              ? customerBusinessProfile
              : "",
          },
        });

        try {
          const resp = await fetchWithTimeout(
            url,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(whatsappPayload),
              cache: "no-store",
            },
            20000
          );

          const text = await resp.text();

          if (!resp.ok) {
            return {
              to: toRaw,
              toNormalized: to,
              ok: false,
              status: resp.status,
              error: text,
            };
          }

          return {
            to: toRaw,
            toNormalized: to,
            ok: true,
            status: resp.status,
            data: text ? JSON.parse(text) : null,
          };
        } catch (err) {
          // ✅ This is where "TypeError: fetch failed" will land (network/DNS/timeout/etc.) [web:454]
          return {
            to: toRaw,
            toNormalized: to,
            ok: false,
            status: 0,
            error: serializeError(err),
          };
        }
      })
    );

    const sent = results.map((r) =>
      r.status === "fulfilled"
        ? r.value
        : {
            ok: false,
            status: 0,
            to: "unknown",
            error: serializeError(r.reason),
          }
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
    const err = serializeError(e);
    console.error("Route error:", err);
    return NextResponse.json({ success: false, error: err }, { status: 500 });
  }
}
