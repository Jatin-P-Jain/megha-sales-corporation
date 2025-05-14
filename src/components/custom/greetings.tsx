"use client";
import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/auth";
import { Button } from "../ui/button";
import Link from "next/link";

const Greetings: React.FC = () => {
  const auth = useAuth();
  const { currentUser, customClaims } = auth || {};
  const userName = currentUser?.displayName || "Guest";
  const isAdmin = customClaims?.admin === true;

  return (
    <Card className="max-w-lg mx-auto shadow-lg">
      <CardHeader>
        <h1 className="text-xl font-bold text-center">Welcome, {userName}</h1>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {currentUser && isAdmin && (
          <div className="text-green-800 flex w-full items-center justify-center">
            Admin Access Granted
          </div>
        )}
        <p className="text-center text-gray-600">
          We are delighted to have you here. Explore our products and services
          to find what suits your needs.
        </p>
        {!currentUser && (
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
      </CardContent>
    </Card>
  );
};

export default Greetings;
