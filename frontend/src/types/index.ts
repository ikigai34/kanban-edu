export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  avatar?: string;
  group?: string; // e.g. "ПО-41"
}

export interface AttachmentFile {
  id: string;
  name: string;
  size: string;
  url: string;
  type?: 'pdf' | 'zip' | 'code' | 'doc' | 'image' | 'other';
}

export type TaskPriority = 'urgent' | 'normal' | 'info';

export type TaskStatus = 'info' | 'todo' | 'in_progress' | 'on_review' | 'revision' | 'done';

export interface Course {
  id: string;
  title: string;
  code: string; // e.g. "ВМ", "ОС", "БД"
  description?: string | null;
  teacher_id: string;
  color?: string; // e.g. "indigo", "emerald", "blue", "purple", "amber", "rose"
  uncompletedCount?: number;
  groups?: string[]; // e.g. ['ПО-41', 'ПО-42']
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description?: string | null;
  file_url?: string | null;
  files?: AttachmentFile[];
  order: number;
  max_score?: number | null;
  priority?: TaskPriority;
  deadline?: string | null;
  tags?: string[];
  created_at: string;
}

export interface SubmissionFile {
  id: string;
  name: string;
  size: string;
  url: string;
  uploaded_at: string;
}

export interface StudentTask {
  id: string;
  student_id: string;
  assignment_id: string;
  status: TaskStatus;
  position: number;
  comment?: string | null;
  file_url?: string | null;
  submission_files?: SubmissionFile[];
  repo_url?: string | null; // GitHub or Git repository link
  score?: number | null;
  teacher_comment?: string | null;
  priority?: TaskPriority;
  deadline?: string | null;
  checklist?: { id: string; text: string; done: boolean }[];
  created_at: string;
  updated_at: string;
  assignment?: Assignment;
  student?: {
    id: string;
    full_name: string;
    group: string;
    avatar?: string;
  };
}

export interface ColumnDefinition {
  id: TaskStatus;
  title: string;
  accentColor: string;
  headerBg: string;
  headerText: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
}

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

export interface AppNotification {
  id: string;
  taskId?: string;
  courseTitle?: string;
  taskTitle: string;
  status: TaskStatus;
  statusLabel?: string;
  score?: number | null;
  teacherName?: string;
  teacherComment?: string | null;
  createdAt: string;
  isRead: boolean;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  status?: TaskStatus;
}
