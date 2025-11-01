"use client";

import { FunnelPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export default function MoreFilters({
  showText = true,
}: {
  showText?: boolean;
}) {
  return (
    <Dialog>
      {/* 1) This wraps your button and makes it the trigger */}
      <DialogTrigger asChild>
        <Button variant="outline" className="text-muted-foreground">
          <FunnelPlusIcon /> {showText && "More Filters"}
        </Button>
      </DialogTrigger>

      {/* 2) This is the modal panel that opens */}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>More Filters</DialogTitle>
          <DialogDescription>
            Tweak additional filters for your product search.
          </DialogDescription>
        </DialogHeader>

        {/* 3) Put your additional filter controls here */}
        <div className="grid gap-4 py-4">
          {/* e.g. a date picker, price slider, etc */}
          <span className="text-primary flex items-center justify-center font-bold">
            (WORK IN PROGRESS)
          </span>
        </div>

        <DialogFooter>
          {/* 4) Close button to dismiss the dialog */}
          <DialogClose asChild>
            <Button>Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
