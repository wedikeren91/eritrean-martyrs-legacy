import { useState } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar = ({ value, onChange, placeholder = "Search by name or hometown…" }: SearchBarProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className={`relative border-b-2 transition-colors duration-300 ${
        focused ? "border-foreground" : "border-border"
      }`}
      style={{ borderBottomColor: focused ? "hsl(0 0% 10%)" : "hsla(0, 0%, 0%, 0.12)" }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="w-full bg-transparent py-4 text-lg font-sans text-foreground placeholder:text-muted-foreground/50 outline-none border-none"
        style={{ fontFamily: "'Instrument Sans', sans-serif" }}
        spellCheck={false}
        autoComplete="off"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
