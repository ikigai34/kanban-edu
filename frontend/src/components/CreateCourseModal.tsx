'use client';

import React, { useState } from 'react';
import { Course } from '@/types';
import { createCourse } from '@/lib/api';
import { X, BookOpen, Sparkles } from 'lucide-react';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseCreated: (course: Course) => void;
}

const COLOR_OPTIONS = [
  { id: 'indigo', name: 'Индиго', bg: 'bg-indigo-600' },
  { id: 'emerald', name: 'Изумруд', bg: 'bg-emerald-600' },
  { id: 'blue', name: 'Синий', bg: 'bg-blue-600' },
  { id: 'purple', name: 'Фиолетовый', bg: 'bg-purple-600' },
  { id: 'amber', name: 'Янтарный', bg: 'bg-amber-600' },
  { id: 'rose', name: 'Розовый', bg: 'bg-rose-600' },
];

export const CreateCourseModal: React.FC<CreateCourseModalProps> = ({
  isOpen,
  onClose,
  onCourseCreated,
}) => {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('indigo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const newCourse = await createCourse({
        title: title.trim(),
        code: code.trim().toUpperCase() || title.trim().slice(0, 3).toUpperCase(),
        description: description.trim() || undefined,
        color: selectedColor,
      });
      onCourseCreated(newCourse);
      setTitle('');
      setCode('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка создания дисциплины');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#1c1c1c] rounded-3xl shadow-2xl border border-slate-200/90 dark:border-[#2a2a2a] overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 dark:border-[#2a2a2a] flex items-center justify-between bg-slate-50/60 dark:bg-[#202020]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0F2D59] text-white flex items-center justify-center shadow-2xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-neutral-100 tracking-tight">
                Новая учебная дисциплина
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                Создание курса для учебной группы
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a2a2a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
              Название курса *
            </label>
            <input
              type="text"
              required
              placeholder="Например: Архитектура вычислительных систем"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#333333] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Код предмета (плашка)
              </label>
              <input
                type="text"
                maxLength={4}
                placeholder="АВМ"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs font-bold uppercase bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#333333] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Цвет темы
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedColor(c.id)}
                    title={c.name}
                    className={`w-6 h-6 rounded-full ${c.bg} transition-all ${
                      selectedColor === c.id ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-neutral-400 scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
              Описание дисциплины
            </label>
            <textarea
              rows={3}
              placeholder="Краткая аннотация и цели учебного курса..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#333333] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#2a2a2a] rounded-xl transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold bg-[#0F2D59] hover:bg-[#163e77] text-white rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {loading ? 'Создание...' : 'Создать дисциплину'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
