'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { StudentTask, ColumnDefinition, CourseColumn, User } from '@/types';
import { KanbanCard } from './KanbanCard';
import { Plus, Inbox, CheckCircle2, Pencil, Trash2 } from 'lucide-react';

interface KanbanColumnProps {
  column: ColumnDefinition;
  tasks: StudentTask[];
  onCardClick: (task: StudentTask) => void;
  onTagClick?: (tag: string) => void;
  onToggleBookmark?: (task: StudentTask) => void;
  currentUser: User | null;
  onAddAssignment?: () => void;
  onEditColumn?: (column: CourseColumn) => void;
  onDeleteColumn?: (column: CourseColumn, taskCount: number) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  onCardClick,
  onTagClick,
  onToggleBookmark,
  currentUser,
  onAddAssignment,
  onEditColumn,
  onDeleteColumn,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  const isTeacher = currentUser?.role === 'teacher' || currentUser?.role === 'admin';

  return (
    <div
      ref={setNodeRef}
      className={`w-[316px] shrink-0 flex flex-col bg-slate-100/80 dark:bg-[#161616] rounded-2xl border transition-colors duration-150 shadow-xs dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] max-h-full overflow-hidden ${
        isOver ? 'border-blue-400 dark:border-[#444444] bg-blue-50/20 dark:bg-[#1c1c1c]' : 'border-slate-200/90 dark:border-[#242424]'
      }`}
    >
      {/* Шапка колонки */}
      <div
        className={`px-4 py-3.5 border-b border-slate-200/80 dark:border-[#222222] flex items-center justify-between select-none ${column.headerBg}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full ${column.dotColor} shrink-0`} />
          <h3 className={`font-bold text-base tracking-tight truncate ${column.headerText}`}>
            {column.title}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs ${column.badgeBg}`}
          >
            {tasks.length}
          </span>

          {isTeacher && column.isCustom && column.courseColumn && (
            <>
              {onEditColumn && (
                <button
                  type="button"
                  onClick={() => onEditColumn(column.courseColumn!)}
                  title="Редактировать столбец"
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {onDeleteColumn && (
                <button
                  type="button"
                  onClick={() => onDeleteColumn(column.courseColumn!, tasks.length)}
                  title="Удалить столбец"
                  className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded-md transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}

          {isTeacher && onAddAssignment && (
            <button
              onClick={onAddAssignment}
              title="Добавить задание"
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Список карточек со скроллом */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[160px] custom-scrollbar">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onClick={onCardClick}
              onTagClick={onTagClick}
              onToggleBookmark={onToggleBookmark}
              isTeacher={isTeacher}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="h-40 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-200/80 dark:border-[#262626] bg-slate-50/50 dark:bg-[#181818]/40 rounded-xl text-slate-400 dark:text-neutral-500">
            {column.id === 'done' ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400/80 dark:text-emerald-500/60 mb-2 stroke-1" />
            ) : (
              <Inbox className="w-8 h-8 text-slate-300 dark:text-neutral-600 mb-2 stroke-1" />
            )}
            <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400">Нет заданий</p>
            <p className="text-[11px] text-slate-400 dark:text-neutral-600 mt-0.5">
              {column.id === 'done'
                ? 'Зачтенные задания появятся здесь'
                : 'Перетащите карточку сюда'}
            </p>
          </div>
        )}
      </div>

      {/* Нижняя кнопка для преподавателя */}
      {isTeacher && onAddAssignment && (
        <div className="p-3 pt-0">
          <button
            onClick={onAddAssignment}
            className="w-full py-2 px-3 border border-dashed border-slate-300 dark:border-[#333333] hover:border-slate-400 dark:hover:border-[#444444] bg-white/60 dark:bg-[#1c1c1c] hover:bg-white dark:hover:bg-[#222222] rounded-xl text-xs font-semibold text-slate-700 dark:text-neutral-200 hover:text-slate-950 dark:hover:text-white transition-all flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить задание</span>
          </button>
        </div>
      )}
    </div>
  );
};
