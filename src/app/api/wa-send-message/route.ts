// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createWhatsAppPayloadFromInput } from "../../../../whatsappTemplates";
import {
  recipientsForTemplate,
  TEST_PHONE_NUMBERS,
} from "./whatsappRecipients";

const WA_DEV_REDIRECT = "+919636245681";

/** Returns true when the phone (any normalisation) matches a known test number. */
function isTestPhone(phone: unknown): boolean {
  if (!isString(phone)) return false;
  const digits = phone.replace(/[^\d]/g, "");
  // Match last 10 digits against the test set (handles +91XXXXXXXXXX, 91XXXXXXXXXX, XXXXXXXXXX)
  const last10 = digits.slice(-10);
  return TEST_PHONE_NUMBERS.has(last10);
}

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
  | "account_approval_request_to_admin"
  | "account_approval_reminder_to_admin"
  | "order_placed_to_admin_v2"
  | "enquiry_received_to_admin_v2"
  | "feedback_received_to_admin";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isString = (v: unknown): v is string => typeof v === "string";

const isTemplateKey = (v: unknown): v is TemplateKey =>
  v === "account_approval_request_to_admin" ||
  v === "account_approval_reminder_to_admin" ||
  v === "order_placed_to_admin_v2" ||
  v === "enquiry_received_to_admin_v2" ||
  v === "feedback_received_to_admin";

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

    const {
      templateKey,
      customerUserId,
      customerFirmName,
      customerName,
      orderId,
      customerPhone,
      customerMessage,
      customerEmail,
      customerWANumber,
      customerBusinessProfile,
      toNumbers,
      enquiryId,
      rating,
    } = raw;

    if (!isTemplateKey(templateKey)) {
      return NextResponse.json(
        { success: false, error: "Invalid templateKey" },
        { status: 400 }
      );
    }

    const phoneNumberId = requireEnv("WHATSAPP_PHONE_NUMBER_ID");
    const token = requireEnv("WHATSAPP_TOKEN");

    const roleRecipients = await recipientsForTemplate(templateKey);

    const extraRecipients = Array.isArray(toNumbers)
      ? toNumbers.filter(isString)
      : [];

    // If the triggering customer's phone is a test number, redirect ALL
    // WhatsApp messages to the dev number to avoid spamming real staff.
    const customerPhoneIsTest = isTestPhone(customerPhone);

    const allRecipientPhones: string[] = customerPhoneIsTest
      ? [WA_DEV_REDIRECT]
      : Array.from(
          new Set([
            ...roleRecipients.map((r) => r.phoneE164),
            ...extraRecipients,
          ])
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
            customerFirmName: isString(customerFirmName)
              ? customerFirmName
              : "",
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
            enquiryId: isString(enquiryId) ? enquiryId : "",
            rating: isString(rating) ? rating : "",
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
