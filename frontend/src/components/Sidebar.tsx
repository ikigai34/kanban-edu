'use client';

import React from 'react';
import { Course, User } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  BookOpen,
  MoreVertical,
} from 'lucide-react';

interface SidebarProps {
  courses: Course[];
  selectedCourseId: string | null;
  onSelectCourse: (courseId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  user: User | null;
  onOpenCreateCourse: () => void;
  onOpenCourseSettings?: (course: Course) => void;
}

const COURSE_COLOR_MAP: Record<
  string,
  { bg: string; text: string; badge: string; border: string }
> = {
  indigo: {
    bg: 'bg-indigo-600',
    text: 'text-indigo-600',
    badge: 'bg-indigo-50 text-indigo-700',
    border: 'border-indigo-500',
  },
  emerald: {
    bg: 'bg-emerald-600',
    text: 'text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700',
    border: 'border-emerald-500',
  },
  blue: {
    bg: 'bg-blue-600',
    text: 'text-blue-600',
    badge: 'bg-blue-50 text-blue-700',
    border: 'border-blue-500',
  },
  purple: {
    bg: 'bg-purple-600',
    text: 'text-purple-600',
    badge: 'bg-purple-50 text-purple-700',
    border: 'border-purple-500',
  },
  rose: {
    bg: 'bg-rose-600',
    text: 'text-rose-600',
    badge: 'bg-rose-50 text-rose-700',
    border: 'border-rose-500',
  },
  amber: {
    bg: 'bg-amber-600',
    text: 'text-amber-600',
    badge: 'bg-amber-50 text-amber-700',
    border: 'border-amber-500',
  },
};

export const Sidebar: React.FC<SidebarProps> = ({
  courses,
  selectedCourseId,
  onSelectCourse,
  isCollapsed,
  onToggleCollapse,
  user,
  onOpenCreateCourse,
  onOpenCourseSettings,
}) => {
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  return (
    <aside
      className={`bg-white dark:bg-[#161616] border border-slate-200/90 dark:border-[#2a2a2a] rounded-2xl shadow-xs flex flex-col transition-[width] duration-300 ease-in-out shrink-0 select-none overflow-hidden ${
        isCollapsed ? 'w-20' : 'w-76'
      }`}
    >
      {/* Шапка сайдбара с фиксированной высотой (без сдвигов и прыжков контента) */}
      <div className="h-[60px] px-3.5 border-b border-slate-100 dark:border-[#2a2a2a] flex items-center justify-between shrink-0 overflow-hidden">
        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
          <button
            type="button"
            onClick={isCollapsed ? onToggleCollapse : undefined}
            title={isCollapsed ? 'Развернуть меню' : undefined}
            className={`w-9 h-9 rounded-xl bg-[#0F2D59] text-white flex items-center justify-center shadow-2xs shrink-0 transition-transform ${
              isCollapsed ? 'hover:scale-105 cursor-pointer hover:bg-[#163e77]' : ''
            }`}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-white" />
            ) : (
              <BookOpen className="w-4 h-4 text-white" />
            )}
          </button>

          <div
            className={`overflow-hidden transition-[max-width,opacity] duration-300 ease-in-out whitespace-nowrap ${
              isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[150px] opacity-100'
            }`}
          >
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-neutral-400">
              Дисциплины
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-300 font-semibold truncate">
              {courses.length} активных курсов
            </p>
          </div>
        </div>

        {!isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Свернуть меню в иконки"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#252525] rounded-lg transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Список дисциплин */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar overflow-x-hidden">
        {courses.map((course) => {
          const isSelected = course.id === selectedCourseId;
          const colorTheme =
            COURSE_COLOR_MAP[course.color || 'indigo'] || COURSE_COLOR_MAP.indigo;

          return (
            <div
              key={course.id}
              onClick={() => onSelectCourse(course.id)}
              className={`w-full text-left rounded-xl transition-colors duration-150 flex items-center p-2 group relative cursor-pointer overflow-hidden ${
                isSelected
                  ? 'bg-blue-50/70 dark:bg-[#242424] border border-blue-200/80 dark:border-[#383838] shadow-2xs'
                  : 'hover:bg-slate-50 dark:hover:bg-[#202020] border border-transparent'
              }`}
            >
              {isSelected && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 rounded-r-md" />
              )}

              <div className="flex items-center min-w-0 flex-1 overflow-hidden">
                {/* Кастомная цветная плашка с кодом предмета (не смещается по горизонтали) */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs transition-transform group-hover:scale-105 ${colorTheme.bg}`}
                >
                  {course.code || 'КУРС'}
                </div>

                {/* Текстовая информация (плавное появление без переноса строк) */}
                <div
                  className={`min-w-0 flex-1 overflow-hidden transition-[max-width,opacity] duration-300 ease-in-out whitespace-nowrap ${
                    isCollapsed
                      ? 'max-w-0 opacity-0 pointer-events-none'
                      : 'max-w-[160px] opacity-100 ml-2.5'
                  }`}
                >
                  <p
                    className={`text-sm font-semibold truncate ${
                      isSelected
                        ? 'text-blue-950 dark:text-neutral-100 font-bold'
                        : 'text-slate-800 dark:text-neutral-200'
                    }`}
                  >
                    {course.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-slate-400 dark:text-neutral-400 font-medium shrink-0">
                      {course.code}
                    </span>
                    {course.groups && course.groups.length > 0 && (
                      <>
                        <span className="text-slate-300 dark:text-neutral-600 text-xs shrink-0">•</span>
                        <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium truncate">
                          {course.groups.join(', ')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Правая часть (кнопка 3 точки и счетчик несданных) */}
              <div
                className={`flex items-center gap-1 shrink-0 overflow-hidden transition-[max-width,opacity] duration-300 ease-in-out ${
                  isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[60px] opacity-100'
                }`}
              >
                {onOpenCourseSettings && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCourseSettings(course);
                    }}
                    title={isTeacher ? 'Настроить дисциплину' : 'Информация о дисциплине'}
                    className="p-1 text-slate-300 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-200/60 dark:hover:bg-[#282828] rounded-md transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                )}

                {course.uncompletedCount !== undefined && course.uncompletedCount > 0 && (
                  <span
                    title="Несданных заданий"
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-[#282828] text-slate-600 dark:text-neutral-300 group-hover:bg-slate-200 dark:group-hover:bg-[#323232]'
                    }`}
                  >
                    {course.uncompletedCount}
                  </span>
                )}
              </div>

              {/* Индикатор в свернутом виде (аккуратная точка над иконкой) */}
              {isCollapsed && course.uncompletedCount !== undefined && course.uncompletedCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-[#161616]" />
              )}
            </div>
          );
        })}
      </div>

      {/* Внизу панели с фиксированной структурой */}
      <div className="p-3 border-t border-slate-100 dark:border-[#2a2a2a] bg-slate-50/50 dark:bg-[#181818]/60 shrink-0 overflow-hidden">
        {isTeacher ? (
          <button
            onClick={onOpenCreateCourse}
            title="Добавить новую учебную дисциплину"
            className="w-full bg-[#0F2D59] hover:bg-[#163e77] text-white font-semibold rounded-xl text-sm transition-colors shadow-2xs flex items-center justify-center p-2.5 overflow-hidden whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span
              className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap ${
                isCollapsed
                  ? 'max-w-0 opacity-0 pointer-events-none'
                  : 'max-w-[160px] opacity-100 ml-2'
              }`}
            >
              Создать дисциплину
            </span>
          </button>
        ) : (
          <div
            className={`text-xs text-slate-400 dark:text-neutral-500 text-center font-medium overflow-hidden transition-all duration-300 whitespace-nowrap ${
              isCollapsed ? 'max-w-0 opacity-0 h-0 py-0' : 'max-w-full opacity-100'
            }`}
          >
            <span>ТОГУ • Учебный портал</span>
          </div>
        )}
      </div>
    </aside>
  );
};
