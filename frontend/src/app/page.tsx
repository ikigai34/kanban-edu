'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { User, Course, StudentTask, Assignment } from '@/types';
import {
  getCurrentUser,
  getCourses,
  getMyTasksForCourse,
  getCourseTasksForTeacher,
  getCourseAssignments,
  removeToken,
  setToken,
} from '@/lib/api';
import {
  getStoredUser,
  setStoredUser,
  getStoredCourses,
  getStoredTasks,
  setStoredTasks,
  updateStoredCourse,
  deleteStoredCourse,
} from '@/lib/storage';
import { DEFAULT_USERS } from '@/lib/mockData';
import { extractHashtags } from '@/lib/tagUtils';
import { useCanvas } from '@/hooks/useCanvas';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TaskDrawer } from '@/components/TaskDrawer';
import { AuthModal } from '@/components/AuthModal';
import { CreateCourseModal } from '@/components/CreateCourseModal';
import { CreateAssignmentModal } from '@/components/CreateAssignmentModal';
import { CourseSettingsModal } from '@/components/CourseSettingsModal';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const [tasks, setTasks] = useState<StudentTask[]>([]);
  
  // Управление Task Drawer с сохранением состояния для плавной анимации входа и выхода
  const [drawerTask, setDrawerTask] = useState<StudentTask | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Поиск и фильтрация по тегам
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Сайдбар и модальные окна
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const initApp = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user || DEFAULT_USERS.student);
        await loadCourses(user || DEFAULT_USERS.student);
      } catch (err) {
        console.error('Ошибка инициализации:', err);
        const fallbackUser = getStoredUser();
        setCurrentUser(fallbackUser);
        await loadCourses(fallbackUser);
      } finally {
        setTimeout(() => setLoading(false), 200);
      }
    };

    initApp();
  }, []);

  const loadCourses = async (user?: User | null) => {
    try {
      const courseList = await getCourses();
      setCourses(courseList);
      if (courseList.length > 0 && !selectedCourseId) {
        setSelectedCourseId(courseList[0].id);
      }
    } catch (err) {
      console.error('Ошибка загрузки дисциплин:', err);
      const fallbackCourses = getStoredCourses();
      setCourses(fallbackCourses);
      if (fallbackCourses.length > 0 && !selectedCourseId) {
        setSelectedCourseId(fallbackCourses[0].id);
      }
    }
  };

  useEffect(() => {
    if (!selectedCourseId) return;

    const loadTasks = async () => {
      try {
        const [rawTasks, assignments] = await Promise.all([
          isTeacher
            ? getCourseTasksForTeacher(selectedCourseId)
            : getMyTasksForCourse(selectedCourseId),
          getCourseAssignments(selectedCourseId).catch(() => [] as Assignment[]),
        ]);

        const assignmentMap = new Map<string, Assignment>();
        assignments.forEach((a) => assignmentMap.set(a.id, a));

        const enrichedTasks = rawTasks.map((t) => ({
          ...t,
          assignment: assignmentMap.get(t.assignment_id) || t.assignment,
        }));

        setTasks(enrichedTasks);

        if (drawerTask) {
          const updated = enrichedTasks.find((t) => t.id === drawerTask.id);
          if (updated) setDrawerTask(updated);
        }
      } catch (err) {
        console.error('Ошибка загрузки задач:', err);
        const allStored = getStoredTasks();
        const courseTasks = allStored.filter(
          (t) => t.assignment?.course_id === selectedCourseId
        );
        setTasks(courseTasks);
      }
    };

    loadTasks();
  }, [selectedCourseId, currentUser, isTeacher]);

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach((t) => {
      if (t.assignment) {
        (t.assignment.tags || []).forEach((tag) => tagSet.add(tag));
        extractHashtags(t.assignment.title).forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const assignment = t.assignment;
      if (!assignment) return true;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = assignment.title.toLowerCase().includes(query);
        const descMatch = (assignment.description || '').toLowerCase().includes(query);
        const tagMatch = (assignment.tags || []).some((tg) =>
          tg.toLowerCase().includes(query)
        );
        if (!titleMatch && !descMatch && !tagMatch) return false;
      }

      if (selectedTag) {
        const allCardTags = [
          ...(assignment.tags || []),
          ...extractHashtags(assignment.title),
        ];
        const hasTag = allCardTags.some(
          (tg) => tg.toLowerCase() === selectedTag.toLowerCase()
        );
        if (!hasTag) return false;
      }

      return true;
    });
  }, [tasks, searchQuery, selectedTag]);

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
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = async (user: User) => {
    setCurrentUser(user);
    setStoredUser(user);
    setIsAuthModalOpen(false);
    await loadCourses(user);
  };

  const handleSwitchRole = (newRole: 'student' | 'teacher') => {
    const updatedUser = newRole === 'teacher' ? DEFAULT_USERS.teacher : DEFAULT_USERS.student;
    setCurrentUser(updatedUser);
    setStoredUser(updatedUser);
    setToken(newRole === 'teacher' ? 'demo-teacher-token' : 'demo-student-token');
  };

  const handleTaskUpdated = (updatedTask: StudentTask) => {
    const updatedList = tasks.map((t) =>
      t.id === updatedTask.id ? updatedTask : t
    );
    setTasks(updatedList);
    setStoredTasks(
      getStoredTasks().map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    setDrawerTask(updatedTask);
    setCourses(getStoredCourses());
  };

  const handleTasksChange = (updatedTasks: StudentTask[]) => {
    setTasks(updatedTasks);
    const allTasks = getStoredTasks();
    const taskMap = new Map(updatedTasks.map((t) => [t.id, t]));
    const merged = allTasks.map((t) => (taskMap.has(t.id) ? taskMap.get(t.id)! : t));
    setStoredTasks(merged);
    setCourses(getStoredCourses());
  };

  const handleSaveCourseSettings = (updatedCourse: Course) => {
    if (!isTeacher) return;
    updateStoredCourse(updatedCourse.id, updatedCourse);
    setCourses(getStoredCourses());
  };

  const handleDeleteCourse = (courseId: string) => {
    if (!isTeacher) {
      alert('Удаление дисциплин разрешено только преподавателям.');
      return;
    }
    const remaining = deleteStoredCourse(courseId);
    setCourses(remaining);
    if (selectedCourseId === courseId) {
      setSelectedCourseId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100 font-sans antialiased text-slate-800">
        <div className="h-16 bg-white border-b border-slate-200 animate-pulse px-6" />
        <div className="flex-1 w-full max-w-[1920px] mx-auto p-5 flex gap-5 h-[calc(100vh-64px)]">
          <div className="w-76 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          <div className="flex-1 flex gap-5 bg-slate-50 rounded-2xl border border-slate-200 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-[330px] bg-slate-200/60 rounded-2xl animate-pulse shrink-0 h-full"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 font-sans antialiased text-slate-800 select-none overflow-hidden">
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
        onOpenCourseSettings={isTeacher ? () => setEditingCourse(selectedCourse) : undefined}
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
          onOpenCourseSettings={isTeacher ? (course) => setEditingCourse(course) : undefined}
        />

        {/* Центральная зона: 2D Холст Канбана */}
        <main className="flex-1 flex flex-col overflow-hidden relative rounded-2xl">
          <KanbanBoard
            tasks={filteredTasks}
            onTasksChange={handleTasksChange}
            onCardClick={handleCardClick}
            onTagClick={(tag) => setSelectedTag(tag === selectedTag ? null : tag)}
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
        onCourseCreated={(newCourse) => {
          setCourses(getStoredCourses());
          setSelectedCourseId(newCourse.id);
        }}
      />

      {/* Модальное окно создания задания */}
      {selectedCourseId && (
        <CreateAssignmentModal
          isOpen={isCreateAssignmentOpen}
          courseId={selectedCourseId}
          onClose={() => setIsCreateAssignmentOpen(false)}
          onAssignmentCreated={() => {
            const allStored = getStoredTasks();
            const courseTasks = allStored.filter(
              (t) => t.assignment?.course_id === selectedCourseId
            );
            setTasks(courseTasks);
            setCourses(getStoredCourses());
          }}
        />
      )}
    </div>
  );
}
