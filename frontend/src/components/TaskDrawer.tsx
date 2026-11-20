'use client';

import React, { useState, useEffect } from 'react';
import { StudentTask, User, TaskStatus, AttachmentFile, SubmissionFile } from '@/types';
import { submitTask, gradeTask } from '@/lib/api';
import { MarkdownViewer } from './MarkdownViewer';
import {
  X,
  FileText,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  MessageSquare,
  GitBranch,
  Trash2,
  Calendar,
  Award,
  FileArchive,
  FileCode,
  Eye,
  Info,
} from 'lucide-react';
import { extractHashtags, getTagStyle } from '@/lib/tagUtils';

interface TaskDrawerProps {
  task: StudentTask | null;
  isOpen: boolean;
  currentUser: User | null;
  onClose: () => void;
  onTaskUpdated: (updatedTask: StudentTask) => void;
  onTeacherAction?: (data: {
    taskId: string;
    taskTitle: string;
    status: TaskStatus;
    score?: number | null;
    teacherComment?: string | null;
  }) => void;
  onStudentSubmitted?: (task: StudentTask) => void;
}

export const TaskDrawer: React.FC<TaskDrawerProps> = ({
  task,
  isOpen,
  currentUser,
  onClose,
  onTaskUpdated,
  onTeacherAction,
  onStudentSubmitted,
}) => {
  const [comment, setComment] = useState(task?.comment || '');
  const [repoUrl, setRepoUrl] = useState(task?.repo_url || '');
  const [submissionFiles, setSubmissionFiles] = useState<SubmissionFile[]>(
    task?.submission_files || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [gradeScore, setGradeScore] = useState<string>(
    task?.score !== null && task?.score !== undefined ? task.score.toString() : ''
  );
  const [teacherComment, setTeacherComment] = useState(task?.teacher_comment || '');
  const [isGrading, setIsGrading] = useState(false);

  // Плавный запуск анимации выезда (slide-in) при монтировании
  const [isAnimatedIn, setIsAnimatedIn] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      let rafId2: number;
      const rafId1 = requestAnimationFrame(() => {
        rafId2 = requestAnimationFrame(() => {
          setIsAnimatedIn(true);
        });
      });
      return () => {
        cancelAnimationFrame(rafId1);
        if (rafId2) cancelAnimationFrame(rafId2);
      };
    } else {
      setIsAnimatedIn(false);
    }
  }, [isOpen, task?.id]);

  useEffect(() => {
    if (task) {
      setComment(task.comment || '');
      setRepoUrl(task.repo_url || '');
      setSubmissionFiles(task.submission_files || []);
      setGradeScore(task.score !== null && task.score !== undefined ? task.score.toString() : '');
      setTeacherComment(task.teacher_comment || '');
      setError(null);
      setSuccessMessage(null);
    }
  }, [task?.id]);

  // Закрытие по Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!task) return null;

  const isTeacher = currentUser?.role === 'teacher' || currentUser?.role === 'admin';
  const assignment = task.assignment;
  const isInfoCard =
    task.status === 'info' ||
    task.priority === 'info' ||
    assignment?.priority === 'info' ||
    assignment?.tags?.some((t) =>
      ['#инфо', '#лекция', '#объявление', '#информация'].includes(t.toLowerCase())
    ) ||
    ['#инфо', '#лекция', '#объявление', '#информация'].some((t) =>
      assignment?.title?.toLowerCase().includes(t)
    );

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

  const allTags = Array.from(
    new Set([
      ...(assignment?.tags || []).map((t) => t.toLowerCase()),
      ...extractHashtags(assignment?.title),
      ...extractHashtags(assignment?.description),
    ])
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const newFiles: SubmissionFile[] = Array.from(fileList).map((f, idx) => ({
      id: `sub-file-${Date.now()}-${idx}`,
      name: f.name,
      size: `${Math.round(f.size / 1024)} КБ`,
      url: URL.createObjectURL(f),
      uploaded_at: 'Только что',
    }));

    const updated = [...submissionFiles, ...newFiles];
    setSubmissionFiles(updated);
  };

  const handleRemoveSubmissionFile = (fileId: string) => {
    setSubmissionFiles(submissionFiles.filter((f) => f.id !== fileId));
  };

  const handleSubmitSolution = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const updated = await submitTask(
        task.id,
        comment,
        submissionFiles[0]?.url,
        repoUrl
      );
      onTaskUpdated({
        ...updated,
        submission_files: submissionFiles,
        assignment: task.assignment,
      });
      if (onStudentSubmitted) {
        onStudentSubmitted({
          ...updated,
          submission_files: submissionFiles,
          assignment: task.assignment,
        });
      }
      setSuccessMessage('Работа успешно сдана на проверку!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Ошибка сдачи работы');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGrade = async (newStatus: TaskStatus) => {
    setIsGrading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const scoreNum = gradeScore.trim() === '' ? null : parseFloat(gradeScore);
      const updated = await gradeTask(task.id, scoreNum, teacherComment || null, newStatus);
      onTaskUpdated({
        ...updated,
        assignment: task.assignment,
      });

      if (onTeacherAction) {
        onTeacherAction({
          taskId: task.id,
          taskTitle: task.assignment?.title.replace(/#[a-zA-Zа-яА-ЯёЁ0-9_-]+/g, '').trim() || 'Задание',
          status: newStatus,
          score: scoreNum,
          teacherComment: teacherComment || null,
        });
      }

      setSuccessMessage(
        newStatus === 'done'
          ? 'Работа успешно зачтена!'
          : newStatus === 'revision'
          ? 'Работа отправлена на доработку'
          : 'Статус задачи обновлен'
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Ошибка оценки работы');
    } finally {
      setIsGrading(false);
    }
  };

  const handleToggleTaskItem = (text: string) => {
    const item = task?.checklist?.find((c) => c.text === text);
    if (item && task && task.checklist) {
      const updatedChecklist = task.checklist.map((c) =>
        c.id === item.id ? { ...c, done: !c.done } : c
      );
      onTaskUpdated({ ...task, checklist: updatedChecklist });
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'info':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-neutral-300">
            Информационный материал
          </span>
        );
      case 'todo':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300/85">
            К выполнению
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/15 text-indigo-800 dark:text-indigo-300/85">
            В работе
          </span>
        );
      case 'on_review':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300/85">
            На проверке
          </span>
        );
      case 'revision':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300/85">
            На доработке
          </span>
        );
      case 'done':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300/85">
            Сдано / Зачтено
          </span>
        );
    }
  };

  const getFileIcon = (file: AttachmentFile) => {
    if (file.name.endsWith('.zip') || file.name.endsWith('.tar.gz')) {
      return <FileArchive className="w-4 h-4 text-amber-600 shrink-0" />;
    }
    if (file.name.endsWith('.sh') || file.name.endsWith('.cpp') || file.name.endsWith('.ts')) {
      return <FileCode className="w-4 h-4 text-indigo-600 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-blue-600 shrink-0" />;
  };

  return (
    <>
      {/* Затемнение и блюр ТОЛЬКО над холстом (плавный fade in/out) */}
      <div
        onClick={onClose}
        className={`absolute inset-0 z-30 bg-slate-900/25 backdrop-blur-[2px] transition-opacity duration-350 ease-in-out ${
          isAnimatedIn ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Выдвижная правая панель (плавный slide in/out без рывков в обе стороны) */}
      <aside
        className={`absolute inset-y-0 right-0 z-40 w-full sm:w-[680px] lg:w-[740px] xl:w-[800px] bg-white dark:bg-[#1c1c1c] border-l border-slate-200/90 dark:border-[#2a2a2a] shadow-2xl flex flex-col transition-transform duration-350 ease-out will-change-transform text-slate-800 dark:text-neutral-100 ${
          isAnimatedIn ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Шапка Drawer */}
        <div className="p-6 border-b border-slate-200/80 dark:border-[#2a2a2a] bg-slate-50/60 dark:bg-[#202020]/80 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
              {getStatusBadge(isInfoCard ? 'info' : task.status)}

              {!isInfoCard && task.priority === 'urgent' && (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Срочно
                </span>
              )}

              {!isInfoCard && assignment?.max_score && (
                <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                  Максимум: <b className="text-slate-800 dark:text-neutral-200">{assignment.max_score} баллов</b>
                </span>
              )}

              {!isInfoCard && task.deadline && (
                <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" />
                  Срок: <b className="text-slate-800 dark:text-neutral-200">{task.deadline}</b>
                </span>
              )}
            </div>

            {!isInfoCard && isTeacher && task.student && task.status !== 'todo' && (
              <div className="flex items-center gap-2 mb-2 px-3 py-1 bg-slate-100 dark:bg-[#252525]/80 border border-slate-200/90 dark:border-[#333333] rounded-lg text-xs font-medium text-slate-700 dark:text-neutral-300 w-fit">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {task.student.full_name[0]}
                </span>
                <span className="font-semibold text-slate-800 dark:text-neutral-200">{task.student.full_name}</span>
                <span className="text-slate-500 dark:text-neutral-400 font-mono text-[11px]">({task.student.group})</span>
              </div>
            )}

            <h2 className="text-xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight leading-snug">
              {assignment?.title.replace(/#[a-zA-Zа-яА-ЯёЁ0-9_-]+/g, '').trim()}
            </h2>

            {/* Теги */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {allTags.map((tag) => {
                  const style = getTagStyle(tag);
                  return (
                    <span
                      key={tag}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${style.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      <span>{tag}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#2a2a2a] rounded-xl transition-colors shrink-0"
            title="Закрыть панель (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Уведомления */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-sm font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Тело панели */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Блок 1: Описание с Markdown и интерактивным чеклистом */}
          <section className="bg-slate-50/70 dark:bg-[#252525]/40 border border-slate-200/80 dark:border-[#2a2a2a] rounded-2xl p-5">
            <h3 className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-3">
              Описание задания
            </h3>
            <div className="text-sm">
              <MarkdownViewer
                content={assignment?.description}
                onToggleTask={handleToggleTaskItem}
              />
            </div>
          </section>

          {/* Блок 2: Прикрепленные файлы преподавателя */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                Материалы преподавателя ({files.length})
              </h3>
            </div>

            {files.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3.5 bg-white dark:bg-[#242424]/80 border border-slate-200 dark:border-[#333333]/80 rounded-xl hover:border-slate-300 dark:hover:border-[#383838] transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0 mr-2">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-[#252525] flex items-center justify-center shrink-0">
                        {getFileIcon(file)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-neutral-100 truncate">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-neutral-500">{file.size}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
                        title="Просмотр"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <a
                        href={file.url}
                        download={file.name}
                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                        title="Скачать"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-neutral-500 italic">Прикрепленных файлов нет</p>
            )}
          </section>

          {/* Информационная подсказка для инфо-материалов */}
          {isInfoCard && (
            <div className="bg-slate-50 dark:bg-[#252525]/40 border border-slate-200/90 dark:border-[#333333] rounded-2xl p-4 text-xs text-slate-600 dark:text-neutral-300 flex items-center gap-3">
              <Info className="w-5 h-5 text-blue-500 shrink-0" />
              <span>Информационный материал для ознакомления. Срок сдачи, загрузка решений и оценивание не требуются.</span>
            </div>
          )}

          {/* Блоки сдачи и оценки (только для обычных заданий) */}
          {!isInfoCard && (
            <>
              {/* Блок 3: Сдача работы студентом */}
          <section className="bg-slate-50/70 dark:bg-[#252525]/40 border border-slate-200/80 dark:border-[#2a2a2a] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-600 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Сдача работы студентом</span>
              </h3>
              {task.submission_files && task.submission_files.length > 0 && (
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full">
                  Файлы загружены
                </span>
              )}
            </div>

            {/* Git репозиторий */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Ссылка на Git-репозиторий (GitHub / GitLab):
              </label>
              <div className="relative">
                <GitBranch className="w-4 h-4 text-slate-400 dark:text-neutral-500 absolute left-3 top-3" />
                <input
                  type="url"
                  placeholder="https://github.com/username/repository"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  disabled={isTeacher}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#333333] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-100 dark:disabled:bg-[#202020]/60 disabled:text-slate-500 dark:disabled:text-neutral-500 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500"
                />
              </div>
            </div>

            {/* Файлы отчета */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Файлы отчета и решений:
              </label>

              {submissionFiles.length > 0 && (
                <div className="space-y-2 mb-3">
                  {submissionFiles.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-2.5 bg-white dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#333333] rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 mr-2">
                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate font-medium text-slate-800 dark:text-neutral-200">{f.name}</span>
                        <span className="text-[11px] text-slate-400 dark:text-neutral-500">({f.size})</span>
                      </div>
                      {!isTeacher && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSubmissionFile(f.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!isTeacher && (
                <label className="border border-dashed border-slate-300 dark:border-[#333333] hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-[#1c1c1c]/60 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 rounded-xl p-3.5 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                  <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
                    Нажмите для загрузки файлов отчета
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">
                    PDF, ZIP, DOCX до 50 МБ
                  </span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Комментарий */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Комментарий студента к решению:
              </label>
              <textarea
                rows={2}
                placeholder="Опишите особенности реализации или возникшие вопросы..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isTeacher}
                className="w-full p-2.5 text-sm bg-white dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#333333] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-100 dark:disabled:bg-[#202020]/60 disabled:text-slate-500 dark:disabled:text-neutral-500 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500"
              />
            </div>

            {!isTeacher && (
              <button
                type="button"
                onClick={handleSubmitSolution}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-99 text-white font-semibold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Отправка...' : 'Сдать работу на проверку'}</span>
              </button>
            )}
          </section>

          {/* Блок 4: Проверка преподавателем */}
          <section className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Рецензия и оценка преподавателя</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Оценка (баллов из {assignment?.max_score || 100}):
              </label>
              <input
                type="number"
                min={0}
                max={assignment?.max_score || 100}
                placeholder="Например: 95"
                value={gradeScore}
                onChange={(e) => setGradeScore(e.target.value)}
                disabled={!isTeacher}
                className="w-36 px-3 py-2 text-sm font-bold bg-white dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#333333] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:bg-slate-100 dark:disabled:bg-[#202020]/60 disabled:text-slate-700 dark:disabled:text-neutral-500 dark:text-neutral-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Текст рецензии / замечания:
              </label>
              <textarea
                rows={3}
                placeholder={
                  isTeacher
                    ? 'Укажите замечания или рекомендации по улучшению работы...'
                    : 'Замечаний пока нет'
                }
                value={teacherComment}
                onChange={(e) => setTeacherComment(e.target.value)}
                disabled={!isTeacher}
                className="w-full p-2.5 text-sm bg-white dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#333333] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:bg-slate-100 dark:disabled:bg-[#202020]/60 disabled:text-slate-700 dark:disabled:text-neutral-500 dark:text-neutral-100 leading-relaxed placeholder-slate-400 dark:placeholder-neutral-500"
              />
            </div>

            {isTeacher && (
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleGrade('revision')}
                  disabled={isGrading}
                  className="flex-1 py-2.5 px-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>На доработку</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGrade('done')}
                  disabled={isGrading}
                  className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Зачесть / Принять</span>
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
      </aside>
    </>
  );
};
