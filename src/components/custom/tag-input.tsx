// components/TagInput.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, XCircleIcon } from "lucide-react";
import { capitalize } from "@/lib/capitalize";

interface TagInputProps {
  label: string;
  values?: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  label,
  values,
  onChange,
  disabled = false,
  placeholder = "Type and press Enter",
}) => {
  const [inputValue, setInputValue] = useState("");

  const addTag = () => {
    const trimmed = capitalize(inputValue.trim());
    if (trimmed && values && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInputValue("");
  };

  const removeTag = (index: number) => {
    values && onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="flex gap-2">
        <Input
          autoComplete="on"
          value={inputValue}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
        />
        <Button
          type="button"
          variant="default"
          onClick={addTag}
          disabled={disabled || !inputValue.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {values && values.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {values.map((tag, idx) => (
            <span
              key={idx}
              className="flex items-center bg-gray-100 px-2 py-1 rounded-md gap-2 text-sm"
            >
              {tag}
              <XCircleIcon
                className="h-4 w-4  text-primary rounded-sm"
                onClick={() => removeTag(idx)}
              />
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
