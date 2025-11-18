"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

function INR(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export function PriceFilterSection({
  min,
  max,
  onPriceChange,
}: {
  min: number;
  max: number;
  currentSelection?: string;
  onPriceChange: (minPrice: number, maxPrice: number) => void;
}) {
  // Parse currentSelection or use defaults
  const [inputMin, setInputMin] = useState<number>(min);
  const [inputMax, setInputMax] = useState<number>(max);
  const [range, setRange] = useState<[number, number]>([min, max]);

  // Update slider from input
  const handleInputMin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(min, Math.min(Number(e.target.value), inputMax));
    setInputMin(val);
    setRange([val, inputMax]);
    // onPriceChange(val, inputMax); // Notify parent
  };

  const handleInputMax = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(max, Math.max(Number(e.target.value), inputMin));
    setInputMax(val);
    setRange([inputMin, val]);
    // onPriceChange(inputMin, val); // Notify parent
  };

  // Update input from slider
  const handleSlider = (vals: [number, number]) => {
    setRange(vals);
    setInputMin(vals[0]);
    setInputMax(vals[1]);
    // onPriceChange(vals[0], vals[1]); // Notify parent
  };

  const handleInputBlur = () => {
    onPriceChange(inputMin, inputMax);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <label className="text-sm font-medium">
        Price range: {INR(inputMin)} – {INR(inputMax)}
      </label>
      <Slider
        min={min}
        max={max}
        step={10}
        value={range}
        onValueChange={handleSlider}
        onBlur={handleInputBlur}
        className=""
      />
      <div className="flex w-full items-center gap-3">
        <div className="flex w-full gap-3">
          <label className="text-muted-foreground flex max-w-1/2 items-center text-xs">
            Minimum Price :{" "}
          </label>
          <Input
            type="number"
            min={min}
            max={inputMax}
            value={inputMin}
            onChange={handleInputMin}
            onBlur={handleInputBlur}
            className="bg-white"
          />
        </div>
        <span>—</span>
        <div className="flex w-full gap-3">
          <label className="text-muted-foreground flex max-w-1/2 items-center text-xs">
            Maximum Price :{" "}
          </label>
          <Input
            type="number"
            min={inputMin}
            max={max}
            value={inputMax}
            onChange={handleInputMax}
            onBlur={handleInputBlur}
            className="bg-white"
          />
        </div>
      </div>
    </div>
  );
}
