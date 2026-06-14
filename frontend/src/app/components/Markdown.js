"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

const ALLOWED_LANGS = ["tr", "en", "json", "bash", "python", "javascript", "typescript", "tsx", "jsx", "yaml"];

const SAFE_SCHEMA = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), ["className"]],
    a: [
      ["href"],
      ["title"],
      ["target"],
      ["rel"],
    ],
    "*": [
      ...(defaultSchema.attributes?.["*"] || []),
    ],
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
  ],
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https", "mailto"],
  },
};

const LinkRenderer = ({ href, children, ...props }) => {
  const isExternal = href && /^https?:\/\//i.test(href);
  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "var(--primary)", textDecoration: "underline" }}
        {...props}
      >
        {children}
      </a>
    );
  }
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
};

const CodeRenderer = ({ inline, className, children, ...props }) => {
  if (inline) {
    return (
      <code
        style={{
          background: "rgba(255,255,255,0.08)",
          padding: "0.1rem 0.35rem",
          borderRadius: "4px",
          fontSize: "0.88em",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
        {...props}
      >
        {children}
      </code>
    );
  }
  return (
    <pre
      style={{
        background: "rgba(0,0,0,0.4)",
        padding: "0.75rem 1rem",
        borderRadius: "8px",
        overflowX: "auto",
        fontSize: "0.85rem",
        border: "1px solid var(--border)",
      }}
    >
      <code className={className} {...props}>
        {children}
      </code>
    </pre>
  );
};

export default function Markdown({ content, className = "" }) {
  if (!content) return null;
  return (
    <div
      className={`markdown-content ${className}`}
      style={{
        lineHeight: 1.6,
        wordBreak: "break-word",
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, SAFE_SCHEMA]]}
        components={{
          a: LinkRenderer,
          code: CodeRenderer,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
