import { motion } from "framer-motion";
import { forwardRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<typeof Input> & {
  invalid?: boolean;
  wrapperClassName?: string;
};

/**
 * Input avec animation focus (scale subtil + shake si invalide).
 * Garde l'apparence du <Input> shadcn existant.
 */
export const AnimatedInput = forwardRef<HTMLInputElement, Props>(
  ({ invalid, onFocus, onBlur, wrapperClassName, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    return (
      <motion.div
        animate={
          invalid
            ? { x: [0, -6, 6, -4, 4, 0] }
            : focused
              ? { scale: 1.01 }
              : { scale: 1 }
        }
        transition={
          invalid
            ? { duration: 0.4, ease: "easeInOut" }
            : { type: "spring", stiffness: 320, damping: 22 }
        }
        className={cn("origin-left", wrapperClassName)}
      >
        <Input
          ref={ref}
          {...props}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          aria-invalid={invalid || undefined}
          className={cn(
            invalid && "border-destructive focus-visible:ring-destructive/40",
            props.className,
          )}
        />
      </motion.div>
    );
  },
);
AnimatedInput.displayName = "AnimatedInput";
