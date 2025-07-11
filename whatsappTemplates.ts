// whatsappTemplates.ts

type TemplateParamResolver = (input: Record<string, any>) => {
  bodyParams: string[];
  buttonParams?: string[];
};

export const whatsappTemplates: Record<
  string,
  {
    name: string;
    language: { code: string };
    bodyParamsCount: number;
    hasButton: boolean;
    resolveParams: TemplateParamResolver;
  }
> = {
  admin_order_recieved_v1: {
    name: "admin_order_recieved_v1",
    language: { code: "en_US" },
    bodyParamsCount: 4,
    hasButton: true,
    resolveParams: ({ adminName, customerName, customerPhone, orderId }) => ({
      bodyParams: [adminName, customerName, customerPhone, orderId],
      buttonParams: [orderId],
    }),
  },
  admin_query_raised: {
    name: "admin_query_raised",
    language: { code: "en_US" },
    bodyParamsCount: 5,
    hasButton: false,
    resolveParams: ({
      adminName,
      customerName,
      customerPhone,
      customerMessage,
      customerWANumber,
    }) => ({
      bodyParams: [
        adminName,
        customerName,
        customerPhone,
        customerMessage,
        customerWANumber,
      ],
    }),
  },
};

export const createWhatsAppPayloadFromInput = ({
  templateKey,
  to,
  inputParams,
}: {
  templateKey: keyof typeof whatsappTemplates;
  to: string;
  inputParams: Record<string, any>;
}) => {
  const template = whatsappTemplates[templateKey];
  if (!template) throw new Error("Invalid template key");

  const { bodyParams, buttonParams } = template.resolveParams(inputParams);

  if (bodyParams.length !== template.bodyParamsCount) {
    throw new Error(
      `Expected ${template.bodyParamsCount} body params for ${templateKey}, but got ${bodyParams.length}`,
    );
  }

  const payload: any = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: template.name,
      language: template.language,
      components: [
        {
          type: "body",
          parameters: bodyParams.map((text) => ({ type: "text", text })),
        },
      ],
    },
  };

  console.log(JSON.stringify(payload));

  if (template.hasButton && buttonParams?.length) {
    payload.template.components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: buttonParams.map((text) => ({ type: "text", text })),
    });
  }

  return payload;
};
