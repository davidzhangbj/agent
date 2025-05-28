import { Code } from '@internal/components';
import Link from 'next/link';
import { memo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';

const components: Partial<Components> = {
  code: ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <SyntaxHighlighter
        style={materialDark}
        language={match[1]}
        PreTag="div"
        customStyle={{
          borderRadius: '0.5rem',
          margin: '1rem 0',
          padding: '1rem',
          fontSize: '0.9rem',
          lineHeight: '1.5',
          backgroundColor: '#292d3e',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
        codeTagProps={{
          style: {
            fontFamily: 'var(--font-mono)',
            color: '#eeffff'
          }
        }}
        {...props}
      >
        {String(children).replace(/\n$/, '').replace(/^`|`$/g, '')}
      </SyntaxHighlighter>
    ) : (
      <Code variant="primary" className="mx-0.5 rounded px-1.5 py-0.5 text-sm">
        {String(children).replace(/^`|`$/g, '')}
      </Code>
    );
  },
  pre: ({ children }) => <div className="my-5 overflow-auto rounded-md">{children}</div>,
  ol: ({ node, children, ...props }) => {
    return (
      <ol className="my-5 list-decimal space-y-2 pl-8" {...props}>
        {children}
      </ol>
    );
  },
  li: ({ node, children, ...props }) => {
    return (
      <li className="my-1.5" {...props}>
        {children}
      </li>
    );
  },
  ul: ({ node, children, ...props }) => {
    return (
      <ul className="my-5 list-disc space-y-2 pl-8" {...props}>
        {children}
      </ul>
    );
  },
  strong: ({ node, children, ...props }) => {
    return (
      <span className="font-bold text-gray-900 dark:text-gray-100" {...props}>
        {children}
      </span>
    );
  },
  a: ({ node, children, ...props }) => {
    return (
      // @ts-expect-error
      <Link
        className="font-medium text-blue-600 hover:underline dark:text-blue-400"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </Link>
    );
  },
  h1: ({ node, children, ...props }) => {
    return (
      <h1 className="my-6 border-b border-gray-200 pb-1 text-2xl font-bold dark:border-gray-800" {...props}>
        {children}
      </h1>
    );
  },
  h2: ({ node, children, ...props }) => {
    return (
      <h2 className="my-5 border-b border-gray-200 pb-1 text-xl font-bold dark:border-gray-800" {...props}>
        {children}
      </h2>
    );
  },
  h3: ({ node, children, ...props }) => {
    return (
      <h3 className="my-4 text-lg font-bold" {...props}>
        {children}
      </h3>
    );
  },
  h4: ({ node, children, ...props }) => {
    return (
      <h4 className="my-3 text-base font-bold" {...props}>
        {children}
      </h4>
    );
  },
  h5: ({ node, children, ...props }) => {
    return (
      <h5 className="my-2 text-sm font-bold" {...props}>
        {children}
      </h5>
    );
  },
  h6: ({ node, children, ...props }) => {
    return (
      <h6 className="my-2 text-xs font-bold" {...props}>
        {children}
      </h6>
    );
  },
  p: ({ node, children, ...props }) => {
    return (
      <p className="my-4 leading-relaxed" {...props}>
        {children}
      </p>
    );
  },
  blockquote: ({ node, children, ...props }) => {
    return (
      <blockquote
        className="my-5 rounded-r-md border-l-4 border-gray-300 bg-gray-50 px-2 py-2 pl-4 italic dark:border-gray-700 dark:bg-gray-900"
        {...props}
      >
        {children}
      </blockquote>
    );
  },
  table: ({ node, children, ...props }) => {
    return (
      <div className="my-5 overflow-x-auto rounded-md border border-gray-200 dark:border-gray-800">
        <table className="w-full border-collapse" {...props}>
          {children}
        </table>
      </div>
    );
  },
  thead: ({ node, children, ...props }) => {
    return (
      <thead className="bg-gray-100 dark:bg-gray-800" {...props}>
        {children}
      </thead>
    );
  },
  tbody: ({ node, children, ...props }) => {
    return <tbody {...props}>{children}</tbody>;
  },
  tr: ({ node, children, ...props }) => {
    return (
      <tr className="border-b border-gray-200 dark:border-gray-800" {...props}>
        {children}
      </tr>
    );
  },
  th: ({ node, children, ...props }) => {
    return (
      <th className="p-3 text-left font-bold" {...props}>
        {children}
      </th>
    );
  },
  td: ({ node, children, ...props }) => {
    return (
      <td className="p-3" {...props}>
        {children}
      </td>
    );
  },
  hr: ({ node, ...props }) => {
    return <hr className="my-6 border-gray-300 dark:border-gray-700" {...props} />;
  },
  img: ({ node, ...props }) => {
    return <img className="my-5 h-auto max-w-full rounded-md shadow-md" {...props} />;
  }
};

const remarkPlugins = [remarkGfm];

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = memo(NonMemoizedMarkdown, (prevProps, nextProps) => prevProps.children === nextProps.children);
