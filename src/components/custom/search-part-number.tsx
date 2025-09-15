"use client";

import { useState } from "react";
import { SearchIcon, RotateCcwIcon } from "lucide-react";
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
import clsx from "clsx";
import { Product } from "@/types/product";
import ProductCard from "./product-card";
import { useAuth } from "@/context/useAuth";
import { searchProducts } from "@/lib/algolia/search";

export default function SearchPartNumber({
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
  const [result, setResult] = useState<Product[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const isAdmin = auth?.clientUser?.role === "admin" || false;

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
          className={clsx(buttonClassName, "h-full shadow-md")}
        >
          <SearchIcon /> {showText && <> Search Part Number</>}
        </Button>
      </DialogTrigger>

      <DialogContent className="h-fit w-full px-6 shadow-2xl sm:max-w-3xl md:max-w-2xl lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="mt-2">Search product</DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Find products by <strong>part name</strong> or{" "}
            <strong>part number</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <Input
            placeholder="Enter Part Number or Name to search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          {/* <p className="text-muted-foreground -mt-2 text-xs">
            🔍 Tip: This is an <strong>exact match</strong> search.
          </p> */}

          {loading && (
            <p className="text-muted-foreground text-sm">Searching...</p>
          )}

          {result && (
            <>
              <div className="text-center text-xs text-green-700 md:text-sm">
                ✅ Found <strong>{result.length} product(s)</strong> for your
                search: <strong>{searchQuery}</strong>
              </div>
              <div className="flex max-h-100 flex-col gap-3 overflow-auto p-1 md:max-h-150">
                {result.map((product) => {
                  console.log("Product from Algolia:", product);
                  return (
                    <div className="flex-1">
                      <ProductCard
                        key={product.id}
                        product={product}
                        isAdmin={isAdmin}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {notFound && (
            <p className="text-sm text-red-500">
              ❌ No product found for your search:{" "}
              <strong>{searchQuery}</strong>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSearch} disabled={loading}>
            {result ? (
              <>
                <RotateCcwIcon className="mr-1 h-4 w-4" />
                Search Again
              </>
            ) : (
              <>
                <SearchIcon className="mr-1 h-4 w-4" />
                Search Product
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
