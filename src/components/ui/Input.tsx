// components/Input.tsx
"use client";
import React, { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

function twMerge(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

const baseStyles =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm " +
  "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} className={twMerge(baseStyles, className)} {...props} />;
  }
);

Input.displayName = "Input";

export default Input;
