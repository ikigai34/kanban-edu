'use client';

import React, { useState } from 'react';
import { Assignment, TaskPriority } from '@/types';
import { createAssignment } from '@/lib/api';
import { extractHashtags, getTagStyle } from '@/lib/tagUtils';
import {
  X,
  FilePlus,
  Paperclip,
  Calendar,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
  Upload,
} from 'lucide-react';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  courseId: string;
  onClose: () => void;
  onAssignmentCreated: (assignment: Assignment) => void;
}

export const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  courseId,
  onClose,
  onAssignmentCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [deadline, setDeadline] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string; url: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Извлечение тегов на лету для предпросмотра
  const previewTags = Array.from(
    new Set([...extractHashtags(title), ...extractHashtags(description)])
  );

  const handleAddDemoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const added = Array.from(files).map((f) => ({
      name: f.name,
      size: `${Math.round(f.size / 1024)} КБ`,
      url: URL.createObjectURL(f),
    }));
    setAttachedFiles((prev) => [...prev, ...added]);
  };

  const handleQuickAddTag = (tag: string) => {
    if (!title.includes(tag)) {
      setTitle((prev) => `${prev.trim()} ${tag}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const isInfo = priority === 'info';
      const newAssign = await createAssignment({
        course_id: courseId,
        title: title.trim(),
        description: description.trim() || undefined,
        max_score: isInfo ? 0 : (maxScore ? parseInt(maxScore, 10) : 100),
        priority,
        deadline: isInfo ? null : (deadline || null),
        files: attachedFiles,
      });

      onAssignmentCreated(newAssign);
      setTitle('');
      setDescription('');
      setPriority('normal');
      setDeadline('');
      setAttachedFiles([]);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка создания задания');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-[#1c1c1c] rounded-3xl shadow-2xl border border-slate-200/90 dark:border-[#2a2a2a] overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 dark:border-[#2a2a2a] flex items-center justify-between bg-slate-50/60 dark:bg-[#202020]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs">
              <FilePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-neutral-100 tracking-tight">
                Создать задание для студентов
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                Задание появится в колонке «К выполнению»
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Заголовок задания */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
              Заголовок задания *
            </label>
            <input
              type="text"
              required
              placeholder="Лабораторная работа №5: Потоки ввода-вывода #лабораторная #linux"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#333333] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500"
            />

            {/* Быстрые системные теги */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-semibold">Добавить тег:</span>
              {['#лабораторная', '#лекция', '#практика', '#курсовая', '#экзамен', '#инфо'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleQuickAddTag(t)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-[#252525] hover:bg-slate-200 dark:hover:bg-[#333333] text-slate-700 dark:text-neutral-300 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Предпросмотр распарсенных тегов */}
            {previewTags.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-semibold">Распознанные теги:</span>
                {previewTags.map((tag) => {
                  const style = getTagStyle(tag);
                  return (
                    <span
                      key={tag}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium ${style.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      <span>{tag}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Приоритет, Дедлайн и Баллы */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={priority === 'info' ? 'sm:col-span-3' : ''}>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Тип / Приоритет
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#333333] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-neutral-100"
              >
                <option value="normal">Задание (Обычный)</option>
                <option value="urgent">Задание (Срочный)</option>
                <option value="info">Инфо-материал (без сдачи и баллов)</option>
              </select>
            </div>

            {priority !== 'info' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                    Срок сдачи (Дедлайн)
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#333333] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                    Макс. балл
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#333333] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-neutral-100"
                  />
                </div>
              </>
            )}
          </div>

          {/* Описание с Markdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
              Подробное описание задания (поддерживается Markdown и списки задач)
            </label>
            <textarea
              rows={4}
              placeholder={`### Цель работы\nИзучить принципы работы...\n\n- [ ] Выполнить пункт 1\n- [ ] Написать отчет`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 text-xs font-mono bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#333333] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500"
            />
          </div>

          {/* Прикрепление файлов преподавателя */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
              Прикрепить методические указания и файлы
            </label>
            {attachedFiles.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {attachedFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#333333] rounded-lg text-xs">
                    <span className="truncate font-medium text-slate-800 dark:text-neutral-200">{f.name} ({f.size})</span>
                    <button
                      type="button"
                      onClick={() => setAttachedFiles(attachedFiles.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="border border-dashed border-slate-300 dark:border-[#333333] hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50 dark:bg-[#252525]/50 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs text-slate-600 dark:text-neutral-300">
              <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Выбрать файл методички (PDF, ZIP, DOCX)</span>
              <input type="file" multiple onChange={handleAddDemoFile} className="hidden" />
            </label>
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
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {loading ? 'Публикация...' : 'Опубликовать задание'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
