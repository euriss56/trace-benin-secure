import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Variants partagés pour stagger / fade / slide.
 * Durées courtes (180-300ms) pour rester réactif.
 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

export const rowItem: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
};

/** Conteneur stagger générique */
export const StaggerGroup = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  ),
);
StaggerGroup.displayName = "StaggerGroup";

/** Item à utiliser dans <StaggerGroup> */
export const StaggerItem = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, children, ...props }, ref) => (
    <motion.div ref={ref} variants={fadeUp} className={className} {...props}>
      {children}
    </motion.div>
  ),
);
StaggerItem.displayName = "StaggerItem";

/** Card animée hover (élévation + scale léger) */
export const MotionCard = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={fadeUp}
      whileHover={{ y: -3, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className={cn("will-change-transform", className)}
      {...props}
    >
      {children}
    </motion.div>
  ),
);
MotionCard.displayName = "MotionCard";

/** Wrapper bouton : hover scale + tap. */
export function MotionTap({
  children,
  className,
  disabled,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <motion.div
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className={cn("inline-block", className)}
    >
      {children}
    </motion.div>
  );
}

/** Ligne de tableau animée (à utiliser avec <StaggerGroup as="tbody"> indirect) */
export function MotionRow({
  children,
  className,
  ...props
}: HTMLMotionProps<"tr">) {
  return (
    <motion.tr variants={rowItem} className={className} {...props}>
      {children}
    </motion.tr>
  );
}
