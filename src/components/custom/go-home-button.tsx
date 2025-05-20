"use client";
import React from "react";
import { Button } from "../ui/button";

const GoHomeButton: React.FC = () => (
  <Button
    onClick={() => {
      window.location.assign("/");
    }}
  >
    ← Back to Home
  </Button>
);

export default GoHomeButton;
