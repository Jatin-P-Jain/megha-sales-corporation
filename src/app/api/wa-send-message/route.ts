// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createWhatsAppPayloadFromInput } from "../../../../whatsappTemplates";

export async function POST(req: NextRequest) {
  try {
    // 1) parse incoming order data
    const {
      templateKey,
      customerName,
      orderId,
      customerPhone,
      customerMessage,
      customerWANumber,
    } = await req.json();

    // 3) fire off WhatsApp template
    const whatsappPayload = createWhatsAppPayloadFromInput({
      templateKey,
      to: process.env.ADMIN_WHATSAPP_NUMBER!,
      inputParams: {
        adminName: "Jatin",
        customerName,
        customerPhone,
        orderId,
        customerMessage,
        customerWANumber,
      },
    });
    console.log(JSON.stringify(whatsappPayload));

    // const whatsappPayload = {
    //   messaging_product: "whatsapp",
    //   to: process.env.ADMIN_WHATSAPP_NUMBER,
    //   type: "template",
    //   template: {
    //     name: "admin_order_recieved_v1",
    //     language: { code: "en_US" },
    //     components: [
    //       {
    //         type: "body",
    //         parameters: [
    //           { type: "text", text: "Jatin" }, // {{1}}
    //           { type: "text", text: customerName }, // {{2}}
    //           { type: "text", text: customerPhone }, // {{1}}
    //           { type: "text", text: orderId }, // {{2}}
    //         ],
    //       },
    //       {
    //         type: "button",
    //         sub_type: "url",
    //         index: "0",
    //         parameters: [
    //           { type: "text", text: orderId }, // {{1}} in your URL
    //         ],
    //       },
    //     ],
    //   },
    // };

    const resp = await fetch(
      `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        },
        body: JSON.stringify(whatsappPayload),
      },
    );

    if (!resp.ok) {
      const err = await resp.text();
      console.error("WhatsApp API error:", err);
      return NextResponse.json({ success: false, error: err }, { status: 502 });
    }

    const result = await resp.json();
    return NextResponse.json({
      success: true,
      orderId: orderId,
      whatsapp: result,
    });
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
