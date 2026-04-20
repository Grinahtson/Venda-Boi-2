import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ArrobaTickerProps {
  value: number;
  animated?: boolean;
  dynamic?: boolean;
}

export function ArrobaTicker({ value, animated = true, dynamic = true }: ArrobaTickerProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [marketPrice, setMarketPrice] = useState(value);

  // Fetch current market price for arroba
  useEffect(() => {
    if (!dynamic) {
      setMarketPrice(value);
      return;
    }

    const fetchPrice = async () => {
      try {
        const response = await fetch('/api/market/arroba-price');
        if (response.ok) {
          const data = await response.json();
          setMarketPrice(data.price || value);
        }
      } catch (error) {
        console.log('Market price unavailable, using static');
        setMarketPrice(value);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [value, dynamic]);

  useEffect(() => {
    if (!animated) {
      setDisplayValue(marketPrice);
      return;
    }

    let animInterval: NodeJS.Timeout;
    if (displayValue !== marketPrice) {
      animInterval = setInterval(() => {
        setDisplayValue((prev) => {
          if (prev < marketPrice) return Math.min(prev + 0.1, marketPrice);
          if (prev > marketPrice) return Math.max(prev - 0.1, marketPrice);
          return marketPrice;
        });
      }, 10);
    }

    return () => clearInterval(animInterval);
  }, [marketPrice, animated]);

  return (
    <motion.div
      className="inline-block"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-semibold"
      >
        {displayValue.toFixed(2)}
      </motion.span>
    </motion.div>
  );
}
