import Link from 'next/link';
import { memo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';

// 统一的样式配置
const STYLES = {
  codeBlock: {
    borderRadius: '0.5rem',
    margin: '1rem 0',
    padding: '1rem',
    fontSize: '0.9rem',
    lineHeight: '1.5',
    backgroundColor: '#292d3e',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    maxWidth: '100%',
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all'
  },
  inlineCode: {
    backgroundColor: '#f8fafc',
    color: '#475569',
    padding: '0.125rem 0.375rem',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
    fontFamily: 'var(--font-mono)',
    border: '1px solid #e2e8f0'
  },
  inlineCodeDark: {
    backgroundColor: '#1e293b',
    color: '#cbd5e1',
    border: '1px solid #334155'
  }
} as const;

const components: Partial<Components> = {
  // 代码块处理
  code: ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');

    if (!inline && match) {
      // 多行代码块
      return (
        <div className="max-w-full overflow-x-auto">
          <SyntaxHighlighter
            style={materialDark}
            language={match[1]}
            PreTag="div"
            customStyle={STYLES.codeBlock}
            wrapLongLines={true}
            codeTagProps={{
              style: {
                fontFamily: 'var(--font-mono)',
                color: '#eeffff',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }
            }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      );
    }

    // 行内代码
    return (
      <code
        className="dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
        style={STYLES.inlineCode}
        {...props}
      >
        {children}
      </code>
    );
  },

  // 预格式化文本
  pre: ({ children }) => <div className="my-5 overflow-auto rounded-md">{children}</div>,

  // 列表
  ol: ({ children, ...props }) => (
    <ol className="my-5 list-decimal space-y-2 pl-8" {...props}>
      {children}
    </ol>
  ),
  ul: ({ children, ...props }) => (
    <ul className="my-5 list-disc space-y-2 pl-8" {...props}>
      {children}
    </ul>
  ),
  li: ({ children, ...props }) => (
    <li className="my-1.5" {...props}>
      {children}
    </li>
  ),

  // 文本样式
  strong: ({ children, ...props }) => (
    <span className="font-bold text-gray-900 dark:text-gray-100" {...props}>
      {children}
    </span>
  ),
  p: ({ children, ...props }) => (
    <p className="my-4 leading-relaxed text-gray-800 dark:text-gray-200" {...props}>
      {children}
    </p>
  ),

  // 链接
  a: ({ children, ...props }) => (
    // @ts-expect-error
    <Link
      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
      target="_blank"
      rel="noreferrer"
      {...props}
    >
      {children}
    </Link>
  ),

  // 标题
  h1: ({ children, ...props }) => (
    <h1
      className="my-6 border-b border-gray-200 pb-1 text-2xl font-bold text-gray-900 dark:border-gray-800 dark:text-gray-100"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      className="my-5 border-b border-gray-200 pb-1 text-xl font-bold text-gray-900 dark:border-gray-800 dark:text-gray-100"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="my-4 text-lg font-bold text-gray-900 dark:text-gray-100" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="my-3 text-base font-bold text-gray-900 dark:text-gray-100" {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5 className="my-2 text-sm font-bold text-gray-900 dark:text-gray-100" {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6 className="my-2 text-xs font-bold text-gray-900 dark:text-gray-100" {...props}>
      {children}
    </h6>
  ),

  // 引用块
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="my-5 rounded-r-md border-l-4 border-gray-300 bg-gray-50 px-2 py-2 pl-4 italic text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // 表格
  table: ({ children, ...props }) => (
    <div className="my-5 overflow-x-auto rounded-md border border-gray-200 dark:border-gray-800">
      <table className="w-full border-collapse" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-gray-100 dark:bg-gray-800" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
  tr: ({ children, ...props }) => (
    <tr className="border-b border-gray-200 dark:border-gray-800" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th className="p-3 text-left font-bold text-gray-900 dark:text-gray-100" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="p-3 text-gray-800 dark:text-gray-200" {...props}>
      {children}
    </td>
  ),

  // 其他元素
  hr: ({ ...props }) => <hr className="my-6 border-gray-300 dark:border-gray-700" {...props} />,
  img: ({ ...props }) => <img className="my-5 h-auto max-w-full rounded-md shadow-md" {...props} />
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
