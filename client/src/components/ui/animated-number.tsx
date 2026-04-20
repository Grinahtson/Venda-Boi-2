import { motion } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  decimals = 1,
  prefix = "",
  suffix = "",
  className = ""
}: AnimatedNumberProps) {
  return (
    <motion.span
      key={value}
      className={className}
      initial={{ opacity: 0, y: -10, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.8 }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
    >
      {prefix}{value.toFixed(decimals)}{suffix}
    </motion.span>
  );
}

interface AnimatedBoxProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedBox({ children, className = "" }: AnimatedBoxProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      transition={{
        duration: 0.3,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  );
}
