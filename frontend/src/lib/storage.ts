import { Course, StudentTask, User, TaskStatus, Assignment, SubmissionFile, AppNotification } from '@/types';
import { INITIAL_COURSES, INITIAL_TASKS, DEFAULT_USERS, STUDENTS_LIST } from './mockData';
import { extractHashtags } from './tagUtils';

const STORAGE_KEY_TASKS = 'kanban_edu_tasks_v5';
const STORAGE_KEY_COURSES = 'kanban_edu_courses_v5';
const STORAGE_KEY_USER = 'kanban_edu_user_v5';
const STORAGE_KEY_COLUMNS = 'kanban_edu_column_order_v5';
const STORAGE_KEY_NOTIFICATIONS = 'kanban_edu_notifications_v5';

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    taskId: 'task-4',
    courseTitle: 'Операционные системы',
    taskTitle: 'Лабораторная работа №2: Межпроцессное взаимодействие IPC',
    status: 'revision',
    statusLabel: 'На доработке',
    score: 65,
    teacherName: 'Иванов Д.С.',
    teacherComment: 'Реализация через FIFO корректна, однако не обработаны сигналы прерывания SIGINT и SIGTERM. Исправьте утечку дескрипторов в дочернем процессе и перезалейте.',
    createdAt: '15 минут назад',
    isRead: false,
  },
  {
    id: 'notif-2',
    taskId: 'task-5',
    courseTitle: 'Операционные системы',
    taskTitle: 'Лабораторная работа №1: Знакомство со средой и GCC',
    status: 'done',
    statusLabel: 'Зачтено',
    score: 98,
    teacherName: 'Иванов Д.С.',
    teacherComment: 'Отличный структурированный Makefile и подробный отчет со скринами отладчика gdb. Зачтено без замечаний!',
    createdAt: 'Вчера, 16:40',
    isRead: false,
  },
  {
    id: 'notif-3',
    taskId: 'task-3',
    courseTitle: 'Операционные системы',
    taskTitle: 'Курсовой проект: Проектирование многопоточного диспетчера',
    status: 'in_progress',
    statusLabel: 'В работе',
    teacherName: 'Иванов Д.С.',
    teacherComment: 'Тема и техническое задание утверждены. Не забудьте синхронизировать очереди задач через мьютексы и условные переменные pthread_cond...',
    createdAt: '2 дня назад',
    isRead: true,
  },
];

export function getStoredNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return INITIAL_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    if (raw) {
      return JSON.parse(raw);
    } else {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
  } catch (e) {
    console.error('Ошибка чтения уведомлений:', e);
    return INITIAL_NOTIFICATIONS;
  }
}

export function setStoredNotifications(notifications: AppNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifications));
  } catch (e) {
    console.error('Ошибка сохранения уведомлений:', e);
  }
}

export function addStoredNotification(notif: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>): AppNotification {
  const current = getStoredNotifications();
  const newNotif: AppNotification = {
    ...notif,
    id: `notif-${Date.now()}`,
    createdAt: 'Только что',
    isRead: false,
  };
  const updated = [newNotif, ...current];
  setStoredNotifications(updated);
  return newNotif;
}

export function markStoredNotificationsAsRead(): AppNotification[] {
  const current = getStoredNotifications();
  const updated = current.map((n) => ({ ...n, isRead: true }));
  setStoredNotifications(updated);
  return updated;
}

export function markSingleStoredNotificationAsRead(id: string): AppNotification[] {
  const current = getStoredNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, isRead: true } : n));
  setStoredNotifications(updated);
  return updated;
}

/**
 * Получить текущего пользователя из хранилища
 */
export function getStoredUser(): User {
  if (typeof window === 'undefined') return DEFAULT_USERS.student;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Ошибка чтения пользователя:', e);
  }
  return DEFAULT_USERS.student;
}

/**
 * Сохранить текущего пользователя
 */
export function setStoredUser(user: User): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  } catch (e) {
    console.error('Ошибка сохранения пользователя:', e);
  }
}

/**
 * Получить список курсов с пересчетом активных несданных заданий
 */
export function getStoredCourses(): Course[] {
  if (typeof window === 'undefined') return INITIAL_COURSES;
  let courses = INITIAL_COURSES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COURSES);
    if (raw) {
      courses = JSON.parse(raw);
    } else {
      localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(INITIAL_COURSES));
    }
  } catch (e) {
    console.error('Ошибка чтения курсов:', e);
  }

  const tasks = getStoredTasks();
  return courses.map((course) => {
    const activeTasks = tasks.filter(
      (t) => t.assignment?.course_id === course.id && t.status !== 'done'
    );
    return {
      ...course,
      uncompletedCount: activeTasks.length,
    };
  });
}

/**
 * Сохранить курсы
 */
export function setStoredCourses(courses: Course[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(courses));
  } catch (e) {
    console.error('Ошибка сохранения курсов:', e);
  }
}

/**
 * Добавить новый курс
 */
export function addStoredCourse(data: {
  title: string;
  code: string;
  description?: string;
  color?: string;
  groups?: string[];
  teacher_id: string;
}): Course {
  const courses = getStoredCourses();
  const newCourse: Course = {
    id: `course-${Date.now()}`,
    title: data.title,
    code: data.code.toUpperCase(),
    description: data.description || '',
    teacher_id: data.teacher_id,
    color: data.color || 'indigo',
    groups: data.groups || ['ПО-41'],
    uncompletedCount: 0,
  };
  const updated = [newCourse, ...courses];
  setStoredCourses(updated);
  return newCourse;
}

/**
 * Обновить существующий курс (Название, код, цвет, группы, описание)
 */
export function updateStoredCourse(
  courseId: string,
  data: Partial<Course>
): Course | null {
  const courses = getStoredCourses();
  let updatedCourse: Course | null = null;
  const updated = courses.map((c) => {
    if (c.id === courseId) {
      updatedCourse = {
        ...c,
        ...data,
        code: data.code ? data.code.toUpperCase() : c.code,
      };
      return updatedCourse;
    }
    return c;
  });
  if (updatedCourse) {
    setStoredCourses(updated);
  }
  return updatedCourse;
}

/**
 * Удалить курс и связанные с ним задачи
 */
export function deleteStoredCourse(courseId: string): Course[] {
  const courses = getStoredCourses();
  const remaining = courses.filter((c) => c.id !== courseId);
  setStoredCourses(remaining);

  // Удаляем задачи этого курса
  const tasks = getStoredTasks();
  const filteredTasks = tasks.filter((t) => t.assignment?.course_id !== courseId);
  setStoredTasks(filteredTasks);

  return remaining;
}

/**
 * Получить все задачи из хранилища
 */
export function getStoredTasks(): StudentTask[] {
  if (typeof window === 'undefined') return INITIAL_TASKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TASKS);
    if (raw) {
      const parsed: StudentTask[] = JSON.parse(raw);
      return parsed.map((t) => {
        if (!t.student) {
          const found = STUDENTS_LIST.find((s) => s.id === t.student_id);
          if (found) {
            return {
              ...t,
              student: {
                id: found.id,
                full_name: found.full_name,
                group: found.group,
              },
            };
          }
        }
        return t;
      });
    } else {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(INITIAL_TASKS));
      return INITIAL_TASKS;
    }
  } catch (e) {
    console.error('Ошибка чтения задач:', e);
    return INITIAL_TASKS;
  }
}

/**
 * Сохранить задачи
 */
export function setStoredTasks(tasks: StudentTask[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Ошибка сохранения задач:', e);
  }
}

/**
 * Переместить задачу
 */
export function moveStoredTask(
  taskId: string,
  newStatus: TaskStatus,
  newPosition: number
): StudentTask[] {
  const tasks = getStoredTasks();
  const updated = tasks.map((t) => {
    if (t.id === taskId) {
      return {
        ...t,
        status: newStatus,
        position: newPosition,
        updated_at: new Date().toISOString(),
      };
    }
    return t;
  });
  setStoredTasks(updated);
  return updated;
}

/**
 * Обновить статус чеклиста
 */
export function toggleStoredChecklistItem(
  taskId: string,
  itemId: string
): StudentTask | null {
  const tasks = getStoredTasks();
  let updatedTask: StudentTask | null = null;
  const updated = tasks.map((t) => {
    if (t.id === taskId) {
      const checklist = (t.checklist || []).map((c) =>
        c.id === itemId ? { ...c, done: !c.done } : c
      );
      updatedTask = { ...t, checklist, updated_at: new Date().toISOString() };
      return updatedTask;
    }
    return t;
  });
  setStoredTasks(updated);
  return updatedTask;
}

/**
 * Сдать работу студентом
 */
export function submitStoredTask(
  taskId: string,
  comment?: string | null,
  repoUrl?: string | null,
  newFiles?: SubmissionFile[]
): StudentTask | null {
  const tasks = getStoredTasks();
  let updatedTask: StudentTask | null = null;
  const updated = tasks.map((t) => {
    if (t.id === taskId) {
      const existingFiles = t.submission_files || [];
      const combinedFiles = newFiles ? [...existingFiles, ...newFiles] : existingFiles;
      updatedTask = {
        ...t,
        status: 'on_review',
        comment: comment !== undefined ? comment : t.comment,
        repo_url: repoUrl !== undefined ? repoUrl : t.repo_url,
        submission_files: combinedFiles,
        updated_at: new Date().toISOString(),
      };
      return updatedTask;
    }
    return t;
  });
  setStoredTasks(updated);
  return updatedTask;
}

/**
 * Оценить работу преподавателем
 */
export function gradeStoredTask(
  taskId: string,
  score: number | null,
  teacherComment: string | null,
  status: TaskStatus
): StudentTask | null {
  const tasks = getStoredTasks();
  let updatedTask: StudentTask | null = null;
  const updated = tasks.map((t) => {
    if (t.id === taskId) {
      updatedTask = {
        ...t,
        score,
        teacher_comment: teacherComment,
        status,
        updated_at: new Date().toISOString(),
      };
      return updatedTask;
    }
    return t;
  });
  setStoredTasks(updated);
  return updatedTask;
}

/**
 * Создать новое задание
 */
export function createStoredAssignment(data: {
  course_id: string;
  title: string;
  description?: string;
  order?: number;
  max_score?: number;
  priority?: 'urgent' | 'normal' | 'info';
  deadline?: string | null;
  files?: { name: string; size: string; url: string; type?: any }[];
}): StudentTask {
  const tasks = getStoredTasks();
  const assignId = `assign-${Date.now()}`;
  const taskId = `task-${Date.now()}`;

  const tags = [
    ...extractHashtags(data.title),
    ...extractHashtags(data.description),
  ];

  const newAssignment: Assignment = {
    id: assignId,
    course_id: data.course_id,
    title: data.title,
    description: data.description || '',
    order: data.order || tasks.length + 1,
    max_score: data.max_score || 100,
    priority: data.priority || 'normal',
    deadline: data.deadline || null,
    tags: Array.from(new Set(tags)),
    files: (data.files || []).map((f, i) => ({
      id: `f-${Date.now()}-${i}`,
      name: f.name,
      size: f.size,
      url: f.url,
      type: f.type || 'pdf',
    })),
    created_at: new Date().toISOString(),
  };

  const newTask: StudentTask = {
    id: taskId,
    student_id: 'user-student-1',
    assignment_id: assignId,
    status: 'todo',
    position: 0,
    priority: data.priority || 'normal',
    deadline: data.deadline || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignment: newAssignment,
  };

  const updatedTasks = [newTask, ...tasks];
  setStoredTasks(updatedTasks);
  return newTask;
}

export function getStoredColumnOrder(): TaskStatus[] {
  if (typeof window === 'undefined') return ['todo', 'in_progress', 'on_review', 'revision', 'done'];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COLUMNS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Ошибка чтения порядка колонок:', e);
  }
  return ['todo', 'in_progress', 'on_review', 'revision', 'done'];
}

export function setStoredColumnOrder(order: TaskStatus[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_COLUMNS, JSON.stringify(order));
  } catch (e) {
    console.error('Ошибка сохранения порядка колонок:', e);
  }
}

export interface CourseUiPrefs {
  color?: string;
  code?: string;
}

export function getCoursePrefs(courseId: string): CourseUiPrefs | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`course_prefs_${courseId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCoursePrefs(courseId: string, prefs: CourseUiPrefs): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getCoursePrefs(courseId) || {};
    const updated = { ...current, ...prefs };
    localStorage.setItem(`course_prefs_${courseId}`, JSON.stringify(updated));
  } catch {}
}
