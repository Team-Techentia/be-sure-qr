// components/Label.tsx
"use client";
import React, { forwardRef } from "react";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
}

function twMerge(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

const baseStyles = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return <label ref={ref} className={twMerge(baseStyles, className)} {...props} />;
  }
);

Label.displayName = "Label";

export default Label;
