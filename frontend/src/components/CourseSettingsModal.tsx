'use client';

import React, { useState, useEffect } from 'react';
import { Course, User } from '@/types';
import { MarkdownViewer } from './MarkdownViewer';
import {
  X,
  Settings,
  Trash2,
  Check,
  Plus,
  Users,
  AlertTriangle,
  BookOpen,
  Info,
} from 'lucide-react';

interface CourseSettingsModalProps {
  isOpen: boolean;
  course: Course | null;
  currentUser: User | null;
  onClose: () => void;
  onSave: (updatedCourse: Course) => void;
  onDelete: (courseId: string) => void;
}

const PRESET_GROUPS = ['ПО-41', 'ПО-42', 'ИВТ-41', 'ПИ-41', 'ИС-41'];

const COLOR_OPTIONS = [
  { id: 'indigo', name: 'Индиго', bg: 'bg-indigo-600', border: 'border-indigo-600' },
  { id: 'emerald', name: 'Изумруд', bg: 'bg-emerald-600', border: 'border-emerald-600' },
  { id: 'blue', name: 'Синий', bg: 'bg-blue-600', border: 'border-blue-600' },
  { id: 'purple', name: 'Фиолетовый', bg: 'bg-purple-600', border: 'border-purple-600' },
  { id: 'amber', name: 'Янтарный', bg: 'bg-amber-600', border: 'border-amber-600' },
  { id: 'rose', name: 'Розовый', bg: 'bg-rose-600', border: 'border-rose-600' },
];

export const CourseSettingsModal: React.FC<CourseSettingsModalProps> = ({
  isOpen,
  course,
  currentUser,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('indigo');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [customGroupInput, setCustomGroupInput] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isTeacher = currentUser?.role === 'teacher' || currentUser?.role === 'admin';

  useEffect(() => {
    if (course) {
      setTitle(course.title);
      setCode(course.code);
      setDescription(course.description || '');
      setSelectedColor(course.color || 'indigo');
      setSelectedGroups(course.groups || ['ПО-41']);
      setIsConfirmingDelete(false);
      setCustomGroupInput('');
    }
  }, [course]);

  if (!isOpen || !course) return null;

  // Режим просмотра информации о дисциплине для СТУДЕНТА (только чтение)
  if (!isTeacher) {
    const colorBg =
      COLOR_OPTIONS.find((c) => c.id === (course.color || 'indigo'))?.bg || 'bg-indigo-600';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="w-full max-w-lg bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-xl border border-slate-200/90 dark:border-[#2a2a2a] overflow-hidden animate-in zoom-in-98 duration-150">
          {/* Шапка модального окна */}
          <div className="px-6 py-4.5 border-b border-slate-100 dark:border-[#2a2a2a] flex items-center justify-between bg-slate-50/60 dark:bg-[#202020]/80">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs ${colorBg}`}
              >
                {course.code || 'КУРС'}
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-neutral-100 tracking-tight">
                  {course.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                  Информация об учебной дисциплине
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a2a2a] transition-colors"
              title="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {/* Описание дисциплины */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-2">
                Описание дисциплины
              </h4>
              {course.description ? (
                <div className="p-4 bg-slate-50/70 dark:bg-[#252525]/40 border border-slate-200/80 dark:border-[#333333]/80 rounded-xl text-sm text-slate-700 dark:text-neutral-300 leading-relaxed">
                  <MarkdownViewer content={course.description} />
                </div>
              ) : (
                <div className="p-5 bg-slate-50/60 dark:bg-[#252525]/20 border border-dashed border-slate-200 dark:border-[#333333] rounded-xl text-center">
                  <BookOpen className="w-6 h-6 text-slate-300 dark:text-neutral-500 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                    Преподаватель пока не добавил описание к этой дисциплине
                  </p>
                </div>
              )}
            </div>

            {/* Метаданные: код и привязанные группы */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-[#2a2a2a]">
              <div className="p-3 bg-slate-50/70 dark:bg-[#252525]/40 border border-slate-200/70 dark:border-[#333333]/70 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">
                  Код дисциплины
                </span>
                <span className="font-bold text-sm text-slate-800 dark:text-neutral-200">{course.code}</span>
              </div>

              <div className="p-3 bg-slate-50/70 dark:bg-[#252525]/40 border border-slate-200/70 dark:border-[#333333]/70 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">
                  Учебные группы
                </span>
                <span className="font-medium text-xs text-slate-700 dark:text-neutral-300">
                  {course.groups && course.groups.length > 0
                    ? course.groups.join(', ')
                    : 'Все группы'}
                </span>
              </div>
            </div>

            {/* Кнопка закрытия */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-[#2a2a2a]">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold bg-[#0F2D59] hover:bg-[#163e77] text-white rounded-xl shadow-2xs transition-all"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleToggleGroup = (group: string) => {
    if (selectedGroups.includes(group)) {
      setSelectedGroups(selectedGroups.filter((g) => g !== group));
    } else {
      setSelectedGroups([...selectedGroups, group]);
    }
  };

  const handleAddCustomGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customGroupInput.trim().toUpperCase();
    if (trimmed && !selectedGroups.includes(trimmed)) {
      setSelectedGroups([...selectedGroups, trimmed]);
      setCustomGroupInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updated: Course = {
      ...course,
      title: title.trim(),
      code: code.trim().toUpperCase() || title.trim().slice(0, 3).toUpperCase(),
      description: description.trim() || undefined,
      color: selectedColor,
      groups: selectedGroups,
    };

    onSave(updated);
    onClose();
  };

  const handleDelete = () => {
    // Двойная проверка прав
    if (!isTeacher) return;
    onDelete(course.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-xl border border-slate-200/90 dark:border-[#2a2a2a] overflow-hidden animate-in zoom-in-98 duration-150">
        {/* Шапка модального окна */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-[#2a2a2a] flex items-center justify-between bg-slate-50/60 dark:bg-[#202020]/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#252525] text-slate-700 dark:text-neutral-300 flex items-center justify-center border border-slate-200/80 dark:border-[#333333]">
              <Settings className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-900 dark:text-neutral-100 tracking-tight">
                Настройки дисциплины
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                Кастомизация, привязка групп и управление курсом
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a2a2a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Название курса */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
              Название курса
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50/80 dark:bg-[#252525]/80 hover:bg-white dark:hover:bg-[#2a2a2a] focus:bg-white dark:focus:bg-[#202020] border border-slate-200 dark:border-[#333333] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-neutral-100"
            />
          </div>

          {/* Код предмета и цвет */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Код предмета (плашка)
              </label>
              <input
                type="text"
                maxLength={4}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2 text-sm font-bold uppercase bg-slate-50/80 dark:bg-[#252525]/80 hover:bg-white dark:hover:bg-[#2a2a2a] focus:bg-white dark:focus:bg-[#202020] border border-slate-200 dark:border-[#333333] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-neutral-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Цвет темы
              </label>
              <div className="flex items-center gap-2 pt-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedColor(c.id)}
                    title={c.name}
                    className={`w-6.5 h-6.5 rounded-full ${c.bg} transition-all flex items-center justify-center ${
                      selectedColor === c.id
                        ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-neutral-400 scale-105'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {selectedColor === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Привязка групп */}
          <div className="bg-slate-50/70 dark:bg-[#252525]/40 border border-slate-200/80 dark:border-[#333333]/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Привязанные учебные группы</span>
              </label>
              <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                {selectedGroups.length} групп
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {PRESET_GROUPS.map((grp) => {
                const isAttached = selectedGroups.includes(grp);
                return (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => handleToggleGroup(grp)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                      isAttached
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-semibold shadow-2xs'
                        : 'bg-white dark:bg-[#252525] border-slate-200 dark:border-[#333333] text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-neutral-100 hover:bg-slate-50 dark:hover:bg-[#333333]'
                    }`}
                  >
                    {isAttached && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                    <span>{grp}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Другая группа (напр. ИВТ-31)..."
                value={customGroupInput}
                onChange={(e) => setCustomGroupInput(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-[#252525] border border-slate-200 dark:border-[#333333] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500"
              />
              <button
                type="button"
                onClick={handleAddCustomGroup}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-[#2a2a2a] hover:bg-slate-200 dark:hover:bg-[#333333] text-slate-700 dark:text-neutral-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Привязать</span>
              </button>
            </div>
          </div>

          {/* Описание */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
              Описание дисциплины
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 text-sm bg-slate-50/80 dark:bg-[#252525]/80 hover:bg-white dark:hover:bg-[#2a2a2a] focus:bg-white dark:focus:bg-[#202020] border border-slate-200 dark:border-[#333333] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500"
            />
          </div>

          {/* Опасная зона (ТОЛЬКО ДЛЯ ПРЕПОДАВАТЕЛЯ/АДМИНИСТРАТОРА) */}
          {isTeacher && (
            <div className="pt-2 border-t border-slate-100 dark:border-[#2a2a2a]">
              {!isConfirmingDelete ? (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Удалить эту дисциплину...</span>
                </button>
              ) : (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2.5 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-900 dark:text-rose-300 font-medium leading-relaxed">
                      Вы действительно хотите удалить <b>«{course.title}»</b>? Все привязанные задания будут удалены.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-2xs"
                    >
                      Подтвердить удаление
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Кнопки сохранения */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#2a2a2a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2a2a2a] rounded-xl transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-[#0F2D59] hover:bg-[#163e77] text-white rounded-xl shadow-2xs transition-all"
            >
              Сохранить изменения
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
