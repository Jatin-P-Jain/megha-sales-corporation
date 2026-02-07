"use client";

import { useEffect, useState } from "react";
import { SearchIcon, RotateCcwIcon, Loader } from "lucide-react";
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
import { Input } from "../ui/input";
import clsx from "clsx";
import { Product } from "@/types/product";
import ProductCard from "./product-card";
import { useAuth } from "@/context/useAuth";
import { searchProducts } from "@/lib/algolia/search";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);

    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

export default function SearchProducts({
  variant = "outline",
  buttonClassName,
  showText = true,
}: {
  variant?: "outline" | "default";
  buttonClassName?: string;
  showText?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedPhrase, setSearchedPhrase] = useState("");
  const [result, setResult] = useState<Product[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const isAdmin = auth?.clientUser?.userType === "admin" || false;

  const isDesktop = useMediaQuery("(min-width: 768px)");

  const resetState = () => {
    setSearchQuery("");
    setResult(null);
    setNotFound(false);
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setResult(null);
    setNotFound(false);
    setSearchedPhrase(searchQuery);

    try {
      const results = await searchProducts(searchQuery.trim());
      if (results.length > 0) {
        setResult(results as Product[]);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error("Search error:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const TriggerButton = (
    <Button variant={variant} className={clsx(buttonClassName, "shadow-lg")}>
      <SearchIcon /> {showText && <> Search Products</>}
    </Button>
  );

  const Body = (
    <div className="grid gap-2">
      <Input
        placeholder="Enter Part Number or Name to search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
      />

      {loading && (
        <div className="flex flex-col items-center justify-center gap-2">
          <Loader className="text-primary mx-auto h-4 w-4 animate-spin" />
          <p className="text-muted-foreground text-xs">Searching...</p>
        </div>
      )}

      {result && (
        <>
          <div className="text-center text-xs text-green-700 md:text-sm">
            ✅ Found <strong>{result.length} product(s)</strong> for your search:{" "}
            <strong>{searchedPhrase}</strong>
          </div>
          <div className="flex flex-col gap-3 overflow-auto p-1 max-h-110 md:max-h-130">
            {result.map((product) => (
              <div className="flex-1" key={product.id}>
                <ProductCard product={product} isAdmin={isAdmin} />
              </div>
            ))}
          </div>
        </>
      )}

      {notFound && (
        <p className="text-sm text-red-500">
          ❌ No product found for your search: <strong>{searchedPhrase}</strong>
        </p>
      )}
    </div>
  );

  const FooterAction = (
    <Button onClick={handleSearch} disabled={loading}>
      {result ? (
        <>
          <RotateCcwIcon className="mr-1 h-4 w-4" />
          Search Another Product
        </>
      ) : (
        <>
          <SearchIcon className="mr-1 h-4 w-4" />
          Search Product
        </>
      )}
    </Button>
  );

  if (isDesktop) {
    return (
      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) resetState();
        }}
      >
        <DialogTrigger asChild>{TriggerButton}</DialogTrigger>

        <DialogContent className="h-fit max-h-[90vh] w-[calc(100vw-2rem)] px-6 shadow-2xl sm:max-w-3xl md:max-w-2xl lg:max-w-4xl overflow-auto">
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
    );
  }

  // Mobile: bottom drawer
  return (
    <Drawer
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) resetState();
      }}
    >
      <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>

      <DrawerContent className="p-3 shadow-2xl">
        <DrawerHeader className="px-0">
          <DrawerTitle>Search product</DrawerTitle>
          <DrawerDescription className="text-xs">
            Find products by <strong>part name</strong> or{" "}
            <strong>part number</strong>.
          </DrawerDescription>
        </DrawerHeader>

        <div className="h-full">{Body}</div>

        <DrawerFooter className="px-0">{FooterAction}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
