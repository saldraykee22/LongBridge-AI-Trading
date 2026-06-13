"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Cpu, Check } from "lucide-react";

const AVAILABLE_MODELS = [
  { id: "deepseek/deepseek-v4-flash", name: "DeepSeek V4 Flash (API)" },
  { id: "deepseek/deepseek-v4-pro", name: "DeepSeek V4 Pro (API)" },
  { id: "opencode/deepseek-v4-flash-free", name: "DS V4 Flash Free (OpenCode Zen)" },
  { id: "opencode/mimo-v2.5-free", name: "Mimo V2.5 Free (OpenCode Zen)" },
  { id: "opencode/nemotron-3-ultra-free", name: "Nemotron 3 Ultra Free (OpenCode Zen)" },
  { id: "opencode/big-pickle", name: "Big Pickle (OpenCode Zen)" },
  { id: "opencode-go/deepseek-v4-flash", name: "DeepSeek V4 Flash (Go)" },
  { id: "opencode-go/deepseek-v4-pro", name: "DeepSeek V4 Pro (Go)" },
  { id: "opencode-go/kimi-k2.5", name: "Kimi K2.5 (Go)" },
  { id: "opencode-go/qwen3.7-plus", name: "Qwen 3.7 Plus (Go)" },
];

export default function Navbar() {
  const [activeModel, setActiveModel] = useState("opencode-go/deepseek-v4-flash");
  const [showToast, setShowToast] = useState(false);
  const abortControllerRef = useRef(null);
  const previousModelRef = useRef("opencode-go/deepseek-v4-flash");

  useEffect(() => {
    // Get current config from backend
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.active_model) {
          setActiveModel(data.active_model);
        }
      })
      .catch((err) => console.error("Model yapılandırması yüklenemedi:", err));
  }, []);

  const handleModelChange = useCallback(async (e) => {
    previousModelRef.current = activeModel;
    const selected = e.target.value;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: selected }),
        signal: controller.signal,
      });
      if (res.ok) {
        setActiveModel(selected);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Model güncellenemedi:", err);
        setActiveModel(previousModelRef.current);
      }
    }
  }, [activeModel]);

  return (
    <nav className="navbar glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>🌉 LongBridge AI</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div className="model-selector">
          <Cpu size={16} className="text-primary" style={{ opacity: 0.8 }} />
          <select 
            className="model-select" 
            value={activeModel} 
            onChange={handleModelChange}
          >
            {AVAILABLE_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showToast && (
        <div className="animate-fade-in" style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--success)',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius)',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--foreground)',
          zIndex: 100
        }}>
          <Check size={18} style={{ color: 'var(--success)' }} />
          <span>Model başarıyla değiştirildi!</span>
        </div>
      )}
    </nav>
  );
}
