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
import { CopyIcon, Loader2, Share2 } from "lucide-react";
import { BANK_DETAILS, UPI_QR_CODE } from "@/data/bank-details";
import { toast } from "sonner";

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
  isSharable = false,
}: {
  title?: string;
  description?: string;
  isSharable?: boolean;
}) {
  const bankDetails: BankDetails = BANK_DETAILS;
  const upiQr = UPI_QR_CODE;
  const [qrLoaded, setQRLoaded] = React.useState(false);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Keep this component UI-only; toast can be added by parent if you want.
    } catch {
      // ignore
    }
  };

  const shareBankDetails = async () => {
    const url = `${window.location.origin}/about-contact#bank-details`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Bank details",
          text: "Here are the bank details.\n",
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      toast.success("Bank details link copied");
    } catch {
      toast.info("Bank details sharing was canceled.");
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
    <div className="flex items-center justify-between gap-4 rounded-md border p-1 px-2">
      <div className="text-muted-foreground text-xs whitespace-nowrap">
        {label}
      </div>
      <div className="flex items-center gap-2 text-right">
        <div className="text-sm font-semibold">{value}</div>
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
    <Card id="bank-details" className="w-full scroll-mt-24 gap-3 py-4">
      <CardHeader className="p-0 px-3">
        <CardTitle className="flex items-center justify-center gap-2 text-center text-base font-semibold md:text-lg">
          {title}
          {isSharable ? (
            <div className="ml-auto flex justify-center">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={shareBankDetails}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </CardTitle>
        <CardDescription className="text-left text-xs md:text-sm">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4 px-2 md:grid-cols-2">
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
          <div className="bg-muted flex cursor-pointer flex-col items-center justify-start gap-2 rounded-lg border p-4">
            <div className="text-sm font-semibold">UPI QR</div>
            <div className="relative">
              {!qrLoaded ? (
                <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center rounded-md border">
                  <Loader2 className="text-muted-foreground animate-spin" />
                </div>
              ) : null}
              <Image
                src={upiQr.src}
                alt={upiQr.alt ?? "UPI QR code"}
                width={220}
                height={220}
                className="rounded-md bg-white p-2"
                priority={false}
                onLoad={() => setQRLoaded(true)}
              />
            </div>
            <div className="text-muted-foreground text-center text-xs">
              Scan with any UPI app to pay.
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
