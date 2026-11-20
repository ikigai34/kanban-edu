'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StudentTask, AttachmentFile } from '@/types';
import {
  Paperclip,
  Info,
  Clock,
  Download,
  FileText,
  FileArchive,
  FileCode,
  CheckCircle2,
  Calendar,
  MessageSquare,
  GitBranch,
  AlertCircle,
  Bookmark,
} from 'lucide-react';
import { extractHashtags, getTagStyle } from '@/lib/tagUtils';

interface KanbanCardProps {
  task: StudentTask;
  onClick: (task: StudentTask) => void;
  onTagClick?: (tag: string) => void;
  onToggleBookmark?: (task: StudentTask) => void;
  isDraggingOverlay?: boolean;
  isTeacher?: boolean;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  task,
  onClick,
  onTagClick,
  onToggleBookmark,
  isDraggingOverlay = false,
  isTeacher = false,
}) => {
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const fileMenuRef = useRef<HTMLDivElement>(null);

  const assignment = task.assignment;
  const priority = task.priority || assignment?.priority || 'normal';
  const isInfo =
    priority === 'info' ||
    task.status === 'info' ||
    assignment?.tags?.some((t) =>
      ['#инфо', '#лекция', '#объявление', '#информация'].includes(t.toLowerCase())
    ) ||
    Boolean(
      ['#инфо', '#лекция', '#объявление', '#информация'].some((t) =>
        assignment?.title?.toLowerCase().includes(t)
      )
    );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: false,
    data: {
      type: 'Task',
      task,
    },
    animateLayoutChanges: () => true,
  });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
      : undefined,
    transition: 'transform 250ms cubic-bezier(0.2, 0, 0, 1), opacity 200ms ease, background-color 300ms ease, border-color 150ms ease, box-shadow 150ms ease',
  };

  useEffect(() => {
    if (!isFileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
        setIsFileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFileMenuOpen]);

  const files: AttachmentFile[] = assignment?.files || [];
  if (assignment?.file_url && files.length === 0) {
    files.push({
      id: 'default-file',
      name: assignment.file_url.split('/').pop() || 'Задание.pdf',
      size: '1.2 МБ',
      url: assignment.file_url,
      type: 'pdf',
    });
  }

  // Ограничиваем количество тегов на карточке до 2 штук (все в нижнем регистре)
  const allParsedTags = Array.from(
    new Set([
      ...(assignment?.tags || []).map((t) => t.toLowerCase()),
      ...extractHashtags(assignment?.title),
    ])
  );
  const visibleTags = allParsedTags.slice(0, 2);
  const hiddenTagsCount = allParsedTags.length - visibleTags.length;
  const isBookmarked = allParsedTags.includes('#закладки');

  const handleDownloadFile = (e: React.MouseEvent, file: AttachmentFile) => {
    e.stopPropagation();
    setIsFileMenuOpen(false);
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deadline = isInfo ? null : (task.deadline || assignment?.deadline);
  const getDeadlineInfo = () => {
    if (!deadline) return null;
    const dDate = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil((dDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const formattedDate = dDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });

    if (diffDays < 0) {
      return {
        label: `Просрочено: ${formattedDate}`,
        color: 'text-rose-700 bg-rose-50/80 dark:bg-rose-500/15 dark:text-rose-300/85',
        icon: AlertCircle,
      };
    } else if (diffDays <= 3) {
      return {
        label: diffDays === 0 ? 'Сегодня' : `До ${formattedDate} (${diffDays} дн.)`,
        color: 'text-amber-800 bg-amber-50/80 dark:bg-amber-500/15 dark:text-amber-300/85',
        icon: Clock,
      };
    } else {
      return {
        label: `До ${formattedDate}`,
        color: 'text-emerald-700 bg-emerald-50/80 dark:bg-emerald-500/15 dark:text-emerald-300/85',
        icon: Calendar,
      };
    }
  };

  const deadlineInfo = getDeadlineInfo();

  const getFileIcon = (file: AttachmentFile) => {
    if (file.name.endsWith('.zip') || file.name.endsWith('.tar.gz')) {
      return <FileArchive className="w-4 h-4 text-amber-600 shrink-0" />;
    }
    if (file.name.endsWith('.sh') || file.name.endsWith('.cpp') || file.name.endsWith('.ts')) {
      return <FileCode className="w-4 h-4 text-indigo-600 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-blue-600 shrink-0" />;
  };

  // Плавный призрак (ghost placeholder) при перетаскивании карточки
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-xl border-2 border-dashed border-blue-400/70 dark:border-blue-500/50 bg-blue-50/40 dark:bg-blue-950/30 p-4 min-h-[92px] flex items-center justify-center transition-all duration-200 animate-in fade-in zoom-in-95 pointer-events-none select-none shadow-2xs"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600/80 dark:text-blue-400/80">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>Поместить сюда</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className={`group relative bg-white dark:bg-[#252525] rounded-xl border border-slate-200/80 dark:border-[#333333] hover:border-slate-300 dark:hover:border-[#444444] shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-[border-color,box-shadow] duration-150 cursor-pointer select-none overflow-visible p-3.5 flex flex-col gap-2.5 ${
        isDraggingOverlay ? 'shadow-2xl ring-2 ring-blue-500/60 scale-102 rotate-1 cursor-grabbing' : ''
      }`}
    >
      {/* 0. Плашка автора сдачи (видна преподавателю) */}
      {isTeacher && task.student && task.status !== 'todo' && !isInfo && (
        <div className="flex items-center justify-between gap-1.5 px-2.5 py-1 bg-slate-100/80 dark:bg-white/5 rounded-lg text-[11px] font-medium text-slate-700 dark:text-neutral-300">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
              {task.student.full_name[0]}
            </span>
            <span className="truncate font-semibold text-slate-800 dark:text-neutral-100">{task.student.full_name}</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 bg-white dark:bg-[#202020] px-1.5 py-0.5 rounded shrink-0 font-mono">
            {task.student.group}
          </span>
        </div>
      )}

      {/* 1. Шапка карточки */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {priority === 'urgent' && (
            <span
              title="Срочный приоритет"
              className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 mt-1"
            />
          )}

          {isInfo && (
            <span title="Информационный материал" className="mt-0.5 shrink-0 text-blue-500">
              <Info className="w-4 h-4" />
            </span>
          )}

          <h4 className="text-sm font-semibold text-slate-800 dark:text-neutral-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors break-words">
            {assignment?.title.replace(/#[a-zA-Zа-яА-ЯёЁ0-9_-]+/g, '').trim() || 'Без названия'}
          </h4>
        </div>

        {/* Правая часть шапки: Флажок-закладка + Скрепка с меню */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Флажок закладки (добавляет/удаляет #закладки, подсвечивается оранжевым) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleBookmark) {
                onToggleBookmark(task);
              }
            }}
            title={isBookmarked ? 'Удалить из закладок (#закладки)' : 'Добавить в закладки (#закладки)'}
            className={`p-1 rounded-lg transition-all ${
              isBookmarked
                ? 'text-orange-500 bg-orange-50/80 dark:bg-orange-500/15 hover:bg-orange-100/70 dark:hover:bg-orange-500/25'
                : 'text-slate-300 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300 hover:bg-slate-100/70 dark:hover:bg-white/5'
            }`}
          >
            <Bookmark
              className={`w-3.5 h-3.5 transition-transform active:scale-90 ${
                isBookmarked ? 'fill-orange-500 text-orange-500' : ''
              }`}
            />
          </button>

          {/* Скрепка с меню прикрепленных файлов */}
          {files.length > 0 && (
            <div className="relative shrink-0" ref={fileMenuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFileMenuOpen(!isFileMenuOpen);
                }}
                title={
                  files.length === 1
                    ? `Прикреплен файл: ${files[0].name}`
                    : `Прикреплено файлов: ${files.length}`
                }
                className={`inline-flex items-center gap-1 px-1.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  isFileMenuOpen
                    ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 bg-slate-100/70 dark:bg-white/5 hover:bg-slate-200/70 dark:hover:bg-white/10'
                }`}
              >
                <Paperclip className="w-3.5 h-3.5" />
                {files.length > 1 && <span>{files.length}</span>}
              </button>

              {isFileMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1.5 z-50 w-64 bg-white dark:bg-[#202020] rounded-xl shadow-xl border border-slate-200/90 dark:border-[#333333] py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-neutral-400 uppercase tracking-wider border-b border-slate-100 dark:border-[#2a2a2a] mb-1">
                    Материалы к заданию ({files.length})
                  </div>
                  {files.map((file) => (
                    <button
                      key={file.id}
                      type="button"
                      onClick={(e) => handleDownloadFile(e, file)}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-[#282828] text-slate-700 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group/item"
                    >
                      <div className="flex items-center gap-2 min-w-0 mr-2">
                        {getFileIcon(file)}
                        <span className="truncate font-medium text-xs">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400">
                        <span className="text-[11px]">{file.size}</span>
                        <Download className="w-3.5 h-3.5 ml-0.5" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Текст описания */}
      {assignment?.description && (
        <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed line-clamp-2">
          {assignment.description
            .replace(/[#*`>]/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .trim()}
        </p>
      )}

      {/* 3. Индикаторы решений / оценок */}
      {(task.score !== null && task.score !== undefined || task.repo_url || (task.submission_files && task.submission_files.length > 0)) && (
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-[#2a2a2a] text-xs text-slate-500">
          {task.score !== null && task.score !== undefined && (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300/85 bg-emerald-50/80 dark:bg-emerald-500/15 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400/80" />
              {task.score} б.
            </span>
          )}

          {task.repo_url && (
            <span
              title={`Репозиторий: ${task.repo_url}`}
              className="inline-flex items-center gap-1 text-slate-600 dark:text-neutral-300 bg-slate-100/80 dark:bg-white/5 px-2 py-0.5 rounded-md"
            >
              <GitBranch className="w-3 h-3 text-slate-500 dark:text-neutral-400" />
              <span>Git</span>
            </span>
          )}

          {task.teacher_comment && (
            <span
              title="Есть рецензия преподавателя"
              className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-300/85 bg-amber-50/80 dark:bg-amber-500/15 px-2 py-0.5 rounded-md"
            >
              <MessageSquare className="w-3 h-3 text-amber-600 dark:text-amber-400/80" />
              <span>Рецензия</span>
            </span>
          )}
        </div>
      )}

      {/* 4. Дедлайн */}
      {deadlineInfo && (
        <div className="flex items-center">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${deadlineInfo.color}`}
          >
            <deadlineInfo.icon className="w-3.5 h-3.5" />
            <span>{deadlineInfo.label}</span>
          </span>
        </div>
      )}

      {/* 5. Теги */}
      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5 mt-auto items-center">
          {visibleTags.map((tag) => {
            const tagStyle = getTagStyle(tag);
            return (
              <span
                key={tag}
                onClick={(e) => {
                  if (onTagClick) {
                    e.stopPropagation();
                    onTagClick(tag);
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${tagStyle.bg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${tagStyle.dot}`} />
                <span>{tag}</span>
              </span>
            );
          })}

          {hiddenTagsCount > 0 && (
            <span
              title="Дополнительные теги"
              className="text-xs text-slate-500 dark:text-neutral-400 font-medium px-1.5 py-0.5 bg-slate-100/80 dark:bg-white/5 rounded-md"
            >
              +{hiddenTagsCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
