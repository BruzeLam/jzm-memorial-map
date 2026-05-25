import React, { useState, useEffect } from 'react';
import { QUOTES } from '../data/quotes';

const STORAGE_KEY = 'jzm_user_quotes';

function loadAllQuotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return QUOTES;

    let userQuotes = JSON.parse(raw);

    // 数据迁移和修复：确保所有语录都有正确的格式
    userQuotes = userQuotes.map((q, index) => ({
      id: q.id || `user_${q.text?.substring(0, 10) || index}_${Date.now() + index}`,
      text: q.text || '',
      source: q.source || null,
      context: q.context || null,
      isUserAdded: true,
    })).filter(q => q.text.trim());

    // 如果数据被修改了（迁移），保存回去
    if (JSON.stringify(userQuotes) !== raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userQuotes));
    }

    // 合并内置语录和用户语录
    return [...QUOTES, ...userQuotes];
  } catch (e) {
    return QUOTES;
  }
}

export default function RandomQuoteDisplay() {
  const [currentQuote, setCurrentQuote] = useState(null);
  const [usedIndices, setUsedIndices] = useState(new Set());
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 初始化：加载第一条随机语录
  useEffect(() => {
    selectNewQuote(new Set());
  }, []);

  const selectNewQuote = (used) => {
    setIsTransitioning(true);

    setTimeout(() => {
      // 加载所有语录（内置 + 用户添加）
      const allQuotes = loadAllQuotes();
      // 过滤：只显示文本长度 < 50 的语录
      const filtered = allQuotes.filter((q) => q.text.length < 50);
      const available = Array.from({ length: filtered.length }, (_, i) => i).filter(
        (i) => !used.has(i)
      );

      if (available.length === 0) {
        // 如果所有语录都用过，重置
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

  const handleClick = () => {
    if (!isTransitioning) {
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
