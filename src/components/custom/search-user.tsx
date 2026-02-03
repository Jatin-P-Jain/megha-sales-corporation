"use client";

import { useState } from "react";
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
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import clsx from "clsx";
import { UserData } from "@/types/user";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "@/firebase/client";
import UserCard from "@/app/admin-dashboard/users/user-card";

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
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("email");
  const [searchedPhrase, setSearchedPhrase] = useState("");
  const [searchedField, setSearchedField] = useState<SearchField>("email");
  const [result, setResult] = useState<UserData[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetState = () => {
    setSearchQuery("");
    setSearchField("email");
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
    setSearchedField(searchField);

    try {
      const usersRef = collection(firestore, "users");
      let q;

      if (searchField === "uid") {
        // For UID, directly get the document
        const docSnapshot = await getDocs(
          query(usersRef, where("__name__", "==", searchQuery.trim())),
        );

        if (!docSnapshot.empty) {
          const users = docSnapshot.docs.map((doc) => ({
            uid: doc.id,
            ...doc.data(),
          })) as UserData[];
          setResult(users);
        } else {
          setNotFound(true);
        }
      } else {
        // For other fields, use where query
        q = query(usersRef, where(searchField, "==", searchQuery.trim()));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const users = querySnapshot.docs.map((doc) => ({
            uid: doc.id,
            ...doc.data(),
          })) as UserData[];
          setResult(users);
        } else {
          setNotFound(true);
        }
      }
    } catch (err) {
      console.error("Search error:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
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

      <DialogContent className="h-fit max-h-[75vh] w-full px-6 shadow-2xl sm:max-w-3xl md:max-w-2xl lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="mt-2">Search User</DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Find users by <strong>email</strong>, <strong>phone</strong>,{" "}
            <strong>name</strong>, or <strong>user ID</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          {/* Search Field Selector */}
          <div className="flex gap-2">
            <Select
              value={searchField}
              onValueChange={(value: SearchField) => setSearchField(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Search by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone Number</SelectItem>
                <SelectItem value="displayName">Name</SelectItem>
                <SelectItem value="uid">User ID</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder={`Enter ${getFieldLabel(searchField).toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center gap-2 py-4">
              <Loader className="text-primary mx-auto h-4 w-4 animate-spin" />
              <p className="text-muted-foreground text-xs">Searching...</p>
            </div>
          )}

          {result && (
            <>
              <div className="text-center text-xs text-green-700 md:text-sm">
                ✅ Found <strong>{result.length} user(s)</strong> for{" "}
                {getFieldLabel(searchedField)}:{" "}
                <strong>{searchedPhrase}</strong>
              </div>
              <div className="flex max-h-96 flex-col gap-3 overflow-auto p-1 md:max-h-[400px]">
                {result.map((user) => (
                  <div className="flex-1" key={user.uid}>
                    <UserCard user={user} />
                  </div>
                ))}
              </div>
            </>
          )}

          {notFound && (
            <p className="text-sm text-red-500">
              ❌ No user found for {getFieldLabel(searchedField)}:{" "}
              <strong>{searchedPhrase}</strong>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
          >
            {result ? (
              <>
                <RotateCcwIcon className="mr-1 h-4 w-4" />
                Search Another User
              </>
            ) : (
              <>
                <SearchIcon className="mr-1 h-4 w-4" />
                Search User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
