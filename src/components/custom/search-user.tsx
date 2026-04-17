"use client";

import { useEffect, useState } from "react";
import { CheckIcon, ChevronsUpDownIcon, SearchIcon } from "lucide-react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import clsx from "clsx";
import { useSearchParams } from "next/navigation";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "@/firebase/client";

type SearchField = "email" | "phone" | "userId" | "firmName";

export default function SearchUser({
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
  const isSearchActive = Boolean(searchParams.get("searchQuery")?.trim());

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("firmName");

  // Firm name combobox state
  const [firmNames, setFirmNames] = useState<string[]>([]);
  const [firmNamesLoading, setFirmNamesLoading] = useState(false);
  const [firmComboOpen, setFirmComboOpen] = useState(false);

  // Fetch all distinct firm names when firmName field is selected
  useEffect(() => {
    if (searchField !== "firmName") return;
    if (firmNames.length > 0) return; // already loaded

    setFirmNamesLoading(true);
    const q = query(
      collection(firestore, "usersDirectory"),
      where("firmName", "!=", ""),
    );
    getDocs(q)
      .then((snap) => {
        const names = new Set<string>();
        snap.forEach((doc) => {
          const name = doc.data().firmName as string | undefined;
          if (name?.trim()) names.add(name.trim());
        });
        setFirmNames(Array.from(names).sort((a, b) => a.localeCompare(b)));
      })
      .catch(console.error)
      .finally(() => setFirmNamesLoading(false));
  }, [searchField, firmNames.length]);

  const resetState = () => {
    setSearchQuery("");
    setFirmComboOpen(false);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("searchField", searchField);
    params.set("searchQuery", searchQuery.trim());
    params.delete("page");
    router.push(`/admin-dashboard/users?${params.toString()}`);

    setOpen(false);
    resetState();
  };

  const getFieldLabel = (field: SearchField) => {
    const labels: Record<SearchField, string> = {
      email: "Email",
      phone: "Phone Number",
      userId: "User ID",
      firmName: "Firm Name",
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
            "w-full border",
            isSearchActive &&
              "border-primary bg-primary/5 text-primary font-semibold",
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
            <strong>firm name</strong>, or <strong>user ID</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Search Field Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search By</label>
            <Select
              value={searchField}
              onValueChange={(value: SearchField) => {
                setSearchField(value);
                setSearchQuery("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Search by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="firmName">Firm Name</SelectItem>
                <SelectItem value="userId">User ID</SelectItem>
                <SelectItem value="phone">Phone Number</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Input — Combobox for firmName, plain Input otherwise */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {getFieldLabel(searchField)}
            </label>

            {searchField === "firmName" ? (
              <Popover open={firmComboOpen} onOpenChange={setFirmComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={firmComboOpen}
                    className="w-full justify-between font-normal"
                  >
                    {searchQuery || "Select a firm name…"}
                    <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-full p-0"
                  style={{ width: "var(--radix-popover-trigger-width)" }}
                >
                  <Command>
                    <CommandInput placeholder="Type to filter firm names…" />
                    <CommandList>
                      {firmNamesLoading ? (
                        <CommandEmpty>Loading…</CommandEmpty>
                      ) : firmNames.length === 0 ? (
                        <CommandEmpty>No firm names found.</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {firmNames.map((name) => (
                            <CommandItem
                              key={name}
                              value={name}
                              onSelect={(val) => {
                                setSearchQuery(val);
                                setFirmComboOpen(false);
                              }}
                            >
                              <CheckIcon
                                className={clsx(
                                  "mr-2 h-4 w-4",
                                  searchQuery === name
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <Input
                placeholder={`Enter ${getFieldLabel(searchField).toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            )}
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
