'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { User, Course, StudentTask, Assignment, AppNotification, ToastMessage, TaskStatus } from '@/types';
import {
  getCurrentUser,
  loginUser,
  getCourses,
  getMyTasksForCourse,
  getCourseTasksForTeacher,
  getCourseAssignments,
  updateCourse,
  deleteCourse,
  getCourseGroups,
  getGroupStudents,
  removeToken,
} from '@/lib/api';
import {
  getStoredNotifications,
  markStoredNotificationsAsRead,
  markSingleStoredNotificationAsRead,
  addStoredNotification,
  saveCoursePrefs,
} from '@/lib/storage';
import { extractHashtags } from '@/lib/tagUtils';
import { useCanvas } from '@/hooks/useCanvas';
import { useTheme } from '@/hooks/useTheme';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { KanbanBoard, isTaskInfo } from '@/components/KanbanBoard';
import { TaskDrawer } from '@/components/TaskDrawer';
import { AuthModal } from '@/components/AuthModal';
import { CreateCourseModal } from '@/components/CreateCourseModal';
import { CreateAssignmentModal } from '@/components/CreateAssignmentModal';
import { CourseSettingsModal } from '@/components/CourseSettingsModal';
import { ToastContainer } from '@/components/Toast';

const STATUS_LABELS: Record<TaskStatus, string> = {
  info: '«Информация»',
  todo: '«К выполнению»',
  in_progress: '«В работе»',
  on_review: '«На проверке»',
  revision: '«На доработке»',
  done: '«Сдано / Зачтено»',
};

export default function Home() {
  const { isDark, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [courseStudents, setCourseStudents] = useState<{ id: string; full_name: string; group: string }[]>([]);

  // Управление Task Drawer с сохранением состояния для плавной анимации входа и выхода
  const [drawerTask, setDrawerTask] = useState<StudentTask | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Поиск и фильтрация по тегам, группам и студентам
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Сайдбар и модальные окна
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  // Уведомления и всплывающие тосты
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Загрузка уведомлений при монтировании
  useEffect(() => {
    setNotifications(getStoredNotifications());
  }, []);

  const handleMarkAllAsRead = () => {
    const updated = markStoredNotificationsAsRead();
    setNotifications(updated);
  };

  const handleSelectNotification = (taskId?: string, notifId?: string) => {
    if (notifId) {
      const updated = markSingleStoredNotificationAsRead(notifId);
      setNotifications(updated);
    }
    if (taskId) {
      const targetTask = tasks.find((t) => t.id === taskId);
      if (targetTask) {
        if (targetTask.assignment && targetTask.assignment.course_id !== selectedCourseId) {
          setSelectedCourseId(targetTask.assignment.course_id);
        }
        setDrawerTask(targetTask);
        setIsDrawerOpen(true);
      }
    }
  };

  // Перемещение карточки между колонками -> всплывающее уведомление
  const handleCardMoved = (
    task: StudentTask,
    oldStatus: TaskStatus,
    newStatus: TaskStatus
  ) => {
    const title =
      task.assignment?.title.replace(/#[a-zA-Zа-яА-ЯёЁ0-9_-]+/g, '').trim() ||
      'Задание';
    addToast({
      title: title,
      description: `Статус изменен: ${STATUS_LABELS[newStatus]}`,
      status: newStatus,
    });
  };

  // Действие преподавателя (оценка / отправка на доработку) -> уведомление и тост
  const handleTeacherAction = (data: {
    taskId: string;
    taskTitle: string;
    status: TaskStatus;
    score?: number | null;
    teacherComment?: string | null;
  }) => {
    addStoredNotification({
      taskId: data.taskId,
      courseTitle: selectedCourse?.title,
      taskTitle: data.taskTitle,
      status: data.status,
      statusLabel: STATUS_LABELS[data.status],
      score: data.score,
      teacherName: currentUser?.full_name || 'Преподаватель',
      teacherComment: data.teacherComment,
    });
    setNotifications(getStoredNotifications());
    addToast({
      title: data.taskTitle,
      description:
        data.status === 'done'
          ? `Зачтено! Оценка: ${data.score !== null ? data.score + ' б.' : 'Зачет'}`
          : data.status === 'revision'
          ? 'Работа отправлена на доработку'
          : `Статус изменен на ${STATUS_LABELS[data.status]}`,
      status: data.status,
    });
  };

  // Сдача работы студентом -> тост
  const handleStudentSubmitted = (task: StudentTask) => {
    const title =
      task.assignment?.title.replace(/#[a-zA-Zа-яА-ЯёЁ0-9_-]+/g, '').trim() ||
      'Задание';
    addToast({
      title: title,
      description: 'Работа успешно отправлена на проверку преподавателю',
      status: 'on_review',
      type: 'success',
    });
  };

  // Интерактивный 2D Холст (Kaiten Pan & Zoom)
  const {
    transform,
    setTransform,
    isPanning,
    isSpacePressed,
    isHandToolActive,
    setIsHandToolActive,
    zoomIn,
    zoomOut,
    resetView,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useCanvas({
    minScale: 0.4,
    maxScale: 2.0,
    initialScale: 1.0,
  });

  const isTeacher = currentUser?.role === 'teacher' || currentUser?.role === 'admin';

  const loadCourses = useCallback(async (user?: User | null) => {
    try {
      const courseList = await getCourses();
      setCourses(courseList);
      if (courseList.length > 0) {
        setSelectedCourseId((prev) => {
          if (prev && courseList.some((c) => c.id === prev)) return prev;
          return courseList[0].id;
        });
      } else {
        setSelectedCourseId(null);
      }
    } catch (err) {
      console.error('Ошибка загрузки дисциплин из БД:', err);
      setCourses([]);
      setSelectedCourseId(null);
    }
  }, []);

  // Инициализация приложения: авторизация в реальном FastAPI бэкенде
  useEffect(() => {
    const initApp = async () => {
      try {
        let user = await getCurrentUser();
        if (!user) {
          // Если токена нет, входим под студентом по умолчанию из БД
          try {
            const loginRes = await loginUser('user@togu.dv', 'password');
            user = loginRes.user || await getCurrentUser();
          } catch {
            setIsAuthModalOpen(true);
            setLoading(false);
            return;
          }
        }
        setCurrentUser(user);
        await loadCourses(user);
      } catch (err) {
        console.error('Ошибка инициализации приложения:', err);
        setIsAuthModalOpen(true);
      } finally {
        setTimeout(() => setLoading(false), 200);
      }
    };

    initApp();
  }, [loadCourses]);

  // Загрузка задач, групп и студентов для выбранного курса
  const refreshTasks = useCallback(async (courseId: string, user: User | null) => {
    try {
      const teacherRole = user?.role === 'teacher' || user?.role === 'admin';

      // 1. Загрузка групп и студентов из БД
      let students: { id: string; full_name: string; group: string }[] = [];
      try {
        const groups = await getCourseGroups(courseId);
        const groupStudentPromises = groups.map(async (g) => {
          const list = await getGroupStudents(g.id);
          return list.map((s) => ({
            id: s.id,
            full_name: s.full_name,
            group: g.name,
          }));
        });
        const nested = await Promise.all(groupStudentPromises);
        students = nested.flat();
        setCourseStudents(students);
      } catch (err) {
        console.warn('Не удалось загрузить группы курса:', err);
      }

      // 2. Загрузка задач и заданий курса
      const [rawTasks, assignments] = await Promise.all([
        teacherRole
          ? getCourseTasksForTeacher(courseId)
          : getMyTasksForCourse(courseId),
        getCourseAssignments(courseId).catch(() => [] as Assignment[]),
      ]);

      const assignmentMap = new Map<string, Assignment>();
      assignments.forEach((a) => assignmentMap.set(a.id, a));

      const studentMap = new Map<string, { id: string; full_name: string; group: string }>();
      students.forEach((s) => studentMap.set(s.id, s));

      let bookmarkedIds: string[] = [];
      try {
        bookmarkedIds = JSON.parse(localStorage.getItem('kanban_bookmarked_ids') || '[]');
      } catch {}

      const enrichedTasks = rawTasks.map((t) => {
        const asgn = assignmentMap.get(t.assignment_id) || t.assignment;
        const isBookmarked = bookmarkedIds.includes(t.assignment_id) || bookmarkedIds.includes(t.id);
        let finalAsgn = asgn;
        if (asgn && isBookmarked) {
          const currentTags = asgn.tags || [];
          if (!currentTags.some((tag) => tag.toLowerCase() === '#закладки')) {
            finalAsgn = {
              ...asgn,
              tags: [...currentTags, '#закладки'],
            };
          }
        }

        return {
          ...t,
          assignment: finalAsgn,
          student: studentMap.get(t.student_id) || (user && user.id === t.student_id ? {
            id: user.id,
            full_name: user.full_name,
            group: user.group || 'ПО-41',
          } : undefined),
        };
      });

      setTasks(enrichedTasks);

      // Обновляем открытую карточку без вызова бесконечного цикла
      setDrawerTask((prev) => {
        if (!prev) return null;
        const found = enrichedTasks.find((t) => t.id === prev.id);
        return found || prev;
      });
    } catch (err) {
      console.error('Ошибка загрузки задач из БД:', err);
    }
  }, []);

  useEffect(() => {
    if (!selectedCourseId || !currentUser) return;
    refreshTasks(selectedCourseId, currentUser);
  }, [selectedCourseId, currentUser?.id, currentUser?.role, refreshTasks]);

  const filteredStudents = useMemo(() => {
    if (!selectedGroup) return courseStudents;
    return courseStudents.filter((s) => s.group === selectedGroup);
  }, [courseStudents, selectedGroup]);

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach((t) => {
      if (t.assignment) {
        (t.assignment.tags || []).forEach((tag) => tagSet.add(tag.toLowerCase()));
        extractHashtags(t.assignment.title).forEach((tag) => tagSet.add(tag.toLowerCase()));
      }
    });
    return Array.from(tagSet);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const seenTodoAssignmentIds = new Set<string>();

    return tasks.filter((t) => {
      // 1. Фильтрация по роли
      if (!isTeacher) {
        // Студент видит свои задачи
        if (currentUser && t.student_id !== currentUser.id) return false;
      } else {
        // Преподаватель:
        // В колонке "todo" и "info" показываем по одной карточке на задание (пул заданий курса)
        if (t.status === 'todo' || isTaskInfo(t)) {
          if (seenTodoAssignmentIds.has(t.assignment_id)) {
            return false;
          }
          seenTodoAssignmentIds.add(t.assignment_id);
        } else {
          // В колонках проверок ("on_review", "revision", "done"):
          // Фильтр по студенту
          if (selectedStudentId && t.student_id !== selectedStudentId) {
            return false;
          }
          // Фильтр по группе
          if (selectedGroup && t.student?.group && t.student.group !== selectedGroup) {
            return false;
          }
        }
      }

      const assignment = t.assignment;
      if (!assignment) return true;

      // 2. Быстрый поиск
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = assignment.title.toLowerCase().includes(query);
        const descMatch = (assignment.description || '').toLowerCase().includes(query);
        const studentMatch = (t.student?.full_name || '').toLowerCase().includes(query);
        const groupMatch = (t.student?.group || '').toLowerCase().includes(query);
        const tagMatch = (assignment.tags || []).some((tg) =>
          tg.toLowerCase().includes(query)
        );
        if (!titleMatch && !descMatch && !tagMatch && !studentMatch && !groupMatch) return false;
      }

      // 3. Фильтр по тегам
      if (selectedTag) {
        const allCardTags = [
          ...(assignment.tags || []).map((tg) => tg.toLowerCase()),
          ...extractHashtags(assignment.title),
        ];
        const hasTag = allCardTags.some(
          (tg) => tg.toLowerCase() === selectedTag.toLowerCase()
        );
        if (!hasTag) return false;
      }

      return true;
    });
  }, [tasks, searchQuery, selectedTag, isTeacher, currentUser, selectedGroup, selectedStudentId]);

  // Плавное открытие карточки
  const handleCardClick = (task: StudentTask) => {
    setDrawerTask(task);
    setIsDrawerOpen(true);
  };

  // Плавное закрытие карточки (с ожиданием анимации выхода)
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setDrawerTask(null);
    }, 350);
  };

  const handleLogout = () => {
    removeToken();
    setCurrentUser(null);
    setTasks([]);
    setCourses([]);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = async (user: User) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    await loadCourses(user);
  };

  const handleSwitchRole = async (newRole: 'student' | 'teacher') => {
    try {
      setLoading(true);
      handleCloseDrawer();
      if (newRole === 'teacher') {
        await loginUser('teacher@mail.com', 'password');
      } else {
        await loginUser('user@togu.dv', 'password');
      }
      const user = await getCurrentUser();
      setCurrentUser(user);
      setSelectedGroup(null);
      setSelectedStudentId(null);
      await loadCourses(user);
    } catch (err) {
      console.error('Ошибка смены роли:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdated = (updatedTask: StudentTask) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    setDrawerTask(updatedTask);
  };

  const handleTasksChange = (updatedTasks: StudentTask[]) => {
    setTasks((prev) => {
      const updatedMap = new Map(updatedTasks.map((t) => [t.id, t]));
      return prev.map((t) => updatedMap.get(t.id) || t);
    });
  };

  const handleSaveCourseSettings = async (updatedCourse: Course) => {
    if (!isTeacher) return;
    try {
      saveCoursePrefs(updatedCourse.id, {
        color: updatedCourse.color,
        code: updatedCourse.code,
      });

      // Мгновенное обновление стейта в интерфейсе
      setCourses((prev) =>
        prev.map((c) =>
          c.id === updatedCourse.id
            ? {
                ...c,
                title: updatedCourse.title,
                description: updatedCourse.description,
                color: updatedCourse.color,
                code: updatedCourse.code,
              }
            : c
        )
      );

      await updateCourse(updatedCourse.id, {
        title: updatedCourse.title,
        description: updatedCourse.description || undefined,
        color: updatedCourse.color,
        code: updatedCourse.code,
      });
      await loadCourses(currentUser);
      setEditingCourse(null);
    } catch (err) {
      console.error('Ошибка сохранения настроек дисциплины:', err);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!isTeacher) {
      alert('Удаление дисциплин разрешено только преподавателям.');
      return;
    }
    try {
      await deleteCourse(courseId);
      const remaining = await getCourses();
      setCourses(remaining);
      if (selectedCourseId === courseId) {
        setSelectedCourseId(remaining.length > 0 ? remaining[0].id : null);
      }
      setEditingCourse(null);
    } catch (err) {
      console.error('Ошибка удаления дисциплины:', err);
    }
  };

  const handleToggleBookmark = useCallback((task: StudentTask) => {
    const taskId = task.id;
    const assignmentId = task.assignment_id;

    setTasks((prev) =>
      prev.map((t) => {
        const isTarget = t.id === taskId || (assignmentId && t.assignment_id === assignmentId);
        if (!isTarget) return t;

        const currentTags = t.assignment?.tags || [];
        const rawTags = [
          ...currentTags,
          ...extractHashtags(t.assignment?.title || ''),
          ...extractHashtags(t.assignment?.description || ''),
        ].map((tag) => tag.toLowerCase());

        const isCurrentlyBookmarked = rawTags.includes('#закладки');

        let newTags: string[];
        let newTitle = t.assignment?.title || '';

        if (isCurrentlyBookmarked) {
          newTags = currentTags.filter((tag) => tag.toLowerCase() !== '#закладки');
          newTitle = newTitle.replace(/#закладки\b/gi, '').trim();
        } else {
          newTags = [...currentTags.filter((tag) => tag.toLowerCase() !== '#закладки'), '#закладки'];
        }

        return {
          ...t,
          assignment: t.assignment
            ? {
                ...t.assignment,
                tags: newTags,
                title: newTitle,
              }
            : undefined,
        };
      })
    );

    try {
      const stored: string[] = JSON.parse(localStorage.getItem('kanban_bookmarked_ids') || '[]');
      const idToStore = assignmentId || taskId;
      const index = stored.indexOf(idToStore);
      if (index !== -1) {
        stored.splice(index, 1);
      } else {
        stored.push(idToStore);
      }
      localStorage.setItem('kanban_bookmarked_ids', JSON.stringify(stored));
    } catch (e) {
      console.warn('Не удалось сохранить закладку:', e);
    }
  }, []);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-[#181818] font-sans antialiased text-slate-800 dark:text-neutral-100">
        <div className="h-16 bg-white dark:bg-[#181818] border-b border-slate-200 dark:border-[#2a2a2a] animate-pulse px-6" />
        <div className="flex-1 w-full max-w-[1920px] mx-auto p-5 flex gap-5 h-[calc(100vh-64px)]">
          <div className="w-76 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-[#2a2a2a] animate-pulse" />
          <div className="flex-1 flex gap-5 bg-slate-50 dark:bg-[#1e1e1e] rounded-2xl border border-slate-200 dark:border-[#2a2a2a] p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-[330px] bg-slate-200/60 dark:bg-[#252525] rounded-2xl animate-pulse shrink-0 h-full"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 dark:bg-[#181818] font-sans antialiased text-slate-800 dark:text-neutral-100 select-none overflow-hidden">
      {/* 1. Верхняя панель (Header) */}
      <Header
        user={currentUser}
        selectedCourse={selectedCourse}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
        availableTags={availableTags}
        canvasTransform={transform}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetView}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        onOpenCourseSettings={() => setEditingCourse(selectedCourse)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllAsRead}
        onSelectNotification={handleSelectNotification}
        selectedGroup={selectedGroup}
        onSelectGroup={(g) => {
          setSelectedGroup(g);
          setSelectedStudentId(null);
        }}
        selectedStudentId={selectedStudentId}
        onSelectStudent={setSelectedStudentId}
        students={filteredStudents}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* 2. Основное рабочее пространство */}
      <div className="flex-1 w-full max-w-[1920px] mx-auto p-3.5 md:p-4.5 flex gap-4 overflow-hidden h-[calc(100vh-64px)]">
        {/* Левый сайдбар со списком дисциплин */}
        <Sidebar
          courses={courses}
          selectedCourseId={selectedCourseId}
          onSelectCourse={(id) => {
            setSelectedCourseId(id);
            handleCloseDrawer();
            resetView();
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          user={currentUser}
          onOpenCreateCourse={() => setIsCreateCourseOpen(true)}
          onOpenCourseSettings={(course) => setEditingCourse(course)}
        />

        {/* Центральная зона: 2D Холст Канбана */}
        <main className="flex-1 flex flex-col overflow-hidden relative rounded-2xl">
          <KanbanBoard
            tasks={filteredTasks}
            onTasksChange={handleTasksChange}
            onCardClick={handleCardClick}
            onTagClick={(tag) => setSelectedTag(tag === selectedTag ? null : tag)}
            onToggleBookmark={handleToggleBookmark}
            currentUser={currentUser}
            courseTitle={selectedCourse?.title || ''}
            onOpenCreateAssignment={() => setIsCreateAssignmentOpen(true)}
            transform={transform}
            setTransform={setTransform}
            isPanning={isPanning}
            isSpacePressed={isSpacePressed}
            isHandToolActive={isHandToolActive}
            setIsHandToolActive={setIsHandToolActive}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onCardMoved={handleCardMoved}
          />

          {/* 
            ПЛАВНО ВЫЕЗЖАЮЩИЙ И УЕЗЖАЮЩИЙ TASK DRAWER:
            Блюрит ТОЛЬКО холст (сайдбар остается чистым), 
            плавно выезжает справа и задвигается обратно без мгновенных исчезновений 
          */}
          <TaskDrawer
            task={drawerTask}
            isOpen={isDrawerOpen}
            currentUser={currentUser}
            onClose={handleCloseDrawer}
            onTaskUpdated={handleTaskUpdated}
            onTeacherAction={handleTeacherAction}
            onStudentSubmitted={handleStudentSubmitted}
          />
        </main>
      </div>

      {/* Модальное окно настроек дисциплины */}
      <CourseSettingsModal
        isOpen={!!editingCourse}
        course={editingCourse}
        currentUser={currentUser}
        onClose={() => setEditingCourse(null)}
        onSave={handleSaveCourseSettings}
        onDelete={handleDeleteCourse}
      />

      {/* Модальное окно авторизации и регистрации */}
      <AuthModal isOpen={isAuthModalOpen} onSuccess={handleAuthSuccess} />

      {/* Модальное окно создания дисциплины */}
      <CreateCourseModal
        isOpen={isCreateCourseOpen}
        onClose={() => setIsCreateCourseOpen(false)}
        onCourseCreated={async (newCourse) => {
          const list = await getCourses();
          setCourses(list);
          setSelectedCourseId(newCourse.id);
        }}
      />

      {/* Модальное окно создания задания */}
      {selectedCourseId && (
        <CreateAssignmentModal
          isOpen={isCreateAssignmentOpen}
          courseId={selectedCourseId}
          onClose={() => setIsCreateAssignmentOpen(false)}
          onAssignmentCreated={async () => {
            if (selectedCourseId && currentUser) {
              await refreshTasks(selectedCourseId, currentUser);
            }
          }}
        />
      )}

      {/* Всплывающие системные уведомления (Toasts) */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
