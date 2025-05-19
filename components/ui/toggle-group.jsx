"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

// Simple toggle group implementation without Radix UI
const ToggleGroup = React.forwardRef(({ className, children, value, onValueChange, type = "single", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center gap-1", className)}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            isSelected: type === "single" ? value === child.props.value : (value || []).includes(child.props.value),
            onSelect: () => {
              if (type === "single") {
                onValueChange(child.props.value);
              } else {
                const newValue = [...(value || [])];
                const index = newValue.indexOf(child.props.value);
                if (index === -1) {
                  newValue.push(child.props.value);
                } else {
                  newValue.splice(index, 1);
                }
                onValueChange(newValue);
              }
            }
          });
        }
        return child;
      })}
    </div>
  );
});
ToggleGroup.displayName = "ToggleGroup";

const ToggleGroupItem = React.forwardRef(({
  className,
  children,
  variant = "default",
  size = "default",
  value,
  isSelected,
  onSelect,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        buttonVariants({
          variant: variant === "default" ? "outline" : variant,
          size,
        }),
        isSelected && "bg-primary text-primary-foreground",
        className
      )}
      onClick={onSelect}
      data-state={isSelected ? "on" : "off"}
      {...props}
    >
      {children}
    </button>
  );
});
ToggleGroupItem.displayName = "ToggleGroupItem";

export { ToggleGroup, ToggleGroupItem }
