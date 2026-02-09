"use client";

import React from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyIcon } from "lucide-react";
import { BANK_DETAILS, UPI_QR_CODE } from "@/data/bank-details";

type BankDetails = {
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  accountType: string;
};

export default function BankDetails({
  title = "Bank Details",
  description = "Use these details for bank transfer or scan the UPI QR to pay.",
}: {
  title?: string;
  description?: string;
}) {
  const bankDetails: BankDetails = BANK_DETAILS;
  const upiQr = UPI_QR_CODE;
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Keep this component UI-only; toast can be added by parent if you want.
    } catch {
      // ignore
    }
  };

  const Row = ({
    label,
    value,
    copyable,
  }: {
    label: string;
    value: string;
    copyable?: boolean;
  }) => (
    <div className="flex items-center justify-between gap-4 rounded-md border p-3">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2 text-right">
        <div className="text-sm font-semibold break-all">
          {value}
        </div>
        {copyable ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => copy(value)}
            aria-label={`Copy ${label}`}
          >
            <CopyIcon className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base md:text-lg">{title}</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-3">
          <Row label="Account holder" value={bankDetails.accountHolder} />
          <Row
            label="Account number"
            value={bankDetails.accountNumber}
            copyable
          />
          <Row label="IFSC" value={bankDetails.ifsc} copyable />
          <Row label="Branch" value={bankDetails.branch} />
          <Row label="Account type" value={bankDetails.accountType} />
        </div>

        {upiQr ? (
          <div className="flex flex-col items-center justify-start gap-2 rounded-lg border bg-muted p-4 cursor-pointer">
            <div className="text-sm font-semibold">UPI QR</div>
            <Image
              src={upiQr.src}
              alt={upiQr.alt ?? "UPI QR code"}
              width={220}
              height={220}
              className="rounded-md bg-white p-2"
              priority={false}
            />
            <div className="text-center text-xs text-muted-foreground">
              Scan with any UPI app to pay.
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
