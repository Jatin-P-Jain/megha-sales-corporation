"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, CloudDownload } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GstDetails } from "@/components/custom/gst-details";
import type { BusinessProfile, GstDetailsData } from "@/types/user";

// ── Edit Name ─────────────────────────────────────────────────────────────────

type EditNameDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentName: string;
  onSave: (name: string) => Promise<void>;
};

export function EditNameDialog({
  open,
  onOpenChange,
  currentName,
  onSave,
}: EditNameDialogProps) {
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(currentName);
      setTimeout(() => {
        const el = inputRef.current;
        if (!el) return;
        el.focus();
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }, 0);
    }
  }, [open, currentName]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onSave(trimmed);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Edit display name</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="edit-name">Name</Label>
          <Input
            ref={inputRef}
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={80}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSave();
            }}
          />
        </div>
        <DialogFooter className="flex-row justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={saving || !name.trim()}
            onClick={() => void handleSave()}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Saving
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add PAN ───────────────────────────────────────────────────────────────────

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

type AddPanDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (pan: string) => Promise<void>;
};

export function AddPanDialog({
  open,
  onOpenChange,
  onSave,
}: AddPanDialogProps) {
  const [pan, setPan] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPan("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const panValid = PAN_REGEX.test(pan);

  const handleSave = async () => {
    if (!panValid) return;
    setSaving(true);
    try {
      await onSave(pan);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Add PAN number</DialogTitle>
        </DialogHeader>
        <div className="bg-accent-50 border-accent-200 flex items-start gap-2 rounded-md border px-3 py-2 text-xs text-amber-800">
          <span className="mt-0.5 shrink-0">ℹ️</span>
          <span>
            PAN can only be added once. Please ensure the details are correct
            before saving.
          </span>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pan-input">PAN Number</Label>
          <Input
            ref={inputRef}
            id="pan-input"
            value={pan}
            onChange={(e) => setPan(e.target.value.toUpperCase())}
            placeholder="ABCDE1234F"
            maxLength={10}
          />
          {pan && !panValid && (
            <p className="text-destructive text-xs">
              Enter a valid 10-character PAN (e.g. ABCDE1234F)
            </p>
          )}
        </div>
        <DialogFooter className="flex-row justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={saving || !panValid}
            onClick={() => void handleSave()}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Saving
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add GST ───────────────────────────────────────────────────────────────────

type AddGstDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (businessProfile: BusinessProfile) => Promise<void>;
};

export function AddGstDialog({
  open,
  onOpenChange,
  onSave,
}: AddGstDialogProps) {
  const [gstin, setGstin] = useState("");
  const [gstDetails, setGstDetails] = useState<GstDetailsData | null>(null);
  const [loadingGst, setLoadingGst] = useState(false);
  const [gstError, setGstError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setGstin("");
    setGstDetails(null);
    setGstError(null);
    setSaving(false);
  }, []);

  useEffect(() => {
    if (open) {
      resetState();
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, resetState]);

  const fetchGstDetails = useCallback(async () => {
    const v = gstin.trim();
    if (!v) return;
    setLoadingGst(true);
    setGstError(null);
    setGstDetails(null);
    try {
      const res = await fetch(`/api/gst-lookup?gstin=${encodeURIComponent(v)}`);
      const data = (await res.json()) as GstDetailsData;
      if (data.flag !== true) {
        setGstError("Invalid GSTIN or no data found");
      } else {
        setGstDetails(data);
      }
    } catch {
      setGstError("Failed to fetch GST details. Please try again.");
    } finally {
      setLoadingGst(false);
    }
  }, [gstin]);

  const handleSave = async () => {
    if (!gstDetails?.flag) return;
    setSaving(true);
    try {
      const d = gstDetails.data;
      const bp: BusinessProfile = {
        gstin: d.gstin,
        legalName: d.lgnm,
        tradeName: d.tradeNam,
        address: d.pradr?.adr || "",
        status: d.sts,
        registrationDate: d.rgdt,
        natureOfBusiness: d.nba || [],
        verifiedAt: new Date().toISOString(),
        verifiedData: gstDetails,
      };
      await onSave(bp);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetState();
        onOpenChange(v);
      }}
    >
      <DialogContent
        className="flex max-h-[85dvh] flex-col overflow-hidden p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle>Add GST number</DialogTitle>
        </DialogHeader>
        <div className="flex-1 space-y-2 overflow-y-auto px-6 pb-2">
          <div className="space-y-2">
            <Label htmlFor="gstin-input">GSTIN Number</Label>
            <div className="flex flex-col gap-2 md:flex-row">
              <Input
                ref={inputRef}
                id="gstin-input"
                value={gstin}
                onChange={(e) => {
                  setGstin(e.target.value.toUpperCase());
                  setGstDetails(null);
                  setGstError(null);
                }}
                placeholder="Enter 15-digit GSTIN"
                maxLength={15}
                className={
                  gstDetails
                    ? "border-green-300 ring-1 ring-green-200"
                    : undefined
                }
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => void fetchGstDetails()}
                disabled={gstin.length !== 15 || loadingGst}
                className="shrink-0 gap-2"
              >
                {loadingGst ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CloudDownload className="size-4" />
                )}
                Get Details
              </Button>
            </div>
            {gstError && <p className="text-destructive text-xs">{gstError}</p>}
          </div>

          {(loadingGst || gstDetails) && (
            <GstDetails data={gstDetails} loading={loadingGst} />
          )}
        </div>
        <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t px-6 py-4">
          <Button
            variant="outline"
            onClick={() => {
              resetState();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={saving || !gstDetails?.flag}
            onClick={() => void handleSave()}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Saving
              </>
            ) : (
              "Save GST"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
