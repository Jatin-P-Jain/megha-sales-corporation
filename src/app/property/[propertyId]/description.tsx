"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
export default function Description({ description }: { description: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <>
      <div
        className={`${
          isExpanded ? "" : "line-clamp-4"
        } text-ellipsis leading-relaxed transition-all duration-300`}
      >
        <ReactMarkdown>{description}</ReactMarkdown>
      </div>
      <Button
        variant={"link"}
        className=" text-sky-900 text-sm font-medium cursor-pointer mb-8 p-0 no-underline"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? "See less" : "See more"}
      </Button>
    </>
  );
}
