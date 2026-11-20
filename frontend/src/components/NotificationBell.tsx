'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppNotification, TaskStatus } from '@/types';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare,
  Award,
  Check,
  Send,
} from 'lucide-react';

interface NotificationBellProps {
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onSelectNotification: (taskId?: string, notifId?: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  onMarkAllAsRead,
  onSelectNotification,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusBadge = (status: TaskStatus, score?: number | null) => {
    switch (status) {
      case 'revision':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
            <AlertCircle className="w-3 h-3 text-rose-500" />
            <span>На доработке</span>
            {score !== undefined && score !== null && <span>({score} б.)</span>}
          </span>
        );
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Зачтено</span>
            {score !== undefined && score !== null && <span>({score} б.)</span>}
          </span>
        );
      case 'on_review':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
            <Send className="w-3 h-3 text-amber-600" />
            <span>На проверке</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
            <Clock className="w-3 h-3 text-indigo-500" />
            <span>В работе</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/60">
            <span>К выполнению</span>
          </span>
        );
    }
  };

  const truncateComment = (text: string, maxLength = 80) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Кнопка колокольчика */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl border transition-all ${
          isOpen
            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-2xs'
            : 'bg-slate-50/80 dark:bg-[#242424] hover:bg-slate-100/80 dark:hover:bg-[#2a2a2a] border border-slate-200/80 dark:border-[#383838] text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-neutral-100'
        }`}
        title="Уведомления от преподавателя"
      >
        <Bell className="w-4 h-4" />

        {/* Бейдж непрочитанных уведомлений */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#181818] shadow-2xs animate-in zoom-in-75">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Выпадающее меню уведомлений */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 bg-white dark:bg-[#202020] rounded-2xl shadow-2xl border border-slate-200/90 dark:border-[#333333] py-2 text-xs animate-in fade-in zoom-in-95 duration-100 select-none">
          {/* Шапка меню */}
          <div className="px-4 py-2 border-b border-slate-100 dark:border-[#2a2a2a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-neutral-100">Уведомления</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50">
                  {unreadCount} новых
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 hover:underline p-1"
                title="Отметить все как прочитанные"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Прочитать все</span>
              </button>
            )}
          </div>

          {/* Список уведомлений */}
          <div className="max-h-88 overflow-y-auto divide-y divide-slate-100 dark:divide-[#2a2a2a] custom-scrollbar">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    onSelectNotification(notif.taskId, notif.id);
                    setIsOpen(false);
                  }}
                  className={`p-3.5 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-[#282828] flex items-start gap-3 relative ${
                    !notif.isRead ? 'bg-blue-50/25 dark:bg-blue-950/20' : ''
                  }`}
                >
                  {/* Иконка / Точка непрочитанного */}
                  <div className="mt-1 shrink-0">
                    {!notif.isRead ? (
                      <span className="w-2 h-2 rounded-full bg-blue-600 block shadow-2xs" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-neutral-600 block opacity-50" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 truncate">
                        {notif.teacherName || 'Преподаватель'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-neutral-500 shrink-0">
                        {notif.createdAt}
                      </span>
                    </div>

                    <h5 className="font-semibold text-xs text-slate-900 dark:text-neutral-100 leading-snug line-clamp-1 mb-1.5">
                      {notif.taskTitle}
                    </h5>

                    <div className="flex items-center gap-2 mb-1.5">
                      {getStatusBadge(notif.status, notif.score)}
                    </div>

                    {notif.teacherComment && (
                      <div className="p-2 bg-slate-50 dark:bg-[#242424]/70 border border-slate-200/70 dark:border-[#333333] rounded-lg text-[11px] text-slate-600 dark:text-neutral-300 leading-relaxed italic">
                        <span className="font-medium text-slate-700 dark:text-neutral-200 not-italic mr-1">
                          Замечание:
                        </span>
                        «{truncateComment(notif.teacherComment)}»
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400 dark:text-neutral-500">
                <Bell className="w-8 h-8 text-slate-300 dark:text-neutral-500 mx-auto mb-2 stroke-1" />
                <p className="text-xs font-semibold text-slate-600 dark:text-neutral-300">Нет новых уведомлений</p>
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">
                  Здесь появятся комментарии и оценки преподавателя
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
