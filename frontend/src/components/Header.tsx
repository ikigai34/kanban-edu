'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User, Course, CanvasTransform, AppNotification } from '@/types';
import { ToguLogo } from './ToguLogo';
import { NotificationBell } from './NotificationBell';
import {
  Search,
  Tag,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  LogOut,
  User as UserIcon,
  ChevronDown,
  X,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { getTagStyle } from '@/lib/tagUtils';

interface HeaderProps {
  user: User | null;
  selectedCourse?: Course | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  availableTags: string[];
  canvasTransform: CanvasTransform;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onLogout: () => void;
  onSwitchRole: (newRole: 'student' | 'teacher') => void;
  onOpenCourseSettings?: () => void;
  notifications?: AppNotification[];
  onMarkAllAsRead?: () => void;
  onSelectNotification?: (taskId?: string, notifId?: string) => void;
  selectedGroup?: string | null;
  onSelectGroup?: (group: string | null) => void;
  selectedStudentId?: string | null;
  onSelectStudent?: (studentId: string | null) => void;
  students?: { id: string; full_name: string; group: string }[];
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  selectedCourse,
  searchQuery,
  onSearchChange,
  selectedTag,
  onSelectTag,
  availableTags,
  canvasTransform,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onLogout,
  onSwitchRole,
  onOpenCourseSettings,
  notifications = [],
  onMarkAllAsRead = () => {},
  onSelectNotification = () => {},
  selectedGroup = null,
  onSelectGroup = () => {},
  selectedStudentId = null,
  onSelectStudent = () => {},
  students = [],
  isDark = false,
  onToggleTheme,
}) => {
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setIsTagDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const zoomPercent = Math.round(canvasTransform.scale * 100);

  return (
    <header className="h-16 border-b border-slate-200/80 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#181818]/95 backdrop-blur-md px-3.5 md:px-4.5 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)] gap-4 select-none transition-colors duration-150">
      {/* 1. Левая зона: Эмблема ТОГУ (выровнена по иконкам дисциплин) + Название курса + Поиск + Фильтр */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div className="w-10 h-10 flex items-center justify-center shrink-0 ml-4">
          <ToguLogo size={40} />
        </div>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-[#2a2a2a] hidden sm:block" />

        {/* Название курса */}
        {selectedCourse && (
          <div className="flex items-center gap-2 min-w-0">
            <span
              onClick={isTeacher ? onOpenCourseSettings : undefined}
              className={`text-sm sm:text-base font-bold text-slate-900 dark:text-neutral-100 tracking-tight truncate max-w-[150px] sm:max-w-[220px] ${
                isTeacher && onOpenCourseSettings
                  ? 'hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer flex items-center gap-1.5'
                  : ''
              }`}
              title={selectedCourse.title}
            >
              <span>{selectedCourse.title}</span>
              {isTeacher && onOpenCourseSettings && (
                <Settings className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 inline" />
              )}
            </span>
            {/* Студент видит просто свою группу, преподаватель — интерактивные селекторы группы и студента */}
            {!isTeacher && selectedCourse.groups && selectedCourse.groups.length > 0 && (
              <span className="hidden xl:inline text-xs font-semibold text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-[#242424] px-2 py-0.5 rounded-md">
                {selectedCourse.groups[0]}
              </span>
            )}

            {isTeacher && (
              <div className="flex items-center gap-1.5 shrink-0">
                <select
                  value={selectedGroup || 'all'}
                  onChange={(e) => onSelectGroup(e.target.value === 'all' ? null : e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-[#242424] hover:bg-slate-100 dark:hover:bg-[#2a2a2a] border border-slate-200/90 dark:border-[#383838] rounded-lg text-xs font-semibold text-slate-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs"
                  title="Фильтр по учебной группе"
                >
                  <option value="all">Все группы</option>
                  {(selectedCourse.groups || ['ПО-41', 'ПО-42']).map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStudentId || 'all'}
                  onChange={(e) => onSelectStudent(e.target.value === 'all' ? null : e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-[#242424] hover:bg-slate-100 dark:hover:bg-[#2a2a2a] border border-slate-200/90 dark:border-[#383838] rounded-lg text-xs font-semibold text-slate-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs max-w-[145px] truncate"
                  title="Срез по конкретному студенту"
                >
                  <option value="all">Все студенты</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.group})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Быстрый поиск */}
        <div className="relative max-w-[220px] lg:max-w-[260px] w-full hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Поиск по заданиям..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-7 py-2 text-xs sm:text-sm bg-slate-50/80 dark:bg-[#242424] hover:bg-slate-100/70 dark:hover:bg-[#2a2a2a] focus:bg-white dark:focus:bg-[#252525] border border-slate-200/80 dark:border-[#383838] rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-neutral-500 transition-all placeholder:text-slate-400 dark:placeholder:text-neutral-500 text-slate-900 dark:text-neutral-100"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Фильтр по тегам */}
        <div className="relative shrink-0" ref={tagDropdownRef}>
          <button
            onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
              selectedTag
                ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300'
                : 'bg-slate-50/80 dark:bg-[#242424] hover:bg-slate-100/70 dark:hover:bg-[#2a2a2a] border border-slate-200/80 dark:border-[#383838] text-slate-600 dark:text-neutral-300'
            }`}
          >
            <Tag className="w-3.5 h-3.5 opacity-70" />
            <span className="max-w-[100px] truncate">
              {selectedTag || 'Теги'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
          </button>

          {isTagDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 z-40 w-56 bg-white dark:bg-[#202020] rounded-xl shadow-lg border border-slate-200/90 dark:border-[#333333] py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 dark:text-neutral-400 uppercase tracking-wider border-b border-slate-100 dark:border-[#2a2a2a]">
                Фильтрация по тегам
              </div>

              <button
                onClick={() => {
                  onSelectTag(null);
                  setIsTagDropdownOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#282828] transition-colors ${
                  !selectedTag ? 'font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/30' : 'text-slate-700 dark:text-neutral-200'
                }`}
              >
                <span>Все задания</span>
                {!selectedTag && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />}
              </button>

              <div className="max-h-52 overflow-y-auto custom-scrollbar">
                {availableTags.map((tag) => {
                  const style = getTagStyle(tag);
                  const isSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        onSelectTag(isSelected ? null : tag);
                        setIsTagDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#282828] transition-colors ${
                        isSelected ? 'font-semibold bg-blue-50/40 dark:bg-blue-950/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                        <span className="text-slate-700 dark:text-neutral-200 font-medium">{tag}</span>
                      </div>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Центральная зона: Масштаб */}
      <div className="hidden lg:flex items-center gap-1.5 bg-slate-100/80 dark:bg-[#202020] border border-slate-200/70 dark:border-[#333333] rounded-xl p-1 shadow-2xs">
        <button
          onClick={onZoomOut}
          title="Уменьшить масштаб (Ctrl -)"
          className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-white dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span
          className="text-xs sm:text-sm font-mono font-semibold text-slate-700 dark:text-neutral-200 px-2 min-w-[50px] text-center select-none"
          title="Масштаб холста"
        >
          {zoomPercent}%
        </span>

        <button
          onClick={onZoomIn}
          title="Приблизить масштаб (Ctrl +)"
          className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-white dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-200 dark:bg-[#333333] mx-1" />

        <button
          onClick={onResetZoom}
          title="Сбросить масштаб и вернуть холст в начало (0, 0)"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs sm:text-sm font-medium text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Центрировать</span>
        </button>
      </div>

      {/* 3. Правая зона: Роль + Тема + Профиль */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
        <div className="hidden md:flex items-center bg-slate-100/80 dark:bg-[#202020] rounded-xl p-0.5 border border-slate-200/80 dark:border-[#333333]">
          <button
            onClick={() => onSwitchRole('student')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              user?.role === 'student'
                ? 'bg-white dark:bg-[#2a2a2a] text-slate-900 dark:text-neutral-100 shadow-2xs font-semibold'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100'
            }`}
          >
            Студент
          </button>
          <button
            onClick={() => onSwitchRole('teacher')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              user?.role === 'teacher'
                ? 'bg-white dark:bg-[#2a2a2a] text-slate-900 dark:text-neutral-100 shadow-2xs font-semibold'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100'
            }`}
          >
            Преподаватель
          </button>
        </div>

        {/* Кнопка переключения темной/светлой темы */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            title={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-[#242424] rounded-xl transition-all duration-200 active:scale-95"
          >
            {isDark ? (
              <Sun className="w-4.5 h-4.5 text-amber-400 hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="w-4.5 h-4.5 text-slate-600 hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>
        )}

        {/* Колокольчик уведомлений */}
        <NotificationBell
          notifications={notifications}
          onMarkAllAsRead={onMarkAllAsRead}
          onSelectNotification={onSelectNotification}
        />

        {user && (
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2.5 bg-slate-50/80 dark:bg-[#242424] hover:bg-slate-100/80 dark:hover:bg-[#2a2a2a] border border-slate-200/80 dark:border-[#383838] rounded-xl py-1.5 px-2.5 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[#0F2D59] text-white flex items-center justify-center text-xs font-semibold shadow-2xs">
                {user.full_name
                  ? user.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                  : <UserIcon className="w-4 h-4 text-white" />}
              </div>

              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-neutral-100">
                  {user.full_name}
                </span>
                <span className="text-xs text-slate-400 dark:text-neutral-500 font-medium">
                  {user.role === 'teacher' ? 'Преподаватель' : `Студент • ${user.group || 'ПО-41'}`}
                </span>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isProfileDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-40 w-64 bg-white dark:bg-[#202020] rounded-xl shadow-xl border border-slate-200/90 dark:border-[#333333] py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-[#2a2a2a]">
                  <p className="font-semibold text-slate-900 dark:text-neutral-100 text-sm">{user.full_name}</p>
                  <p className="text-xs text-slate-400 dark:text-neutral-500 truncate">{user.email}</p>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium mt-1">
                    Роль: {user.role === 'teacher' ? 'Преподаватель' : 'Студент'}
                  </p>
                </div>

                <div className="px-4 py-2 border-b border-slate-100 dark:border-[#2a2a2a]">
                  <p className="text-xs font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5">
                    Сменить роль
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        onSwitchRole('student');
                        setIsProfileDropdownOpen(false);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border ${
                        user.role === 'student'
                          ? 'bg-slate-100 dark:bg-[#2a2a2a] text-slate-900 dark:text-neutral-100 border-slate-300 dark:border-neutral-600 font-semibold'
                          : 'bg-white dark:bg-[#202020] text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-[#333333] hover:bg-slate-50 dark:hover:bg-[#282828]'
                      }`}
                    >
                      Студент
                    </button>
                    <button
                      onClick={() => {
                        onSwitchRole('teacher');
                        setIsProfileDropdownOpen(false);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border ${
                        user.role === 'teacher'
                          ? 'bg-slate-100 dark:bg-[#2a2a2a] text-slate-900 dark:text-neutral-100 border-slate-300 dark:border-neutral-600 font-semibold'
                          : 'bg-white dark:bg-[#202020] text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-[#333333] hover:bg-slate-50 dark:hover:bg-[#282828]'
                      }`}
                    >
                      Преподаватель
                    </button>
                  </div>
                </div>

                {onToggleTheme && (
                  <button
                    onClick={() => {
                      onToggleTheme();
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-[#282828] font-medium flex items-center justify-between transition-colors text-xs border-b border-slate-100 dark:border-[#2a2a2a]"
                  >
                    <span className="flex items-center gap-2">
                      {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-500" />}
                      <span>Тёмная тема</span>
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-neutral-500">
                      {isDark ? 'Вкл' : 'Выкл'}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full px-4 py-2.5 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium flex items-center gap-2 transition-colors text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Выйти из аккаунта</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
