"use client";
import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "../ui/button";
import Link from "next/link";
import { UserData } from "@/types/user";
import { useAuth } from "@/context/useAuth";

const Greetings = ({ user }: { user: UserData | undefined }) => {
  const auth = useAuth();
  const { displayName, role } = user ?? {};
  const isAdmin = role === "admin";
  const userName = displayName ?? "Guest";

  return (
    <Card className="mx-auto max-w-lg shadow-lg">
      <CardHeader>
        <h1 className="text-center text-xl font-bold">Welcome, {userName}</h1>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {isAdmin && (
          <div className="flex w-full items-center justify-center text-green-800">
            Admin Access Granted
          </div>
        )}
        <p className="text-center text-gray-600">
          We are delighted to have you here. Explore our products and services
          to find what suits your needs.
        </p>
        {!user && (
          <Button className="w-full" asChild>
            <Link href={"/login"}>Login</Link>
          </Button>
        )}
        {isAdmin && (
          <Button className="w-full" asChild>
            <Link href={"/admin-dashboard"}>Admin Dashboard</Link>
          </Button>
        )}
        <Button className="w-full" asChild>
          <Link href={"/products-list"}>Explore Products</Link>
        </Button>
        <Button
          onClick={async () => {
            await auth.logout();
          }}
        >
          Logout
        </Button>
      </CardContent>
    </Card>
  );
};

export default Greetings;
