"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  SearchIcon,
  XIcon,
  Loader,
  Loader2,
  PackageCheckIcon,
  Search,
  TextSearch,
  ChevronDownIcon,
  CheckIcon,
  PlusIcon,
} from "lucide-react";
import clsx from "clsx";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import type { Product } from "@/types/product";
import { useAuthState } from "@/context/useAuth";
import { useUserGate } from "@/context/UserGateProvider";
import { searchProductsByBrands } from "@/lib/algolia/search";

import useDebouncedValue from "@/hooks/useDebouncedValue";
import { Input } from "@/components/ui/input";
import { useDrawerBackButton } from "@/hooks/useDrawerBackButton";
import SearchResultsVirtual from "./search-results-virtual";
import { usePathname, useSearchParams } from "next/navigation";
import { unslugify } from "@/lib/utils";
import { useSafeRouter } from "@/hooks/useSafeRouter";

type BrandOption = { id: string; name: string };

export default function SearchProducts({
  variant = "outline",
  buttonClassName,
  brands = [],
}: {
  variant?: "outline" | "default";
  buttonClassName?: string;
  showText?: boolean;
  brands?: BrandOption[];
}) {
  const [brandPickerOpen, setBrandPickerOpen] = useState(false);
  // Separate open states to avoid both Dialog and Drawer being open simultaneously
  // (portals can render even if trigger wrappers are hidden via CSS). [web:43][web:32]
  const [openDesktop, setOpenDesktop] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);
  const isOpen = openDesktop || openMobile;

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  const [searchedPhrase, setSearchedPhrase] = useState("");
  const [result, setResult] = useState<Product[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useSafeRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedBrandIds = useMemo(() => {
    const raw = searchParams.get("brandId") || "";
    return raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }, [searchParams]);

  const selectedBrandLabels = useMemo(
    () => selectedBrandIds.map((id) => unslugify(id)),
    [selectedBrandIds],
  );

  const brandScopeText = useMemo(() => {
    if (selectedBrandLabels.length === 0)
      return `Limit search to specific brands`;
    return `Search limited to filtered brands: `;
  }, [selectedBrandLabels]);

  const updateBrandScope = (nextBrandIds: string[]) => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextBrandIds.length > 0) {
      params.set("brandId", nextBrandIds.join(","));
    } else {
      params.delete("brandId");
    }

    params.set("page", "1");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      allowDuringNav: true,
    });
  };

  const removeScopedBrand = (brandId: string) => {
    const next = selectedBrandIds.filter((id) => id !== brandId);
    updateBrandScope(next);
  };

  const clearBrandScope = () => {
    updateBrandScope([]);
  };

  const toggleBrandInScope = (brandId: string) => {
    const next = selectedBrandIds.includes(brandId)
      ? selectedBrandIds.filter((id) => id !== brandId)
      : [...selectedBrandIds, brandId];
    updateBrandScope(next);
  };

  const AddBrandPicker = brands.length > 0 && (
    <Popover open={brandPickerOpen} onOpenChange={setBrandPickerOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="border-primary text-primary hover:bg-primary/5 inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-1 text-xs transition-colors"
        >
          <PlusIcon className="h-3 w-3" />
          Add brand
          <ChevronDownIcon className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-52 p-1"
        align="start"
        onInteractOutside={() => setBrandPickerOpen(false)}
      >
        <ul className="flex flex-col">
          {brands.map((brand) => {
            const isSelected = selectedBrandIds.includes(brand.id);
            return (
              <li key={brand.id}>
                <button
                  type="button"
                  onClick={() => toggleBrandInScope(brand.id)}
                  className="hover:bg-accent flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs"
                >
                  <div
                    className={clsx(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/40",
                    )}
                  >
                    {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
                  </div>
                  <span className="truncate">{brand.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );

  const { isAdmin } = useAuthState();
  const { accountStatus } = useUserGate();

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Used to ignore stale async results when typing quickly
  const requestIdRef = useRef(0);

  const resetState = () => {
    requestIdRef.current += 1; // invalidate in-flight responses
    setSearchQuery("");
    setSearchedPhrase("");
    setResult(null);
    setNotFound(false);
    setLoading(false);
  };
  useDrawerBackButton(openMobile, () => onMobileOpenChange(false));

  const onDesktopOpenChange = (value: boolean) => {
    setOpenDesktop(value);
    if (!value) resetState();
  };

  const onMobileOpenChange = (value: boolean) => {
    setOpenMobile(value);
    if (!value) resetState();
  };

  // Debounced auto-search (only when open)
  useEffect(() => {
    if (!isOpen) return;

    const q = debouncedQuery.trim();

    // If query cleared, clear UI state
    if (!q) {
      requestIdRef.current += 1;
      setSearchedPhrase("");
      setResult(null);
      setNotFound(false);
      setLoading(false);
      return;
    }

    // Optional: minimum characters before search
    if (q.length < 1) return;

    const requestId = ++requestIdRef.current;

    setLoading(true);
    setResult(null);
    setNotFound(false);
    setSearchedPhrase(q);

    (async () => {
      try {
        const results = await searchProductsByBrands(q, selectedBrandIds);

        // ignore stale responses
        if (requestId !== requestIdRef.current) return;

        if (results.length > 0) setResult(results as Product[]);
        else setNotFound(true);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        console.error("Search error:", err);
        setNotFound(true);
      } finally {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
      }
    })();
  }, [debouncedQuery, isOpen, selectedBrandIds]);

  const Body = (
    <div className="grid gap-2">
      <div className="flex items-center gap-2 p-1">
        <Input
          placeholder="Search by Part Number or Name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
          ref={inputRef}
        />
        {searchQuery && (
          <Button
            variant="secondary"
            size="icon"
            onClick={resetState}
            disabled={loading}
            className="shrink-0"
            aria-label="Clear search"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {brands.length > 0 && (
        <div className="bg-primary/5 rounded-md px-2 py-2">
          {brandScopeText && (
            <div className="flex items-center justify-between">
              <p className="text-primary/90 flex items-center gap-1 text-xs font-medium">
                <TextSearch className="size-4" />
                {brandScopeText}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-red-700"
                onClick={clearBrandScope}
                disabled={selectedBrandIds.length === 0}
              >
                Clear All
              </Button>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            {AddBrandPicker}
            {selectedBrandIds.map((brandId, index) => (
              <button
                key={brandId}
                type="button"
                onClick={() => removeScopedBrand(brandId)}
                className="border-primary/30 bg-background inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs"
                aria-label={`Remove brand ${selectedBrandLabels[index]} from search scope`}
                title="Remove from search scope"
              >
                <span>{selectedBrandLabels[index]}</span>
                <XIcon className="text-muted-foreground h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center gap-2">
          <Loader className="text-primary mx-auto h-4 w-4 animate-spin" />
          <p className="text-muted-foreground text-xs">Searching...</p>
        </div>
      )}

      {result && (
        <>
          <div className="px-4 text-left text-xs text-green-700 md:text-sm">
            <PackageCheckIcon className="mr-1 inline-block h-4 w-4" />
            Found
            <span className="font-medium">
              {" "}
              {result.length} product{result.length !== 1 ? "s" : ""}
            </span>{" "}
            for <span className="font-semibold">{searchedPhrase}</span>
            {selectedBrandLabels.length > 0 && <> within selected scope</>}
          </div>

          <SearchResultsVirtual
            items={result}
            isAdmin={isAdmin}
            isAccountApproved={accountStatus === "approved"}
          />
        </>
      )}

      {notFound && (
        <p className="px-4 text-sm text-red-500">
          ❌ No product found for{" "}
          <span className="font-semibold">{searchedPhrase}</span>
          {selectedBrandLabels.length > 0 && <> inside selected brand scope</>}
        </p>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop (md+) */}
      <div className="hidden md:block">
        <Dialog open={openDesktop} onOpenChange={onDesktopOpenChange}>
          <DialogTrigger asChild>
            <Button
              variant={variant}
              className={clsx(buttonClassName, "shadow-lg")}
              onClick={() => {
                // Defensive: ensure mobile drawer is closed if user resized
                setOpenMobile(false);
              }}
            >
              <SearchIcon />
              Search Products
            </Button>
          </DialogTrigger>

          <DialogContent className="mt-8 max-h-[90vh] w-[calc(100vw-2rem)] flex-1 overflow-auto px-4 shadow-2xl sm:max-w-3xl md:max-w-2xl lg:max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm md:text-base">
                <Search />
                Search Products
              </DialogTitle>
              <DialogDescription className="text-xs md:text-sm">
                Find products by <strong>part name</strong> or{" "}
                <strong>part number</strong>.
              </DialogDescription>
            </DialogHeader>

            {Body}
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile (< md) */}
      <div className="md:hidden">
        <Drawer
          open={openMobile}
          onOpenChange={onMobileOpenChange}
          repositionInputs={false}
        >
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              className="text-primary-foreground flex-col gap-0 bg-transparent p-0! shadow-md"
              onClick={() => {
                // Defensive: ensure desktop dialog is closed if user resized
                setOpenDesktop(false);
              }}
            >
              <SearchIcon className="size-5" />
              <span className="text-[10px]">Search</span>
            </Button>
          </DrawerTrigger>

          <DrawerContent className="mx-auto flex h-[calc(100dvh-5rem)] min-h-[calc(100dvh-5rem)] w-full max-w-lg flex-col gap-0! overflow-hidden">
            <DrawerHeader className="shrink-0 gap-1 p-4 py-2">
              <DrawerTitle className="flex items-center justify-center gap-2 text-sm md:text-base">
                <Search />
                Search Products
              </DrawerTitle>
              <DrawerDescription className="p-0 text-xs">
                Find products by <strong>part name</strong> or{" "}
                <strong>part number</strong>.
              </DrawerDescription>
            </DrawerHeader>

            {/* Input + X button pinned below the header */}
            <div className="flex shrink-0 items-center gap-2 p-1 px-4">
              <Input
                placeholder="Search by Part Number or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                ref={inputRef}
              />
              {searchQuery && (
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={resetState}
                  disabled={loading}
                  className="text-muted-foreground shrink-0"
                  aria-label="Clear search"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              )}
            </div>

            {brands.length > 0 && (
              <div className="bg-primary/5 mx-4 mt-2 shrink-0 rounded-md px-2 py-2">
                {brandScopeText && (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-primary/90 flex items-center gap-1 text-xs font-medium">
                      <TextSearch className="size-4" />
                      {brandScopeText}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-red-700"
                      onClick={clearBrandScope}
                      disabled={selectedBrandIds.length === 0}
                    >
                      Clear All
                    </Button>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-1.5">
                  {AddBrandPicker}
                  {selectedBrandIds.map((brandId, index) => (
                    <button
                      key={brandId}
                      type="button"
                      onClick={() => removeScopedBrand(brandId)}
                      className="border-primary/30 bg-background inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px]"
                      aria-label={`Remove brand ${selectedBrandLabels[index]} from search scope`}
                      title="Remove from search scope"
                    >
                      <span>{selectedBrandLabels[index]}</span>
                      <XIcon className="text-muted-foreground h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results area fills all remaining space */}
            <div className="flex min-h-0 flex-1 flex-col">
              {loading && (
                <div className="flex flex-col items-center justify-center gap-2 py-4">
                  <Loader2 className="text-primary mx-auto h-4 w-4 animate-spin" />
                  <p className="text-muted-foreground text-xs">Searching...</p>
                </div>
              )}
              {result && (
                <>
                  <div className="shrink-0 py-1 text-center text-xs text-green-700">
                    ✅ Found{" "}
                    <strong>
                      {result.length} product{result.length > 1 ? "s" : ""}
                    </strong>{" "}
                    for <strong>{searchedPhrase}</strong>
                    {selectedBrandLabels.length > 0 && (
                      <> within selected scope</>
                    )}
                  </div>
                  <div className="min-h-0 flex-1">
                    <SearchResultsVirtual
                      items={result}
                      isAdmin={isAdmin}
                      isAccountApproved={accountStatus === "approved"}
                      fillHeight
                    />
                  </div>
                </>
              )}
              {notFound && (
                <p className="px-4 py-2 text-sm text-red-500">
                  ❌ No product found for <strong>{searchedPhrase}</strong>
                  {selectedBrandLabels.length > 0 && (
                    <> inside selected brand scope</>
                  )}
                </p>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}
