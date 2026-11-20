import { User, Course, Assignment, StudentTask, TaskStatus, UserRole } from '@/types';
import { getCoursePrefs, saveCoursePrefs } from './storage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export function getFullFileUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) return path;
  if (path.startsWith('/files/')) return path;
  return `${BACKEND_URL}${path}`;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token);
  }
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Ошибка запроса к серверу';
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail || `HTTP error ${response.status}`);
  }

  return response.json();
}

// 1. Авторизация (100% FastAPI Backend)
export async function loginUser(email: string, password: string): Promise<{ access_token: string; token_type: string; user?: User }> {
  const formData = new URLSearchParams();
  formData.append('username', email.trim());
  formData.append('password', password);

  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Неверный логин или пароль');
  }

  const data = await res.json();
  setToken(data.access_token);
  
  const user = await getCurrentUser();
  return { ...data, user };
}

export async function registerUser(email: string, fullName: string, password: string, role: UserRole): Promise<User> {
  const user = await request<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      full_name: fullName,
      password,
      role,
    }),
  });
  
  // Автологин после регистрации
  await loginUser(email, password);
  return user;
}

export async function getCurrentUser(): Promise<User | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const user = await request<User>('/auth/me');
    return user;
  } catch (err) {
    console.warn('Не удалось получить текущего пользователя:', err);
    removeToken();
    return null;
  }
}

// 2. Дисциплины (Курсы) из PostgreSQL
export async function getCourses(): Promise<Course[]> {
  const rawCourses = await request<any[]>('/courses/');

  // Обогащаем курсы привязанными учебными группами и сохраненными визуальными настройками
  const enriched = await Promise.all(
    rawCourses.map(async (c) => {
      let groups: string[] = [];
      try {
        const groupList = await request<any[]>(`/courses/${c.id}/groups`);
        groups = groupList.map((g) => g.name);
      } catch {
        // если групп нет
      }
      const prefs = getCoursePrefs(c.id);
      return {
        id: c.id,
        title: c.title,
        code: prefs?.code || c.code || c.title.slice(0, 2).toUpperCase(),
        description: c.description,
        teacher_id: c.teacher_id,
        color: prefs?.color || c.color || 'indigo',
        groups: groups.length > 0 ? groups : ['ПО-41'],
      };
    })
  );

  return enriched;
}

export async function createCourse(data: {
  title: string;
  description?: string;
  code?: string;
  color?: string;
}): Promise<Course> {
  const res = await request<any>('/courses/', {
    method: 'POST',
    body: JSON.stringify({
      title: data.title,
      description: data.description || '',
    }),
  });

  if (data.color || data.code) {
    saveCoursePrefs(res.id, { color: data.color, code: data.code });
  }

  return {
    id: res.id,
    title: res.title,
    code: data.code || res.title.slice(0, 2).toUpperCase(),
    description: res.description,
    teacher_id: res.teacher_id,
    color: data.color || 'indigo',
    groups: ['ПО-41'],
  };
}

export async function updateCourse(
  courseId: string,
  data: { title?: string; description?: string; color?: string; code?: string }
): Promise<Course> {
  const updateBody: { title?: string; description?: string } = {};
  if (data.title !== undefined) updateBody.title = data.title;
  if (data.description !== undefined) updateBody.description = data.description;

  const res = await request<any>(`/courses/${courseId}`, {
    method: 'PATCH',
    body: JSON.stringify(updateBody),
  });

  if (data.color || data.code) {
    saveCoursePrefs(courseId, { color: data.color, code: data.code });
  }
  const prefs = getCoursePrefs(courseId);

  return {
    id: res.id,
    title: res.title,
    code: data.code || prefs?.code || res.title.slice(0, 2).toUpperCase(),
    description: res.description,
    teacher_id: res.teacher_id,
    color: data.color || prefs?.color || 'indigo',
    groups: ['ПО-41'],
  };
}

export async function deleteCourse(courseId: string): Promise<void> {
  await request<void>(`/courses/${courseId}`, {
    method: 'DELETE',
  });
}

// 3. Задания (Assignments) из PostgreSQL
export async function getCourseAssignments(courseId: string): Promise<Assignment[]> {
  const assignments = await request<Assignment[]>(`/assignments/course/${courseId}`);
  return assignments;
}

export async function createAssignment(data: {
  course_id: string;
  title: string;
  description?: string;
  order?: number;
  max_score?: number;
  priority?: any;
  deadline?: any;
  files?: any;
}): Promise<Assignment> {
  const res = await request<Assignment>('/assignments/', {
    method: 'POST',
    body: JSON.stringify({
      course_id: data.course_id,
      title: data.title,
      description: data.description || '',
      order: data.order || 1,
      max_score: data.max_score || 100,
    }),
  });
  return res;
}

// 4. Задачи Kanban из PostgreSQL
export async function getMyTasksForCourse(courseId: string): Promise<StudentTask[]> {
  const tasks = await request<StudentTask[]>(`/tasks/course/${courseId}`);
  return tasks;
}

export async function getCourseTasksForTeacher(courseId: string): Promise<StudentTask[]> {
  const tasks = await request<StudentTask[]>(`/tasks/course/${courseId}/all`);
  return tasks;
}

export async function moveTask(taskId: string, status: TaskStatus, position: number): Promise<StudentTask> {
  const res = await request<StudentTask>(`/tasks/${taskId}/move`, {
    method: 'PATCH',
    body: JSON.stringify({ status, position }),
  });
  return res;
}

export async function submitTask(
  taskId: string,
  comment?: string,
  fileUrl?: string,
  repoUrl?: string
): Promise<StudentTask> {
  const res = await request<StudentTask>(`/tasks/${taskId}/submit`, {
    method: 'PATCH',
    body: JSON.stringify({
      comment: comment || null,
      file_url: fileUrl || repoUrl || null,
    }),
  });
  return res;
}

export async function gradeTask(
  taskId: string,
  score: number | null,
  teacherComment: string | null,
  status: TaskStatus
): Promise<StudentTask> {
  const res = await request<StudentTask>(`/tasks/${taskId}/grade`, {
    method: 'PATCH',
    body: JSON.stringify({
      score,
      teacher_comment: teacherComment || null,
      status,
    }),
  });
  return res;
}

export async function uploadTaskFile(taskId: string, file: File): Promise<StudentTask> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await request<StudentTask>(`/tasks/${taskId}/upload`, {
    method: 'POST',
    body: formData,
  });
  return res;
}

// 5. Учебные группы и студенты из PostgreSQL
export async function getCourseGroups(courseId: string): Promise<{ id: string; name: string }[]> {
  return request<{ id: string; name: string }[]>(`/courses/${courseId}/groups`);
}

export async function getGroupStudents(groupId: string): Promise<User[]> {
  return request<User[]>(`/groups/${groupId}/students`);
}

export async function getAllGroups(): Promise<{ id: string; name: string }[]> {
  return request<{ id: string; name: string }[]>('/groups/');
}
