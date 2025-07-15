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
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/firebase/client";
import { Product } from "@/types/product";
import ProductCard from "./product-card";
import { useAuth } from "@/context/useAuth";

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
  const [partNumber, setPartNumber] = useState("");
  const [formattedPartNumber, setFormattedPartNumber] = useState("");
  const [result, setResult] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const isAdmin = auth?.clientUser?.role === "admin" || false;

  const resetState = () => {
    setPartNumber("");
    setResult(null);
    setNotFound(false);
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!partNumber.trim()) return;

    setLoading(true);
    setResult(null);
    setNotFound(false);

    const formattedPartNumber = partNumber.trim().toUpperCase();
    setFormattedPartNumber(formattedPartNumber);

    try {
      const productSnap = await getDoc(
        doc(firestore, "products", formattedPartNumber),
      );

      if (productSnap.exists()) {
        setResult(productSnap.data() as Product);
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
        <Button variant={variant} className={clsx(buttonClassName, "h-full")}>
          <SearchIcon /> {showText && <> Search Part Number</>}
        </Button>
      </DialogTrigger>

      <DialogContent className="h-fit w-full sm:max-w-screen-md px-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="mt-2">
            Search product by part number
          </DialogTitle>
          <DialogDescription> 
            Enter the exact part number of the product you'd like to find.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <Input
            placeholder="Enter exact part number (e.g., PRT00123)"
            value={partNumber}
            onChange={(e) => setPartNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <p className="text-muted-foreground -mt-2 text-xs">
            🔍 Tip: This is an <strong>exact match</strong> search.
          </p>

          {loading && (
            <p className="text-muted-foreground text-sm">Searching...</p>
          )}

          {result && (
            <>
              <div className="text-sm text-green-600">
                ✅ Product found for part number:{" "}
                <strong>{formattedPartNumber}</strong>
              </div>
              <ProductCard key={result.id} product={result} isAdmin={isAdmin} />
            </>
          )}

          {notFound && (
            <p className="text-sm text-red-500">
              ❌ No product found with part number:{" "}
              <strong>{formattedPartNumber}</strong>
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
