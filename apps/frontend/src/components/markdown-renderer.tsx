'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        'prose prose-sm prose-invert max-w-none',
        // Override prose defaults for dark mode
        'prose-headings:text-foreground prose-headings:font-semibold',
        'prose-p:text-muted-foreground prose-p:leading-relaxed',
        'prose-strong:text-foreground prose-strong:font-semibold',
        'prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none',
        'prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border prose-pre:rounded-lg',
        'prose-ul:text-muted-foreground prose-ol:text-muted-foreground',
        'prose-li:marker:text-muted-foreground',
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        // Custom code block styling
        code: ({ className, children, ...props }) => {
          const isInline = !className?.includes('language-');

          if (isInline) {
            return (
              <code
                className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary"
                {...props}
              >
                {children}
              </code>
            );
          }

          return (
            <code className={cn('block text-xs font-mono', className)} {...props}>
              {children}
            </code>
          );
        },
        // Custom pre block with better styling
        pre: ({ children, ...props }) => (
          <pre
            className="bg-muted/50 border border-border p-4 rounded-lg overflow-x-auto text-sm"
            {...props}
          >
            {children}
          </pre>
        ),
        // Custom list styling
        ul: ({ children, ...props }) => (
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground" {...props}>
            {children}
          </ul>
        ),
        ol: ({ children, ...props }) => (
          <ol className="list-decimal pl-4 space-y-1 text-muted-foreground" {...props}>
            {children}
          </ol>
        ),
        // Custom link styling
        a: ({ href, children, ...props }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
            {...props}
          >
            {children}
          </a>
        ),
        // Custom heading styling
        h1: ({ children, ...props }) => (
          <h1 className="text-xl font-semibold text-foreground mt-6 mb-3" {...props}>
            {children}
          </h1>
        ),
        h2: ({ children, ...props }) => (
          <h2 className="text-lg font-semibold text-foreground mt-5 mb-2" {...props}>
            {children}
          </h2>
        ),
        h3: ({ children, ...props }) => (
          <h3 className="text-base font-semibold text-foreground mt-4 mb-2" {...props}>
            {children}
          </h3>
        ),
        h4: ({ children, ...props }) => (
          <h4 className="text-sm font-semibold text-foreground mt-3 mb-1" {...props}>
            {children}
          </h4>
        ),
        // Custom paragraph styling
        p: ({ children, ...props }) => (
          <p className="text-sm text-muted-foreground leading-relaxed mb-3" {...props}>
            {children}
          </p>
        ),
        // Custom blockquote styling
        blockquote: ({ children, ...props }) => (
          <blockquote
            className="border-l-2 border-primary/50 pl-4 italic text-muted-foreground"
            {...props}
          >
            {children}
          </blockquote>
        ),
        // Custom table styling for GFM tables
        table: ({ children, ...props }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full text-sm border border-border rounded-lg" {...props}>
              {children}
            </table>
          </div>
        ),
        thead: ({ children, ...props }) => (
          <thead className="bg-muted/50" {...props}>
            {children}
          </thead>
        ),
        th: ({ children, ...props }) => (
          <th className="px-3 py-2 text-left font-semibold text-foreground border-b border-border" {...props}>
            {children}
          </th>
        ),
        td: ({ children, ...props }) => (
          <td className="px-3 py-2 text-muted-foreground border-b border-border" {...props}>
            {children}
          </td>
        ),
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
