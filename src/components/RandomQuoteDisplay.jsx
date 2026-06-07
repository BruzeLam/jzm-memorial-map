import React, { useState, useEffect } from 'react';
import { useQuotesContext } from '../context/QuotesContext';

export default function RandomQuoteDisplay() {
  const { quotes } = useQuotesContext();
  const [currentQuote, setCurrentQuote] = useState(null);
  const [usedIndices, setUsedIndices] = useState(new Set());
  const [isTransitioning, setIsTransitioning] = useState(false);

  const shortQuotes = quotes.filter((q) => q.text.length < 50);

  const selectNewQuote = (used) => {
    setIsTransitioning(true);

    setTimeout(() => {
      const filtered = shortQuotes;
      if (!filtered.length) {
        setCurrentQuote(null);
        setIsTransitioning(false);
        return;
      }

      const available = Array.from({ length: filtered.length }, (_, i) => i).filter(
        (i) => !used.has(i)
      );

      if (available.length === 0) {
        used.clear();
        available.push(...Array.from({ length: filtered.length }, (_, i) => i));
      }

      const randomIdx = available[Math.floor(Math.random() * available.length)];
      const newUsed = new Set(used);
      newUsed.add(randomIdx);
      setUsedIndices(newUsed);
      setCurrentQuote(filtered[randomIdx]);
      setIsTransitioning(false);
    }, 200);
  };

  useEffect(() => {
    if (shortQuotes.length) {
      selectNewQuote(new Set());
    } else {
      setCurrentQuote(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes.length]);

  const handleClick = () => {
    if (!isTransitioning && shortQuotes.length) {
      selectNewQuote(usedIndices);
    }
  };

  if (!currentQuote) return null;

  return (
    <div
      onClick={handleClick}
      className="flex-1 mx-4 px-4 py-1 text-center cursor-pointer transition-opacity hover:opacity-60 flex items-center justify-center"
      style={{ opacity: isTransitioning ? 0.3 : 1 }}
    >
      <p className="text-xs text-gray-500 font-light leading-tight line-clamp-2 max-w-md transition-opacity duration-200">
        {currentQuote.text}
      </p>
    </div>
  );
}
