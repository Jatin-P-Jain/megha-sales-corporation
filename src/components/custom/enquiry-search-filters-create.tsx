"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle,
  Clock,
  ChevronDown,
  MessageCirclePlus,
  MessageCircle,
  FunnelPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import HelpDialog from "./help-dialog";
import { useUserGate } from "@/context/UserGateProvider";
import { useUserProfileState } from "@/context/UserProfileProvider";
import { FullUser } from "@/types/user";
import SearchEnquiry from "./search-enquiry";
import { EnquiryStatus } from "@/types/enquiry";
import useIsMobile from "@/hooks/useIsMobile";
import { useAuthState } from "@/context/auth-context";

const STATUS_CONFIG = {
  pending: { icon: Clock, label: "Pending" },
  "in-progress": { icon: MessageCircle, label: "In Progress" },
  resolved: { icon: CheckCircle, label: "Resolved" },
} as const;

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as EnquiryStatus[];

const EnquirySearchFiltersCreate: React.FC = () => {
  const isMobile = useIsMobile();
  const router = useSafeRouter();
  const searchParams = useSearchParams();
  const { isAdmin } = useAuthState();
  const { gate, userRole } = useUserGate();
  const { clientUser } = useUserProfileState();

  const fullUser = useMemo(() => {
    return {
      ...clientUser,
      ...gate,
    } as FullUser;
  }, [clientUser, gate]);

  const [helpOpen, setHelpOpen] = useState(false);

  const selectedStatuses = useMemo(() => {
    const raw = searchParams.get("enquiryStatus");
    if (!raw) return [] as EnquiryStatus[];

    const set = new Set(raw.split(","));
    // Only keep valid values even if URL is tampered
    return ALL_STATUSES.filter((s) => set.has(s));
  }, [searchParams]);

  const setStatuses = (next: EnquiryStatus[]) => {
    const params = new URLSearchParams(searchParams.toString());

    if (next.length) params.set("enquiryStatus", next.join(","));
    else params.delete("enquiryStatus");

    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const toggleStatus = (status: EnquiryStatus) => {
    const isSelected = selectedStatuses.includes(status);
    const next = isSelected
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];

    setStatuses(next);
  };

  const clearAll = () => setStatuses([]);

  const buttonLabel =
    selectedStatuses.length === 0
      ? "All statuses"
      : `${selectedStatuses.length} selected`;

  return (
    <div className="space-y-1">
      <div className="flex gap-4 overflow-auto md:items-center md:gap-4">
        {userRole !== "admin" && (
          <Button onClick={() => setHelpOpen(true)} className="flex-1">
            Raise a help request <MessageCirclePlus className="size-5" />
          </Button>
        )}
        {isAdmin ?? (
          <SearchEnquiry variant="outline" showText={!isMobile || isAdmin} />
        )}

        <div className="flex w-auto flex-wrap items-center justify-between gap-2 md:justify-end">
          <span className="hidden text-xs font-medium text-gray-700 md:inline md:text-sm">
            Enquiry Status:
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 md:w-fit"
              >
                {(!isMobile || isAdmin) && buttonLabel}
                {isMobile || isAdmin ? (
                  <FunnelPlus className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4 opacity-60" />
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-56"
              align="end"
              // keep menu open when clicking checkboxes (so multi-select feels natural)
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuLabel>Status filter</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuCheckboxItem
                checked={selectedStatuses.length === 0}
                // Radix gives boolean | "indeterminate", we only care about boolean here
                onCheckedChange={(checked) => {
                  if (checked) clearAll();
                }}
                onSelect={(e) => e.preventDefault()}
              >
                All statuses
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />

              {ALL_STATUSES.map((status) => {
                const cfg = STATUS_CONFIG[status];
                const Icon = cfg.icon;
                const checked = selectedStatuses.includes(status);

                return (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={checked}
                    onCheckedChange={() => toggleStatus(status)}
                    // prevent default so it doesn't close after each click
                    onSelect={(e) => e.preventDefault()}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 opacity-70" />
                      {cfg.label}
                    </span>
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} user={fullUser} />
    </div>
  );
};

export default EnquirySearchFiltersCreate;
