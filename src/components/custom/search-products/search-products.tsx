"use client";

import { useEffect, useRef, useState } from "react";
import { SearchIcon, RotateCcwIcon, Loader } from "lucide-react";
import clsx from "clsx";

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
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";

import type { Product } from "@/types/product";
import { useAuthState } from "@/context/useAuth";
import { searchProducts } from "@/lib/algolia/search";

import useDebouncedValue from "@/hooks/useDebouncedValue";
import { Input } from "@/components/ui/input";
import SearchResultsVirtual from "./search-results-virtual";

export default function SearchProducts({
  variant = "outline",
  buttonClassName,
}: {
  variant?: "outline" | "default";
  buttonClassName?: string;
  showText?: boolean;
}) {
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

  const { isAdmin } = useAuthState();

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

  const closeAll = () => {
    setOpenDesktop(false);
    setOpenMobile(false);
  };

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
    if (q.length < 2) return;

    const requestId = ++requestIdRef.current;

    setLoading(true);
    setResult(null);
    setNotFound(false);
    setSearchedPhrase(q);

    (async () => {
      try {
        const results = await searchProducts(q);

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
  }, [debouncedQuery, isOpen]);

  const Body = (
    <div className="grid gap-2">
      <div className="p-1 px-4">
        <Input
          placeholder="Enter Part Number or Name to search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
          ref={inputRef}
        />
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center gap-2">
          <Loader className="text-primary mx-auto h-4 w-4 animate-spin" />
          <p className="text-muted-foreground text-xs">Searching...</p>
        </div>
      )}

      {result && (
        <>
          <div className="text-center text-xs text-green-700 md:text-sm">
            ✅ Found <strong>{result.length} product(s)</strong> for your
            search: <strong>{searchedPhrase}</strong>
          </div>

          <SearchResultsVirtual
            items={result}
            isAdmin={isAdmin}
            onClose={() => closeAll()}
          />
        </>
      )}

      {notFound && (
        <p className="px-4 text-sm text-red-500">
          ❌ No product found for your search: <strong>{searchedPhrase}</strong>
        </p>
      )}
    </div>
  );

  const FooterAction = (
    <Button onClick={resetState} disabled={loading} className="mb-1">
      <RotateCcwIcon className="h-4 w-4" />
      Reset
    </Button>
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

          <DialogContent className="h-fit max-h-[90vh] w-[calc(100vw-2rem)] overflow-auto px-6 shadow-2xl sm:max-w-3xl md:max-w-2xl lg:max-w-4xl">
            <DialogHeader>
              <DialogTitle className="mt-2">Search product</DialogTitle>
              <DialogDescription className="text-xs md:text-sm">
                Find products by <strong>part name</strong> or{" "}
                <strong>part number</strong>.
              </DialogDescription>
            </DialogHeader>

            {Body}

            <DialogFooter>{FooterAction}</DialogFooter>
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

          <DrawerContent className="mx-auto h-full w-full max-w-lg">
            <DrawerHeader className="px-0">
              <DrawerTitle>Search product</DrawerTitle>
              <DrawerDescription className="text-xs">
                Find products by <strong>part name</strong> or{" "}
                <strong>part number</strong>.
              </DrawerDescription>
            </DrawerHeader>

            <div className="h-full overflow-y-auto">{Body}</div>
            <DrawerFooter className="p-1 pb-4">{FooterAction}</DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}
