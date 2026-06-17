import React, { useState, useEffect } from 'react';
import { useQuotesContext } from '../context/QuotesContext';

export default function RandomQuoteDisplay() {
  const { quotes } = useQuotesContext();
  const [currentQuote, setCurrentQuote] = useState(null);
  const [usedIndices, setUsedIndices] = useState(new Set());
  const [fadeClass, setFadeClass] = useState('header-quote-fade--in');

  const shortQuotes = quotes.filter((q) => q.text.length < 50);

  const selectNewQuote = (used) => {
    setFadeClass('header-quote-fade--out');

    setTimeout(() => {
      const filtered = shortQuotes;
      if (!filtered.length) {
        setCurrentQuote(null);
        setFadeClass('header-quote-fade--in');
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
      setFadeClass('header-quote-fade--in');
    }, 220);
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
    if (fadeClass !== 'header-quote-fade--out' && shortQuotes.length) {
      selectNewQuote(usedIndices);
    }
  };

  if (!currentQuote) return null;

  return (
    <div
      onClick={handleClick}
      className="flex-1 mx-2 md:mx-4 px-3 py-1 text-center cursor-pointer hover:opacity-80 flex items-center justify-center min-w-0"
      title="点击换一条"
    >
      <p
        className={`text-xs text-memorial-muted font-light leading-tight line-clamp-2 max-w-md header-quote-fade ${fadeClass}`}
      >
        {currentQuote.text}
      </p>
    </div>
  );
}
