"use client";

import React, { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle,
  Clock,
  XCircle,
  ShieldAlert,
  UserX,
  ChevronDown,
} from "lucide-react";
import SearchUser from "./search-user";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS_CONFIG = {
  pending: { icon: Clock, label: "Pending" },
  approved: { icon: CheckCircle, label: "Approved" },
  rejected: { icon: XCircle, label: "Rejected" },
  suspended: { icon: ShieldAlert, label: "Suspended" },
  deactivated: { icon: UserX, label: "Deactivated" },
} as const;

export type AccountStatus = keyof typeof STATUS_CONFIG;
const ALL_STATUSES = Object.keys(STATUS_CONFIG) as AccountStatus[];

const UserSearchAndFilters: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedStatuses = useMemo(() => {
    const raw = searchParams.get("accountStatus");
    if (!raw) return [] as AccountStatus[];

    const set = new Set(raw.split(","));
    // Only keep valid values even if URL is tampered
    return ALL_STATUSES.filter((s) => set.has(s));
  }, [searchParams]);

  const setStatuses = (next: AccountStatus[]) => {
    const params = new URLSearchParams(searchParams.toString());

    if (next.length) params.set("accountStatus", next.join(","));
    else params.delete("accountStatus");

    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const toggleStatus = (status: AccountStatus) => {
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-center">
        <div>
          <SearchUser variant="outline" showText={true} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
            <span className="hidden text-xs font-medium text-gray-700 md:inline md:text-sm">
              Account Status:
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  {buttonLabel}
                  <ChevronDown className="h-4 w-4 opacity-60" />
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
      </div>
    </div>
  );
};

export default UserSearchAndFilters;
