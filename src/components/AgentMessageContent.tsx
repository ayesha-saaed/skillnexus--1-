import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface AgentMessageContentProps {
  content: string;
  variant?: 'user' | 'assistant';
}

/** Strip leftover markdown when the model ignores plain-text instructions. */
function normalizeAgentText(content: string): string {
  return content
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .trim();
}

function StructuredPlainText({ content }: { content: string }) {
  const text = normalizeAgentText(content);
  const blocks = text.split(/\n\n+/);

  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        const heading = lines[0]?.trim();
        const isSection =
          heading &&
          lines.length > 1 &&
          /^(summary|timeline|key steps|next action|recommendation|overview)/i.test(heading);

        if (isSection) {
          return (
            <div key={i} className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300/90">
                {heading}
              </p>
              {lines.slice(1).map((line, j) => {
                const trimmed = line.trim();
                if (!trimmed) return null;
                const isBullet = /^[•\-*]\s/.test(trimmed);
                return (
                  <p
                    key={j}
                    className={cn(
                      'text-zinc-300',
                      isBullet && 'pl-3 border-l-2 border-indigo-500/30 text-zinc-400'
                    )}
                  >
                    {isBullet ? trimmed.replace(/^[•\-*]\s*/, '') : trimmed}
                  </p>
                );
              })}
            </div>
          );
        }

        const isBulletBlock = lines.every((l) => !l.trim() || /^[•\-*]\s/.test(l.trim()));
        if (isBulletBlock) {
          return (
            <ul key={i} className="space-y-1.5 pl-1">
              {lines
                .filter((l) => l.trim())
                .map((line, j) => (
                  <li
                    key={j}
                    className="flex gap-2 text-zinc-400 before:content-['•'] before:text-indigo-400 before:shrink-0"
                  >
                    <span>{line.trim().replace(/^[•\-*]\s*/, '')}</span>
                  </li>
                ))}
            </ul>
          );
        }

        return (
          <p key={i} className="text-zinc-300 whitespace-pre-wrap break-words">
            {block}
          </p>
        );
      })}
    </div>
  );
}

export function AgentMessageContent({ content, variant = 'assistant' }: AgentMessageContentProps) {
  if (variant === 'user') {
    return <p className="whitespace-pre-wrap break-words">{content}</p>;
  }

  const hasMarkdown = /(\*\*|^#{1,3}\s|^[-*]\s)/m.test(content);
  if (hasMarkdown) {
    return (
      <div className="break-words">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="text-zinc-300 leading-relaxed my-2">{children}</p>,
            strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
            ul: ({ children }) => <ul className="space-y-1.5 my-2 pl-1">{children}</ul>,
            li: ({ children }) => (
              <li className="flex gap-2 text-zinc-400 before:content-['•'] before:text-indigo-400 before:shrink-0">
                <span>{children}</span>
              </li>
            )
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  return <StructuredPlainText content={content} />;
}
