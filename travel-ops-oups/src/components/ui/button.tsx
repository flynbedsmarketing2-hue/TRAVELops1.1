'use client';

import * as React from "react";
import { cn } from "./cn";
import type { ButtonSize, ButtonVariant } from "./buttonStyles";
import { buttonBase, buttonClassName, buttonSizes, buttonVariants } from "./buttonStyles";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};
export { buttonClassName };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    />
  )
);

Button.displayName = "Button";
