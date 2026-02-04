"use client";
import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Clock, XCircle} from "lucide-react";
import SearchUser from "./search-user";

type AccountStatus = "approved" | "rejected" | "pending";

const UserSearchAndFilters: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const accountStatusValue = searchParams.get("accountStatus") || "";
  const selectedStatuses = accountStatusValue
    ? accountStatusValue.split(",")
    : [];

  const handleStatusToggle = (status: AccountStatus) => {
    const params = new URLSearchParams(searchParams.toString());

    let newStatuses: string[];

    if (selectedStatuses.includes(status)) {
      // Remove status if already selected
      newStatuses = selectedStatuses.filter((s) => s !== status);
    } else {
      // Add status if not selected
      newStatuses = [...selectedStatuses, status];
    }

    if (newStatuses.length > 0) {
      params.set("accountStatus", newStatuses.join(","));
    } else {
      params.delete("accountStatus");
    }

    // Reset to page 1 when filters change
    params.delete("page");

    router.push(`?${params.toString()}`);
  };
  const getStatusConfig = (status: AccountStatus) => {
    const configs = {
      pending: {
        icon: Clock,
        label: "Pending",
        bgClass: "bg-yellow-50 hover:bg-yellow-100 border-yellow-200",
        textClass: "text-yellow-700",
        iconClass: "text-yellow-600",
        activeBgClass: "bg-yellow-200 border-yellow-400",
      },
      approved: {
        icon: CheckCircle,
        label: "Approved",
        bgClass: "bg-green-50 hover:bg-green-100 border-green-200",
        textClass: "text-green-700",
        iconClass: "text-green-600",
        activeBgClass: "bg-green-200 border-green-400",
      },
      rejected: {
        icon: XCircle,
        label: "Rejected",
        bgClass: "bg-red-50 hover:bg-red-100 border-red-200",
        textClass: "text-red-700",
        iconClass: "text-red-600",
        activeBgClass: "bg-red-200 border-red-400",
      },
    };
    return configs[status];
  };

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-center">
        {/* Search User Dialog */}
        <div>
          <SearchUser variant="outline" showText={true} />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
            <span className="hidden text-xs font-medium text-gray-700 md:inline md:text-sm">
              Account Status:
            </span>
            {(["pending", "approved", "rejected"] as AccountStatus[]).map(
              (status) => {
                const config = getStatusConfig(status);
                const Icon = config.icon;
                const isSelected = selectedStatuses.includes(status);

                return (
                  <button
                    key={status}
                    onClick={() => handleStatusToggle(status)}
                    className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-all ${
                      isSelected
                        ? `${config.activeBgClass} ${config.textClass}`
                        : `${config.bgClass} ${config.textClass}`
                    }`}
                  >
                    <Icon className={`h-3 w-3 ${config.iconClass}`} />
                    {config.label}
                    {isSelected && (
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white/50">
                        <span className="text-[10px]">✓</span>
                      </div>
                    )}
                  </button>
                );
              },
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSearchAndFilters;
