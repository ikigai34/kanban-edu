'use client';

import React from 'react';
import { ExternalLink, CheckSquare, Square } from 'lucide-react';

interface MarkdownViewerProps {
  content?: string | null;
  onToggleTask?: (taskText: string) => void;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  onToggleTask,
}) => {
  if (!content) {
    return <p className="text-slate-400 italic text-sm">Описание отсутствует</p>;
  }

  // Разбиваем на строки для парсинга
  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeLang = '';

  const parseInline = (text: string): React.ReactNode => {
    // 1. Ссылки [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    // 2. Инлайн код `code`
    // 3. Жирный шрифт **bold**
    // 4. Курсив *italic*

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Регулярка для ссылок, кода и жирного шрифта
    const combinedRegex = /(\[([^\]]+)\]\(([^)]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*)/g;
    let match: RegExpExecArray | null;

    while ((match = combinedRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      if (match[1]) {
        // Ссылка
        const label = match[2];
        const url = match[3];
        parts.push(
          <a
            key={`link-${match.index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-800 underline font-medium"
          >
            {label}
            <ExternalLink className="w-3 h-3 ml-0.5 inline opacity-70" />
          </a>
        );
      } else if (match[4]) {
        // Инлайн код
        const code = match[5];
        parts.push(
          <code
            key={`code-${match.index}`}
            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#252525] text-slate-800 dark:text-neutral-200 font-mono text-xs border border-slate-200 dark:border-[#333333]"
          >
            {code}
          </code>
        );
      } else if (match[6]) {
        // Жирный шрифт
        const bold = match[7];
        parts.push(
          <strong key={`bold-${match.index}`} className="font-semibold text-slate-900 dark:text-neutral-100">
            {bold}
          </strong>
        );
      }

      lastIndex = combinedRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Проверка блока кода ```
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // Закрываем блок
        renderedElements.push(
          <div key={`codeblock-${i}`} className="my-3 rounded-lg bg-slate-900 text-slate-100 p-3.5 text-xs font-mono overflow-x-auto shadow-inner border border-slate-800">
            {codeLang && (
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5 pb-1 border-b border-slate-800">
                {codeLang}
              </div>
            )}
            <pre className="leading-relaxed">
              <code>{codeBlockLines.join('\n')}</code>
            </pre>
          </div>
        );
        inCodeBlock = false;
        codeBlockLines = [];
        codeLang = '';
      } else {
        // Открываем блок
        inCodeBlock = true;
        codeLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Заголовок H1
    if (line.startsWith('# ')) {
      renderedElements.push(
        <h1 key={`h1-${i}`} className="text-lg font-bold text-slate-900 dark:text-neutral-100 mt-4 mb-2 first:mt-0 tracking-tight">
          {parseInline(line.slice(2))}
        </h1>
      );
      continue;
    }

    // Заголовок H2
    if (line.startsWith('## ')) {
      renderedElements.push(
        <h2 key={`h2-${i}`} className="text-base font-bold text-slate-900 dark:text-neutral-100 mt-3.5 mb-2 first:mt-0">
          {parseInline(line.slice(3))}
        </h2>
      );
      continue;
    }

    // Заголовок H3
    if (line.startsWith('### ')) {
      renderedElements.push(
        <h3 key={`h3-${i}`} className="text-sm font-semibold text-slate-900 dark:text-neutral-100 mt-3 mb-1.5 first:mt-0">
          {parseInline(line.slice(4))}
        </h3>
      );
      continue;
    }

    // Цитата / Alert блок (> text)
    if (line.startsWith('> ')) {
      renderedElements.push(
        <blockquote
          key={`quote-${i}`}
          className="my-2.5 pl-3.5 py-1 border-l-3 border-amber-400 dark:border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 text-xs rounded-r-md leading-relaxed"
        >
          {parseInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Чеклист / список задач: - [ ] или - [x]
    const taskMatch = line.match(/^(\s*)-\s*\[([ xX])\]\s*(.*)$/);
    if (taskMatch) {
      const isChecked = taskMatch[2].toLowerCase() === 'x';
      const taskText = taskMatch[3];
      renderedElements.push(
        <div
          key={`task-${i}`}
          onClick={() => onToggleTask && onToggleTask(taskText)}
          className={`flex items-start gap-2.5 my-1.5 py-1 px-2 rounded-md transition-colors ${
            onToggleTask ? 'cursor-pointer hover:bg-slate-100/80 dark:hover:bg-[#2a2a2a]' : ''
          }`}
        >
          {isChecked ? (
            <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          ) : (
            <Square className="w-4 h-4 text-slate-400 dark:text-neutral-500 mt-0.5 shrink-0" />
          )}
          <span
            className={`text-xs leading-relaxed ${
              isChecked ? 'line-through text-slate-400 dark:text-neutral-500' : 'text-slate-700 dark:text-neutral-300'
            }`}
          >
            {parseInline(taskText)}
          </span>
        </div>
      );
      continue;
    }

    // Маркированный список (- text или * text)
    if (line.startsWith('- ') || line.startsWith('* ')) {
      renderedElements.push(
        <li key={`li-${i}`} className="text-xs text-slate-700 dark:text-neutral-300 ml-4 list-disc my-1 leading-relaxed">
          {parseInline(line.slice(2))}
        </li>
      );
      continue;
    }

    // Нумерованный список (1. text)
    const numMatch = line.match(/^(\d+)\.\s*(.*)$/);
    if (numMatch) {
      renderedElements.push(
        <li key={`num-li-${i}`} className="text-xs text-slate-700 dark:text-neutral-300 ml-4 list-decimal my-1 leading-relaxed">
          {parseInline(numMatch[2])}
        </li>
      );
      continue;
    }

    // Пустая строка
    if (line.trim() === '') {
      renderedElements.push(<div key={`blank-${i}`} className="h-2" />);
      continue;
    }

    // Обычный абзац
    renderedElements.push(
      <p key={`p-${i}`} className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed my-1">
        {parseInline(line)}
      </p>
    );
  }

  // Если файл завершился внутри блока кода
  if (inCodeBlock && codeBlockLines.length > 0) {
    renderedElements.push(
      <div key="codeblock-last" className="my-3 rounded-lg bg-slate-900 text-slate-100 p-3.5 text-xs font-mono overflow-x-auto shadow-inner border border-slate-800">
        <pre className="leading-relaxed">
          <code>{codeBlockLines.join('\n')}</code>
        </pre>
      </div>
    );
  }

  return <div className="space-y-1">{renderedElements}</div>;
};
