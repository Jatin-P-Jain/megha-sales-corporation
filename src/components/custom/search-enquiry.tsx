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
import { useSearchParams } from "next/navigation";
import { useSafeRouter } from "@/hooks/useSafeRouter";

type SearchField =
  | "createdBy.email"
  | "createdBy.phone"
  | "id"
  | "createdBy.displayName";

export default function SearchEnquiry({
  variant = "outline",
  buttonClassName,
  showText = true,
}: {
  variant?: "outline" | "default";
  buttonClassName?: string;
  showText?: boolean;
}) {
  const router = useSafeRouter();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("id");

  const resetState = () => {
    setSearchQuery("");
    setSearchField("id");
  };

  const handleSearch = () => {
    console.log({ searchQuery });

    if (!searchQuery.trim()) return;

    const params = new URLSearchParams(searchParams.toString());

    // Set search parameters
    params.set("searchField", searchField);
    params.set("searchQuery", searchQuery.trim());

    // Reset to page 1 when searching
    params.delete("page");
    console.log(params.toString());

    // Navigate with search params
    router.replace(`/enquiries?${params.toString()}`);

    // Close dialog and reset
    setOpen(false);
    resetState();
  };

  const getFieldLabel = (field: SearchField) => {
    const labels: Record<SearchField, string> = {
      "createdBy.email": "User Email",
      id: "Enquiry ID",
      "createdBy.phone": "User Phone Number",
      "createdBy.displayName": "User Name",
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
            "border-primary w-full border shadow-lg",
          )}
        >
          <SearchIcon /> {showText && <> Search Enquiries</>}
        </Button>
      </DialogTrigger>

      <DialogContent className="w-full px-6 shadow-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="mt-2">Search Enquiry</DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Find enquiries by <strong>enquiry ID</strong>,{" "}
            <strong>user phone</strong>, <strong>user name</strong>, or{" "}
            <strong>user email</strong>.
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
                <SelectItem value="id">Enquiry ID</SelectItem>
                <SelectItem value="createdBy.email">User Email</SelectItem>
                <SelectItem value="createdBy.phone">
                  User Phone Number
                </SelectItem>
                <SelectItem value="createdBy.displayName">User Name</SelectItem>
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
            Search Enquiry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
