'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { StudentTask, TaskStatus, CourseColumn, User, CanvasTransform } from '@/types';
import { INITIAL_COLUMNS, buildCustomColumnDefinition } from '@/lib/mockData';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { moveTask } from '@/lib/api';
import { extractHashtags } from '@/lib/tagUtils';
import { Hand, MousePointer, Plus } from 'lucide-react';

export const isTaskInfo = (t: StudentTask): boolean => {
  if (t.status === 'info') return true;
  if (t.priority === 'info' || t.assignment?.priority === 'info') return true;
  const tags = [
    ...(t.assignment?.tags || []),
    ...extractHashtags(t.assignment?.title || ''),
  ].map((tag) => tag.toLowerCase());
  return tags.some((tag) => ['#инфо', '#лекция', '#объявление', '#информация'].includes(tag));
};

interface KanbanBoardProps {
  tasks: StudentTask[];
  customColumns?: CourseColumn[];
  onTasksChange: (tasks: StudentTask[]) => void;
  onCardClick: (task: StudentTask) => void;
  onTagClick?: (tag: string) => void;
  onToggleBookmark?: (task: StudentTask) => void;
  currentUser: User | null;
  courseTitle: string;
  onOpenCreateAssignment: () => void;
  onOpenCreateColumn?: () => void;
  onEditColumn?: (column: CourseColumn) => void;
  onDeleteColumn?: (column: CourseColumn, taskCount: number) => void;
  transform: CanvasTransform;
  setTransform: React.Dispatch<React.SetStateAction<CanvasTransform>>;
  isPanning: boolean;
  isSpacePressed: boolean;
  isHandToolActive: boolean;
  setIsHandToolActive: (active: boolean) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onCardMoved?: (task: StudentTask, oldContainer: string, newContainer: string) => void;
}

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.4',
      },
    },
  }),
  duration: 180,
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
};

const COLUMN_ORDER: TaskStatus[] = [
  'info',
  'todo',
  'in_progress',
  'on_review',
  'revision',
  'done',
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  customColumns = [],
  onTasksChange,
  onCardClick,
  onTagClick,
  onToggleBookmark,
  currentUser,
  courseTitle,
  onOpenCreateAssignment,
  onOpenCreateColumn,
  onEditColumn,
  onDeleteColumn,
  transform,
  setTransform,
  isPanning,
  isSpacePressed,
  isHandToolActive,
  setIsHandToolActive,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onCardMoved,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTask, setActiveTask] = useState<StudentTask | null>(null);
  const [dragStartContainer, setDragStartContainer] = useState<string | null>(null);

  const sortedCustomColumns = useMemo(
    () => [...customColumns].sort((a, b) => a.order - b.order),
    [customColumns]
  );

  const customColumnIds = useMemo(
    () => new Set(customColumns.map((c) => c.id)),
    [customColumns]
  );

  const getTaskContainer = (t: StudentTask): string => {
    if (t.column_id && customColumnIds.has(t.column_id)) {
      return t.column_id;
    }
    return isTaskInfo(t) ? 'info' : t.status;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Нативный непассивный wheel listener для изоляции зума холста
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleNativeWheel = (e: WheelEvent) => {
      // 1. Зум через Ctrl + колесико мыши
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
        setTransform((prev) => {
          const newScale = Math.min(2.0, Math.max(0.4, prev.scale * zoomFactor));
          const rect = el.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          const newX = mouseX - (mouseX - prev.x) * (newScale / prev.scale);
          const newY = mouseY - (mouseY - prev.y) * (newScale / prev.scale);

          return {
            x: Math.round(newX),
            y: Math.round(newY),
            scale: Math.round(newScale * 100) / 100,
          };
        });
        return;
      }

      // 2. Если курсор находится над прокручиваемым контейнером (список карточек в колонке)
      let target = e.target as HTMLElement | null;
      let isInsideScrollable = false;
      while (target && target !== el) {
        const style = window.getComputedStyle(target);
        const overflowY = style.overflowY;
        if ((overflowY === 'auto' || overflowY === 'scroll') && target.scrollHeight > target.clientHeight) {
          isInsideScrollable = true;
          break;
        }
        target = target.parentElement;
      }

      // Если мы внутри прокручиваемого списка карточек — даем ему прокручиваться естественно, не двигая холст
      if (isInsideScrollable) {
        return;
      }

      // 3. Перемещение холста при скролле по пустому фону
      e.preventDefault();
      e.stopPropagation();
      setTransform((prev) => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    };

    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleNativeWheel);
    };
  }, [setTransform]);

  /**
   * Находит колонку, которой принадлежит ID (системная, кастомная или карточка внутри нее)
   */
  const findContainer = (id: string | null | undefined): string | null => {
    if (!id) return null;
    if (COLUMN_ORDER.includes(id as TaskStatus) || customColumnIds.has(id)) {
      return id;
    }
    const task = tasks.find((t) => t.id === id);
    if (!task) return null;
    return getTaskContainer(task);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
      setDragStartContainer(getTaskContainer(task));
    }
  };

  /**
   * При перетаскивании МЕЖДУ разными колонками:
   * Перемещаем карточку в целевую колонку точно выше или ниже hovered-карточки
   */
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    // Если перетаскивание происходит внутри ОДНОЙ и той же колонки,
    // SortableContext обрабатывает анимацию сам, а порядок зафиксируется в handleDragEnd
    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    const activeItem = tasks.find((t) => t.id === activeId);
    if (!activeItem) return;

    // Запрет перемещения инфо-карточек в другие колонки и обычных карточек в колонку информации
    if (
      activeContainer === 'info' ||
      overContainer === 'info' ||
      isTaskInfo(activeItem)
    ) {
      return;
    }

    // Ограничение для студента:
    // Карточки в «На проверке», «На доработке» и «Сдано» студент может перемещать ТОЛЬКО внутри своего столбца!
    // Также студент не может перетаскивать обычные задания в эти столбцы (сдача происходит через TaskDrawer)
    if (!isTeacher) {
      const restrictedColumns: TaskStatus[] = ['on_review', 'revision', 'done'];
      if (
        restrictedColumns.includes(activeContainer as TaskStatus) ||
        restrictedColumns.includes(overContainer as TaskStatus)
      ) {
        return;
      }
    }

    // Карточки целевой колонки (без перемещаемой)
    const targetColumnCards = tasks
      .filter((t) => getTaskContainer(t) === overContainer && t.id !== activeId)
      .sort((a, b) => a.position - b.position);

    const isOverAColumn =
      COLUMN_ORDER.includes(overId as TaskStatus) || customColumnIds.has(overId);
    const overItem = tasks.find((t) => t.id === overId);

    let insertIndex = targetColumnCards.length;

    if (!isOverAColumn && overItem) {
      const overIndex = targetColumnCards.findIndex((t) => t.id === overId);
      if (overIndex !== -1) {
        const isBelowOver =
          active.rect.current.translated &&
          over.rect &&
          active.rect.current.translated.top > over.rect.top + over.rect.height / 2;

        insertIndex = isBelowOver ? overIndex + 1 : overIndex;
      }
    }

    // Собираем обновленную целевую колонку
    const newTargetCards = [...targetColumnCards];
    const isTargetCustom = customColumnIds.has(overContainer);
    const updatedActiveItem: StudentTask = isTargetCustom
      ? { ...activeItem, column_id: overContainer }
      : { ...activeItem, status: overContainer as TaskStatus, column_id: null };
    newTargetCards.splice(insertIndex, 0, updatedActiveItem);

    // Присваиваем последовательные позиции 1, 2, 3...
    const targetCardsWithPositions = newTargetCards.map((card, idx) => ({
      ...card,
      position: idx + 1,
    }));

    // Оставшиеся задачи из других колонок
    const otherTasks = tasks.filter(
      (t) => t.id !== activeId && getTaskContainer(t) !== overContainer
    );

    onTasksChange([...otherTasks, ...targetCardsWithPositions]);
  };

  /**
   * Завершение перетаскивания (для обеих ситуаций: внутри колонки и между колонками)
   */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const initialContainer = dragStartContainer;
    setActiveTask(null);
    setDragStartContainer(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer) return;

    const activeItem = tasks.find((t) => t.id === activeId);
    if (!activeItem) return;

    // Запрет перемещения между колонкой информации и другими колонками
    if (
      (activeContainer === 'info' && overContainer !== 'info') ||
      (activeContainer !== 'info' && overContainer === 'info') ||
      (isTaskInfo(activeItem) && overContainer !== 'info')
    ) {
      return;
    }

    // Ограничение для студента при смене колонки:
    if (!isTeacher && activeContainer !== overContainer) {
      const restrictedColumns: TaskStatus[] = ['on_review', 'revision', 'done'];
      if (
        restrictedColumns.includes(activeContainer as TaskStatus) ||
        restrictedColumns.includes(overContainer as TaskStatus)
      ) {
        return;
      }
    }

    // 1. ПЕРЕМЕЩЕНИЕ ВНУТРИ ОДНОЙ И ТОЙ ЖЕ КОЛОНКИ (включая 'info' и кастомные)
    if (activeContainer === overContainer) {
      if (activeId !== overId) {
        const columnCards = tasks
          .filter((t) => getTaskContainer(t) === activeContainer)
          .sort((a, b) => a.position - b.position);

        const oldIndex = columnCards.findIndex((t) => t.id === activeId);
        const newIndex = columnCards.findIndex((t) => t.id === overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reorderedCards = arrayMove(columnCards, oldIndex, newIndex);

          // Обновляем позиции 1, 2, 3...
          const updatedColumnCards = reorderedCards.map((card, idx) => ({
            ...card,
            position: idx + 1,
          }));

          const otherTasks = tasks.filter((t) => getTaskContainer(t) !== activeContainer);
          const finalTasks = [...otherTasks, ...updatedColumnCards];

          onTasksChange(finalTasks);

          const finalColId = customColumnIds.has(activeContainer) ? activeContainer : null;
          try {
            await moveTask(activeId, activeItem.status, newIndex + 1, finalColId);
          } catch (err) {
            console.error('Ошибка сохранения позиции внутри колонки:', err);
          }
          return;
        }
      }
      return;
    }

    // 2. ФИКСАЦИЯ ИТОГОВОЙ ПОЗИЦИИ ПРИ СМЕНЕ КОЛОНКИ
    const currentContainer = getTaskContainer(activeItem);
    const columnTasks = tasks
      .filter((t) => getTaskContainer(t) === currentContainer)
      .sort((a, b) => a.position - b.position);

    const finalIndex = columnTasks.findIndex((t) => t.id === activeId);
    const finalPosition = finalIndex !== -1 ? finalIndex + 1 : 1;

    if (initialContainer && currentContainer !== initialContainer && onCardMoved) {
      onCardMoved(activeItem, initialContainer, currentContainer);
    }

    const finalColId = customColumnIds.has(currentContainer) ? currentContainer : null;
    try {
      await moveTask(activeId, activeItem.status, finalPosition, finalColId);
    } catch (err) {
      console.error('Ошибка сохранения позиции задачи:', err);
    }
  };

  const isTeacher = currentUser?.role === 'teacher' || currentUser?.role === 'admin';

  // Для преподавателя колонка "В работе" скрыта (это персональный черновик студента)
  const visibleColumns = COLUMN_ORDER.filter((colId) => {
    if (isTeacher && colId === 'in_progress') {
      return false;
    }
    return true;
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        className={`relative w-full h-full overflow-hidden select-none bg-slate-50/70 dark:bg-[#1e1e1e] border border-slate-200/80 dark:border-[#2a2a2a] rounded-2xl ${
          isPanning
            ? 'cursor-grabbing'
            : isSpacePressed || isHandToolActive
            ? 'cursor-grab'
            : 'cursor-default'
        }`}
        style={{
          backgroundImage: `radial-gradient(circle, var(--canvas-dots, #cbd5e1) 1.1px, transparent 1.1px)`,
          backgroundSize: `${24 * transform.scale}px ${24 * transform.scale}px`,
          backgroundPosition: `${transform.x}px ${transform.y}px`,
        }}
      >
        {/* 2D Canvas Container с плавной трансформацией */}
        <div
          className="absolute top-0 left-0 p-6 flex gap-6 h-[calc(100%-48px)] transition-transform duration-100 ease-out will-change-transform"
          style={{
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
            transformOrigin: '0 0',
          }}
        >
          {visibleColumns.map((colId) => {
            const col = INITIAL_COLUMNS.find((c) => c.id === colId)!;
            const columnTasks = tasks
              .filter((t) => getTaskContainer(t) === colId)
              .sort((a, b) => a.position - b.position);

            return (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={columnTasks}
                onCardClick={onCardClick}
                onTagClick={onTagClick}
                onToggleBookmark={onToggleBookmark}
                currentUser={currentUser}
                onAddAssignment={onOpenCreateAssignment}
              />
            );
          })}

          {/* Кастомные столбцы дисциплины */}
          {sortedCustomColumns.map((customCol) => {
            const colDef = buildCustomColumnDefinition(customCol);
            const columnTasks = tasks
              .filter((t) => getTaskContainer(t) === customCol.id)
              .sort((a, b) => a.position - b.position);

            return (
              <KanbanColumn
                key={customCol.id}
                column={colDef}
                tasks={columnTasks}
                onCardClick={onCardClick}
                onTagClick={onTagClick}
                onToggleBookmark={onToggleBookmark}
                currentUser={currentUser}
                onAddAssignment={onOpenCreateAssignment}
                onEditColumn={onEditColumn}
                onDeleteColumn={onDeleteColumn}
              />
            );
          })}

          {/* Кнопка создания своего столбца для преподавателя */}
          {isTeacher && onOpenCreateColumn && (
            <button
              type="button"
              onClick={onOpenCreateColumn}
              className="w-[260px] shrink-0 h-14 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300/80 dark:border-[#2a2a2a] hover:border-blue-400 dark:hover:border-[#444444] bg-white/50 dark:bg-[#161616]/60 hover:bg-white/90 dark:hover:bg-[#1e1e1e] text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-neutral-200 transition-all cursor-pointer select-none"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить столбец</span>
            </button>
          )}
        </div>

        {/* Панель подсказки и режима перетаскивания */}
        <div className="absolute bottom-4 right-4 z-10 hidden sm:flex items-center gap-2.5 bg-white/95 dark:bg-[#181818]/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200/90 dark:border-[#2a2a2a] text-xs text-slate-600 dark:text-neutral-300 shadow-xs">
          <div className="flex items-center bg-slate-100 dark:bg-[#202020] rounded-lg p-0.5 border border-slate-200/80 dark:border-[#333333] mr-1">
            <button
              type="button"
              onClick={() => setIsHandToolActive(false)}
              title="Режим карточек"
              className={`p-1 rounded-md transition-colors ${
                !isHandToolActive
                  ? 'bg-white dark:bg-[#2a2a2a] text-slate-900 dark:text-neutral-100 shadow-2xs'
                  : 'text-slate-400 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-300'
              }`}
            >
              <MousePointer className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsHandToolActive(true)}
              title="Режим перемещения доски (зажатием ЛКМ)"
              className={`p-1 rounded-md transition-colors ${
                isHandToolActive
                  ? 'bg-white dark:bg-[#2a2a2a] text-slate-900 dark:text-neutral-100 shadow-2xs'
                  : 'text-slate-400 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-300'
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
            </button>
          </div>

          <span>Перемещение: <b>Колесико мыши</b> или <b>Пробел + ЛКМ</b></span>
          <span className="text-slate-300 dark:text-neutral-700">•</span>
          <span>Масштаб: <b>Ctrl + Колесико</b></span>
        </div>
      </div>

      {/* Плавный клон перетаскиваемой карточки */}
      {mounted &&
        createPortal(
          <DragOverlay dropAnimation={dropAnimationConfig}>
            {activeTask && (
              <div
                style={{
                  width: 292,
                  transform: `scale(${transform.scale})`,
                  transformOrigin: 'top left',
                }}
              >
                <KanbanCard
                  task={activeTask}
                  onClick={() => {}}
                  onToggleBookmark={onToggleBookmark}
                  isDraggingOverlay
                  isTeacher={isTeacher}
                />
              </div>
            )}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  );
};
