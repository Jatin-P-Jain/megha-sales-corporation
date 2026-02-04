"use client";

import { useState } from "react";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";

type SearchField = "email" | "phone" | "uid" | "displayName";

export default function SearchUser({
  variant = "outline",
  buttonClassName,
  showText = true,
}: {
  variant?: "outline" | "default";
  buttonClassName?: string;
  showText?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("email");

  const resetState = () => {
    setSearchQuery("");
    setSearchField("email");
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    const params = new URLSearchParams(searchParams.toString());

    // Set search parameters
    params.set("searchField", searchField);
    params.set("searchQuery", searchQuery.trim());

    // Reset to page 1 when searching
    params.delete("page");

    // Navigate with search params
    router.push(`/admin-dashboard/users?${params.toString()}`);

    // Close dialog and reset
    setOpen(false);
    resetState();
  };

  const getFieldLabel = (field: SearchField) => {
    const labels: Record<SearchField, string> = {
      email: "Email",
      phone: "Phone Number",
      uid: "User ID",
      displayName: "Name",
    };
    return labels[field];
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant={variant}
          className={clsx(
            buttonClassName,
            "border-primary w-full border-1 shadow-lg",
          )}
        >
          <SearchIcon /> {showText && <> Search Users</>}
        </Button>
      </DialogTrigger>

      <DialogContent className="w-full px-6 shadow-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="mt-2">Search User</DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Find users by <strong>email</strong>, <strong>phone</strong>,{" "}
            <strong>name</strong>, or <strong>user ID</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Search Field Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search By</label>
            <Select
              value={searchField}
              onValueChange={(value: SearchField) => setSearchField(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Search by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone Number</SelectItem>
                <SelectItem value="displayName">Name</SelectItem>
                <SelectItem value="uid">User ID</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {getFieldLabel(searchField)}
            </label>
            <Input
              placeholder={`Enter ${getFieldLabel(searchField).toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSearch}
            disabled={!searchQuery.trim()}
            className="w-full"
          >
            <SearchIcon className="mr-1 h-4 w-4" />
            Search User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
