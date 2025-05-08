"use client";
import React from "react";
import Link from "next/link";

const LoginLink: React.FC = () => {
  return (
    <Link
      href={"/login"}
      className="text-cyan-900 underline"
      onClick={(e) => {
        e.preventDefault(); // stop the client-side router
        window.location.assign("/login"); // hard navigate with full reload
      }}
    >
      Login to your account
    </Link>
  );
};

export default LoginLink;
