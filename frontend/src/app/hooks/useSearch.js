import { useState, useEffect, useRef } from "react";

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      queueMicrotask(() => setSuggestions([]));
      return;
    }

    const abortController = new AbortController();

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stock/search?query=${encodeURIComponent(searchQuery)}`, { signal: abortController.signal });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Arama önerileri yüklenemedi:", err);
      }
    }, 250);

    return () => {
      clearTimeout(delayDebounceFn);
      abortController.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    suggestions,
    setSuggestions,
    searchContainerRef
  };
}
