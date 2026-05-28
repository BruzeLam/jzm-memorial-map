import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  normalizeMarkerTagName,
  parseMarkerTagInput,
  filterMarkerTagSuggestions,
} from '../utils/markerTags';

export default function MarkerTagInput({
  tags,
  onChange,
  allTags = [],
  placeholder,
  hint,
}) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const draft = parseMarkerTagInput(input);
  const suggestions = useMemo(
    () => filterMarkerTagSuggestions(allTags, draft, tags),
    [allTags, draft, tags]
  );

  useEffect(() => {
    setHighlight(0);
  }, [draft, suggestions.length]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const addTag = (raw) => {
    const name = normalizeMarkerTagName(raw);
    if (!name || tags.includes(name)) {
      setInput('');
      return;
    }
    onChange([...tags, name]);
    setInput('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const removeTag = (name) => {
    onChange(tags.filter((t) => t !== name));
  };

  const commitInput = () => {
    if (suggestions.length > 0 && open && draft) {
      addTag(suggestions[highlight] ?? suggestions[0]);
      return;
    }
    if (draft) addTag(draft);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault();
      setOpen(true);
      setHighlight((i) => (i + 1) % suggestions.length);
      return;
    }
    if (e.key === 'ArrowUp' && suggestions.length > 0) {
      e.preventDefault();
      setOpen(true);
      setHighlight((i) => (i - 1 + suggestions.length) % suggestions.length);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      commitInput();
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const showDropdown = open && suggestions.length > 0 && (draft || input.includes('#'));

  return (
    <div ref={wrapRef} className="relative">
      <div
        className="flex flex-wrap gap-1.5 min-h-[42px] px-2 py-2 border border-gray-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-300"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800"
          >
            #{tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="text-blue-600/70 hover:text-blue-900 leading-none"
              aria-label={`移除 ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={tags.length ? '' : placeholder}
          className="flex-1 min-w-[120px] px-1 py-0.5 text-sm border-0 outline-none bg-transparent"
        />
      </div>

      {showDropdown && (
        <ul className="absolute z-20 left-0 right-0 mt-1 py-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {suggestions.map((tag, idx) => (
            <li key={tag}>
              <button
                type="button"
                className={`w-full text-left px-3 py-2 text-sm ${
                  idx === highlight ? 'bg-blue-50 text-blue-900' : 'text-gray-700 hover:bg-gray-50'
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(tag)}
                onMouseEnter={() => setHighlight(idx)}
              >
                <span className="text-blue-700">#</span>
                {tag}
              </button>
            </li>
          ))}
        </ul>
      )}

      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export function MarkerTagPills({ tags, onTagClick, className = '' }) {
  if (!tags?.length) return null;
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={onTagClick ? () => onTagClick(tag) : undefined}
          className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-800 ${
            onTagClick ? 'hover:bg-blue-100 cursor-pointer' : ''
          }`}
        >
          #{tag}
        </button>
      ))}
    </div>
  );
}
