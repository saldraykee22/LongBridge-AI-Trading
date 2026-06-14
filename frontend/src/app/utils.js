export const formatVal = (val, type, currency = "TRY") => {
  if (val === null || val === undefined || val === "Bilinmiyor") return "-";
  if (typeof val !== 'number') return String(val);
  if (type === "percent") {
    const pct = (val * 100).toFixed(2);
    return `${pct}%`;
  }

  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "TL";
  const isPrefix = symbol === "$" || symbol === "€";

  if (type === "currency") {
    const formattedNum = val.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return isPrefix ? `${symbol}${formattedNum}` : `${formattedNum} ${symbol}`;
  }
  if (type === "cap") {
    if (currency === "USD") {
      if (val >= 1e12) return `$${(val / 1e12).toFixed(2)} Trilyon`;
      if (val >= 1e9) return `$${(val / 1e9).toFixed(2)} Milyar`;
      return `$${val.toLocaleString("tr-TR")}`;
    } else if (currency === "EUR") {
      if (val >= 1e12) return `€${(val / 1e12).toFixed(2)} Trilyon`;
      if (val >= 1e9) return `€${(val / 1e9).toFixed(2)} Milyar`;
      return `€${val.toLocaleString("tr-TR")}`;
    } else {
      if (val >= 1e12) return `${(val / 1e12).toFixed(2)} Trilyon TL`;
      if (val >= 1e9) return `${(val / 1e9).toFixed(2)} Milyar TL`;
      return `${val.toLocaleString("tr-TR")} TL`;
    }
  }
  return val;
};

export const getBadgeClass = (signal) => {
  if (!signal) return "badge-neutral";
  const sig = signal.toUpperCase();
  if (sig.includes("GÜÇLÜ AL")) return "badge-strong-buy";
  if (sig.includes("AL")) return "badge-buy";
  if (sig.includes("GÜÇLÜ SAT")) return "badge-strong-sell";
  if (sig.includes("SAT")) return "badge-sell";
  if (sig.includes("TUT") || sig.includes("NÖTR")) return "badge-hold";
  return "badge-neutral";
};
