import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null;

  // Simple, resilient line-by-line markdown parser
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];
  let inBlockquote = false;
  let blockquoteLines: string[] = [];

  const flushList = (key: string) => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={key} className="my-4 space-y-2 list-none pl-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-salon-gold mt-2 flex-shrink-0" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushBlockquote = (key: string) => {
    if (inBlockquote && blockquoteLines.length > 0) {
      elements.push(
        <blockquote
          key={key}
          className="my-5 border-l-2 border-salon-gold pl-4 py-2 bg-salon-charcoal/50 italic text-neutral-300 rounded-r-lg"
        >
          {blockquoteLines.map((line, idx) => (
            <p key={idx}>{renderInline(line)}</p>
          ))}
        </blockquote>
      );
      blockquoteLines = [];
      inBlockquote = false;
    }
  };

  const renderInline = (text: string): React.ReactNode => {
    // Bold: **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-white font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith('### ')) {
      flushList(`list-before-${index}`);
      flushBlockquote(`quote-before-${index}`);
      elements.push(
        <h3 key={index} className="text-xl md:text-2xl font-serif font-bold text-salon-gold-light mt-6 mb-3">
          {renderInline(trimmed.slice(4))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      flushList(`list-before-${index}`);
      flushBlockquote(`quote-before-${index}`);
      elements.push(
        <h2 key={index} className="text-2xl md:text-3xl font-serif font-bold gold-text-gradient mt-8 mb-4">
          {renderInline(trimmed.slice(3))}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith('# ')) {
      flushList(`list-before-${index}`);
      flushBlockquote(`quote-before-${index}`);
      elements.push(
        <h1 key={index} className="text-3xl md:text-4xl font-serif font-bold text-salon-gold-light mt-8 mb-4">
          {renderInline(trimmed.slice(2))}
        </h1>
      );
      return;
    }

    // Blockquote: > line
    if (trimmed.startsWith('> ')) {
      flushList(`list-before-${index}`);
      inBlockquote = true;
      blockquoteLines.push(trimmed.slice(2));
      return;
    }

    // List item: - or *
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushBlockquote(`quote-before-${index}`);
      inList = true;
      listItems.push(trimmed.slice(2));
      return;
    }

    // Empty line
    if (!trimmed) {
      flushList(`list-${index}`);
      flushBlockquote(`quote-${index}`);
      return;
    }

    // Regular paragraph
    flushList(`list-before-${index}`);
    flushBlockquote(`quote-before-${index}`);
    elements.push(
      <p key={index} className="my-3 text-neutral-300 leading-relaxed text-base font-light">
        {renderInline(trimmed)}
      </p>
    );
  });

  flushList('list-end');
  flushBlockquote('quote-end');

  return <div className={`prose-salon ${className}`}>{elements}</div>;
}
