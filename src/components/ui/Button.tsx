// components/Button.tsx
"use client";
import React, { forwardRef, ReactElement, isValidElement, cloneElement } from "react";

type Variant = "ghost" | "hero" | "destructive";
type Size = "icon" | "default" | "sm";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean; // if true, clones child and applies props to it (useful for next/link)
  className?: string;
  children?: React.ReactNode;
}

const baseStyles =
  "inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-colors disabled:opacity-50 disabled:pointer-events-none";

const variantStyles: Record<Variant, string> = {
  ghost: "bg-transparent hover:bg-background/50 text-muted-foreground",
  hero: "bg-primary text-primary-foreground hover:brightness-95 shadow-sm",
  destructive: "bg-destructive text-destructive-foreground hover:brightness-95",
};

const sizeStyles: Record<Size, string> = {
  icon: "p-2 rounded-md",
  default: "px-4 py-2 h-10",
  sm: "px-3 py-1.5 h-8 text-sm",
};

function twMerge(...parts: Array<string | undefined | false>) {
  // tiny class merge: concatenates while avoiding duplicate spaces.
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "ghost", size = "default", asChild = false, className, children, ...rest }, ref) => {
    const classes = twMerge(baseStyles, variantStyles[variant], sizeStyles[size], className);

    // asChild behavior: clone child element if provided
    if (asChild) {
      if (!isValidElement(children)) {
        // Fallback: render a button if child isn't a valid element
        return (
          <button ref={ref} className={classes} {...rest}>
            {children}
          </button>
        );
      }

      // Single React element (e.g., Next.js Link). Merge props and className.
      const child = children as ReactElement;
      const childClassName = ((child.props as unknown as any).className ?? "") as string;
      const mergedClassName = twMerge(classes, childClassName);

      // Build props to merge into child
      const childProps: any = {
        className: mergedClassName,
      };

      // If `rest` contains onClick or aria attributes or disabled, inject them into child
      // Note: anchor elements don't have disabled; if disabled, we add aria-disabled
      if (rest.onClick) childProps.onClick = rest.onClick;
      if (rest["aria-label"]) childProps["aria-label"] = rest["aria-label"];
      if (rest.disabled) {
        childProps["aria-disabled"] = true;
        // For anchors, prevent pointer events via style/class; we already have disabled styles in tailwind class
      }

      // Some frameworks (next/link) expect href on the Link, so we don't change href
      return cloneElement(child, childProps);
    }

    // Default: render a native button
    return (
      <button ref={ref} className={classes} {...rest}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
