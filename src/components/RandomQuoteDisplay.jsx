import React, { useState, useEffect } from 'react';
import { QUOTES } from '../data/quotes';

export default function RandomQuoteDisplay() {
  const [currentQuote, setCurrentQuote] = useState(null);
  const [usedIndices, setUsedIndices] = useState(new Set());

  // 初始化：加载第一条随机语录
  useEffect(() => {
    selectNewQuote(new Set());
  }, []);

  const selectNewQuote = (used) => {
    const available = Array.from({ length: QUOTES.length }, (_, i) => i).filter(
      (i) => !used.has(i)
    );

    if (available.length === 0) {
      // 如果所有语录都用过，重置
      used.clear();
      available.push(...Array.from({ length: QUOTES.length }, (_, i) => i));
    }

    const randomIdx = available[Math.floor(Math.random() * available.length)];
    const newUsed = new Set(used);
    newUsed.add(randomIdx);
    setUsedIndices(newUsed);
    setCurrentQuote(QUOTES[randomIdx]);
  };

  const handleClick = () => {
    selectNewQuote(usedIndices);
  };

  if (!currentQuote) return null;

  return (
    <div
      onClick={handleClick}
      className="flex-1 mx-4 px-4 py-2 text-center cursor-pointer transition-opacity hover:opacity-70"
    >
      <p className="text-sm text-gray-500 font-light leading-relaxed truncate">
        {currentQuote.text}
      </p>
    </div>
  );
}
