import { Course, StudentTask, User, ColumnDefinition } from '@/types';

export const DEFAULT_USERS: { student: User; teacher: User } = {
  student: {
    id: 'user-student-1',
    email: 'student@togu.ru',
    full_name: 'Александр Смирнов',
    role: 'student',
    group: 'ПО-41',
    is_active: true,
  },
  teacher: {
    id: 'user-teacher-1',
    email: 'teacher@togu.ru',
    full_name: 'Дмитрий Сергеевич Иванов',
    role: 'teacher',
    group: 'каф. ИСТ',
    is_active: true,
  },
};

export const STUDENTS_LIST = [
  { id: 'user-student-1', full_name: 'Александр Смирнов', group: 'ПО-41', email: 'smirnov@togu.ru' },
  { id: 'user-student-2', full_name: 'Анна Васильева', group: 'ПО-41', email: 'vasilieva@togu.ru' },
  { id: 'user-student-3', full_name: 'Максим Ковалёв', group: 'ПО-41', email: 'kovalev@togu.ru' },
  { id: 'user-student-4', full_name: 'Екатерина Попова', group: 'ПО-42', email: 'popova@togu.ru' },
  { id: 'user-student-5', full_name: 'Дмитрий Морозов', group: 'ПО-42', email: 'morozov@togu.ru' },
];

export const INITIAL_COLUMNS: ColumnDefinition[] = [
  {
    id: 'info',
    title: 'Информация',
    accentColor: '',
    headerBg: 'bg-slate-200/75 dark:bg-white/[0.03]',
    headerText: 'text-slate-800 dark:text-neutral-200 font-semibold',
    badgeBg: 'bg-slate-300/70 dark:bg-white/[0.06] text-slate-800 dark:text-neutral-400 font-semibold',
    badgeText: 'text-slate-800 dark:text-neutral-400',
    dotColor: 'bg-slate-500 dark:bg-neutral-500',
  },
  {
    id: 'todo',
    title: 'К выполнению',
    accentColor: '',
    headerBg: 'bg-sky-100/90 dark:bg-sky-500/[0.07]',
    headerText: 'text-sky-950 dark:text-neutral-200 font-semibold',
    badgeBg: 'bg-sky-200/75 dark:bg-white/[0.06] text-sky-900 dark:text-neutral-400 font-semibold',
    badgeText: 'text-sky-900 dark:text-neutral-400',
    dotColor: 'bg-sky-500 dark:bg-sky-400/75',
  },
  {
    id: 'in_progress',
    title: 'В работе',
    accentColor: '',
    headerBg: 'bg-indigo-100/90 dark:bg-indigo-500/[0.07]',
    headerText: 'text-indigo-950 dark:text-neutral-200 font-semibold',
    badgeBg: 'bg-indigo-200/75 dark:bg-white/[0.06] text-indigo-900 dark:text-neutral-400 font-semibold',
    badgeText: 'text-indigo-900 dark:text-neutral-400',
    dotColor: 'bg-indigo-500 dark:bg-indigo-400/75',
  },
  {
    id: 'on_review',
    title: 'На проверке',
    accentColor: '',
    headerBg: 'bg-amber-100/90 dark:bg-amber-500/[0.07]',
    headerText: 'text-amber-950 dark:text-neutral-200 font-semibold',
    badgeBg: 'bg-amber-200/75 dark:bg-white/[0.06] text-amber-900 dark:text-neutral-400 font-semibold',
    badgeText: 'text-amber-900 dark:text-neutral-400',
    dotColor: 'bg-amber-500 dark:bg-amber-400/75',
  },
  {
    id: 'revision',
    title: 'На доработке',
    accentColor: '',
    headerBg: 'bg-rose-100/90 dark:bg-rose-500/[0.07]',
    headerText: 'text-rose-950 dark:text-neutral-200 font-semibold',
    badgeBg: 'bg-rose-200/75 dark:bg-white/[0.06] text-rose-900 dark:text-neutral-400 font-semibold',
    badgeText: 'text-rose-900 dark:text-neutral-400',
    dotColor: 'bg-rose-500 dark:bg-rose-400/75',
  },
  {
    id: 'done',
    title: 'Сдано',
    accentColor: '',
    headerBg: 'bg-emerald-100/90 dark:bg-emerald-500/[0.07]',
    headerText: 'text-emerald-950 dark:text-neutral-200 font-semibold',
    badgeBg: 'bg-emerald-200/75 dark:bg-white/[0.06] text-emerald-900 dark:text-neutral-400 font-semibold',
    badgeText: 'text-emerald-900 dark:text-neutral-400',
    dotColor: 'bg-emerald-500 dark:bg-emerald-400/75',
  },
];

export const INITIAL_COURSES: Course[] = [
  {
    id: 'course-os',
    title: 'Операционные системы',
    code: 'ОС',
    description: 'Архитектура ядра, системные вызовы, многопоточность и управление памятью в UNIX-подобных ОС.',
    teacher_id: 'user-teacher-1',
    color: 'indigo',
    uncompletedCount: 4,
    groups: ['ПО-41', 'ПО-42'],
  },
  {
    id: 'course-math',
    title: 'Высшая математика',
    code: 'ВМ',
    description: 'Математический анализ, теория пределов, дифференциальные уравнения и кратные интегралы.',
    teacher_id: 'user-teacher-1',
    color: 'emerald',
    uncompletedCount: 2,
    groups: ['ПО-41', 'ИВТ-41'],
  },
  {
    id: 'course-db',
    title: 'Базы данных и SQL',
    code: 'БД',
    description: 'Реляционная модель, проектирование 3НФ, PostgreSQL, транзакции и оптимизация запросов.',
    teacher_id: 'user-teacher-1',
    color: 'blue',
    uncompletedCount: 3,
    groups: ['ПО-41', 'ПО-42', 'ПИ-41'],
  },
  {
    id: 'course-web',
    title: 'Веб-технологии и React',
    code: 'ВЕБ',
    description: 'Современная фронтенд и бэкенд разработка: Next.js, TypeScript, REST API и UI/UX проектирование.',
    teacher_id: 'user-teacher-1',
    color: 'purple',
    uncompletedCount: 1,
    groups: ['ПО-41'],
  },
  {
    id: 'course-sec',
    title: 'Информационная безопасность',
    code: 'ИБ',
    description: 'Криптографические протоколы, аудит уязвимостей, защита сетевых подключений и аутентификация.',
    teacher_id: 'user-teacher-1',
    color: 'rose',
    uncompletedCount: 2,
    groups: ['ПО-41', 'ПО-42'],
  },
];

const now = new Date();
const addDays = (days: number): string => {
  const d = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
};

export const INITIAL_TASKS: StudentTask[] = [
  // 1. Колонка ТОДО: Срочная лабораторная
  {
    id: 'task-os-4',
    student_id: 'user-student-1',
    assignment_id: 'assign-os-4',
    status: 'todo',
    position: 1,
    priority: 'urgent',
    deadline: addDays(2),
    checklist: [
      { id: 'c1', text: 'Изучить POSIX mutex и условные переменные', done: true },
      { id: 'c2', text: 'Решить задачу «Обедающие философы» без дедлока', done: false },
      { id: 'c3', text: 'Провести тестирование с Valgrind Helgrind', done: false },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignment: {
      id: 'assign-os-4',
      course_id: 'course-os',
      title: 'Лабораторная работа №4: Синхронизация потоков и семафоры #Лабораторная',
      description: `### Цель работы
Изучить механизмы синхронизации параллельных потоков с использованием библиотеки **pthread** и семафоров.

#### Задачи к выполнению:
- [x] Изучить POSIX mutex и условные переменные
- [ ] Решить классическую задачу «Обедающие философы» без взаимных блокировок
- [ ] Провести профилирование на утечки и data race с помощью \`valgrind --tool=helgrind\`

> Внимание: обратите внимание на корректную очистку мьютексов при аварийном завершении потока.`,
      order: 4,
      max_score: 100,
      priority: 'urgent',
      deadline: addDays(2),
      tags: ['#Лабораторная'],
      files: [
        {
          id: 'f1',
          name: 'metodichka_lab4_threads.pdf',
          size: '2.4 МБ',
          url: '/files/metodichka_lab4_threads.pdf',
          type: 'pdf',
        },
        {
          id: 'f2',
          name: 'thread_sync_starter_pack.zip',
          size: '480 КБ',
          url: '/files/thread_sync_starter_pack.zip',
          type: 'zip',
        },
      ],
      created_at: new Date().toISOString(),
    },
  },

  // 2. Колонка ТОДО: Информационная карточка
  {
    id: 'task-os-5',
    student_id: 'user-student-1',
    assignment_id: 'assign-os-5',
    status: 'todo',
    position: 2,
    priority: 'info',
    deadline: addDays(8),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignment: {
      id: 'assign-os-5',
      course_id: 'course-os',
      title: 'Подготовка к коллоквиуму по виртуальной памяти и пейджингу #Лекция',
      description: `Вопросы к коллоквиуму:
1. Сегментно-страничная организация памяти.
2. Алгоритмы замещения страниц (LRU, FIFO, Clock).
3. Translation Lookaside Buffer (TLB) и трансляция адресов.

Файл конспекта прикреплен к заданию.`,
      order: 5,
      max_score: 50,
      priority: 'info',
      deadline: addDays(8),
      tags: ['#Лекция'],
      files: [
        {
          id: 'f3',
          name: 'conspect_virtual_memory.pdf',
          size: '1.8 МБ',
          url: '/files/conspect_virtual_memory.pdf',
          type: 'pdf',
        },
      ],
      created_at: new Date().toISOString(),
    },
  },

  // 3. Колонка В РАБОТЕ: Лабораторная 3
  {
    id: 'task-os-3',
    student_id: 'user-student-1',
    assignment_id: 'assign-os-3',
    status: 'in_progress',
    position: 1,
    priority: 'normal',
    deadline: addDays(4),
    repo_url: 'https://github.com/alex-smirnov/os-lab3-processes',
    comment: 'Разработал иерархию процессов через fork/exec, сейчас дописываю перехват сигналов SIGINT.',
    checklist: [
      { id: 'c11', text: 'Создать структуру дочерних процессов fork()', done: true },
      { id: 'c12', text: 'Реализовать обработчик сигналов sigaction()', done: true },
      { id: 'c13', text: 'Написать модульные тесты и Makefile', done: false },
    ],
    submission_files: [
      {
        id: 'sf-1',
        name: 'draft_solution_v1.tar.gz',
        size: '150 КБ',
        url: '/files/submissions/draft_solution_v1.tar.gz',
        uploaded_at: 'Вчера, 18:30',
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignment: {
      id: 'assign-os-3',
      course_id: 'course-os',
      title: 'Лабораторная работа №3: Управление процессами в Linux #Лабораторная',
      description: `### Управление процессами в UNIX
Необходимо написать утилиту командной строки для мониторинга и перезапуска упавших дочерних процессов-демонов.

Ключевые системные вызовы:
\`\`\`c
pid_t fork(void);
int execvp(const char *file, char *const argv[]);
pid_t waitpid(pid_t pid, int *status, int options);
\`\`\`

Исходный шаблон и скрипт валидации прикреплены.`,
      order: 3,
      max_score: 100,
      priority: 'normal',
      deadline: addDays(4),
      tags: ['#Лабораторная'],
      files: [
        {
          id: 'f4',
          name: 'lab3_process_guide.pdf',
          size: '3.1 МБ',
          url: '/files/lab3_process_guide.pdf',
          type: 'pdf',
        },
      ],
      created_at: new Date().toISOString(),
    },
  },

  // 4. Колонка НА ПРОВЕРКЕ: Курсовой проект
  {
    id: 'task-os-kp',
    student_id: 'user-student-1',
    assignment_id: 'assign-os-kp',
    status: 'on_review',
    position: 1,
    priority: 'normal',
    deadline: addDays(-1),
    repo_url: 'https://github.com/alex-smirnov/dekanat-operating-core',
    comment: 'Сдал расчетно-пояснительную записку и исходный код модулей.',
    submission_files: [
      {
        id: 'sf-kp1',
        name: 'Smirnov_Kursovaya_OS_2026.pdf',
        size: '5.6 МБ',
        url: '/files/submissions/Smirnov_Kursovaya_OS_2026.pdf',
        uploaded_at: '15.11.2026, 21:40',
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignment: {
      id: 'assign-os-kp',
      course_id: 'course-os',
      title: 'Курсовой проект: Проектирование диспетчера задач #Курсовая',
      description: `### Тема курсового проекта
Разработка распределенного пула потоков с адаптивным планировщиком задач.`,
      order: 10,
      max_score: 100,
      priority: 'normal',
      deadline: addDays(-1),
      tags: ['#Курсовая'],
      files: [
        {
          id: 'f7',
          name: 'gost_templates_kp.docx',
          size: '890 КБ',
          url: '/files/gost_templates_kp.docx',
          type: 'doc',
        },
      ],
      created_at: new Date().toISOString(),
    },
  },

  // 5. Колонка НА ДОРАБОТКЕ: Лабораторная 2
  {
    id: 'task-os-2',
    student_id: 'user-student-1',
    assignment_id: 'assign-os-2',
    status: 'revision',
    position: 1,
    priority: 'normal',
    deadline: addDays(3),
    repo_url: 'https://github.com/alex-smirnov/os-lab2-ipc',
    comment: 'Исправляю обработку сигналов переполнения пайпа.',
    teacher_comment: 'В клиентской части при закрытии сервера падает по Broken Pipe (SIGPIPE). Добавьте флаг MSG_NOSIGNAL или игнорирование SIGPIPE.',
    score: 65,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignment: {
      id: 'assign-os-2',
      course_id: 'course-os',
      title: 'Лабораторная работа №2: Межпроцессное взаимодействие IPC #Лабораторная',
      description: `Реализация клиент-серверного взаимодействия через именованные каналы FIFO и разделяемую память.`,
      order: 2,
      max_score: 100,
      priority: 'normal',
      deadline: addDays(3),
      tags: ['#Лабораторная'],
      files: [
        {
          id: 'f8',
          name: 'lab2_ipc_instructions.pdf',
          size: '1.9 МБ',
          url: '/files/lab2_ipc_instructions.pdf',
          type: 'pdf',
        },
      ],
      created_at: new Date().toISOString(),
    },
  },

  // 6. Колонка СДАНО: Лабораторная 1
  {
    id: 'task-os-1',
    student_id: 'user-student-1',
    assignment_id: 'assign-os-1',
    status: 'done',
    position: 1,
    priority: 'normal',
    deadline: addDays(-10),
    repo_url: 'https://github.com/alex-smirnov/os-lab1-intro',
    comment: 'Работа выполнена в полном объеме.',
    teacher_comment: 'Отлично! Код чистый, Makefile написан аккуратно, защита прошла успешно.',
    score: 98,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignment: {
      id: 'assign-os-1',
      course_id: 'course-os',
      title: 'Лабораторная работа №1: Среда разработки и GCC #Лабораторная',
      description: `Настройка сборочного окружения в Linux, статические и динамические библиотеки (.a / .so).`,
      order: 1,
      max_score: 100,
      priority: 'normal',
      deadline: addDays(-10),
      tags: ['#Лабораторная'],
      files: [
        {
          id: 'f9',
          name: 'lab1_intro_task.pdf',
          size: '1.1 МБ',
          url: '/files/lab1_intro_task.pdf',
          type: 'pdf',
        },
      ],
      created_at: new Date().toISOString(),
    },
  },

  // 7. Колонка СДАНО: Практика
  {
    id: 'task-os-prac',
    student_id: 'user-student-1',
    assignment_id: 'assign-os-prac',
    status: 'done',
    position: 2,
    priority: 'normal',
    deadline: addDays(-7),
    comment: 'Практическое занятие №1 сдано на паре.',
    teacher_comment: 'Зачтено автоматом.',
    score: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignment: {
      id: 'assign-os-prac',
      course_id: 'course-os',
      title: 'Практическое занятие: Команды терминала #Практика',
      description: `Освоение grep, awk, sed, find для автоматизации задач.`,
      order: 6,
      max_score: 100,
      priority: 'normal',
      deadline: addDays(-7),
      tags: ['#Практика'],
      files: [
        {
          id: 'f10',
          name: 'bash_cheatsheet.pdf',
          size: '650 КБ',
          url: '/files/bash_cheatsheet.pdf',
          type: 'pdf',
        },
      ],
      created_at: new Date().toISOString(),
    },
  },

  // ==================== РАБОТЫ ДРУГИХ СТУДЕНТОВ (для преподавателя) ====================
  // Анна Васильева (ПО-41) — На проверке (Лаба 3)
  {
    id: 'task-anna-os-3',
    student_id: 'user-student-2',
    assignment_id: 'assign-os-3',
    status: 'on_review',
    position: 1,
    priority: 'normal',
    deadline: addDays(4),
    repo_url: 'https://github.com/anna-vas/os-processes',
    comment: 'Реализован демон-супервизор и перехват сигналов SIGCHLD. Все тесты пройдены успешно.',
    student: {
      id: 'user-student-2',
      full_name: 'Анна Васильева',
      group: 'ПО-41',
    },
    submission_files: [
      {
        id: 'sf-anna-1',
        name: 'Vasilieva_Report_Lab3.pdf',
        size: '2.1 МБ',
        url: '/files/submissions/Vasilieva_Report_Lab3.pdf',
        uploaded_at: '25 минут назад',
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignment: {
      id: 'assign-os-3',
      course_id: 'course-os',
      title: 'Лабораторная работа №3: Управление процессами в Linux #Лабораторная',
      description: 'Управление процессами в UNIX. Написание утилиты командной строки для мониторинга дочерних процессов.',
      order: 3,
      max_score: 100,
      priority: 'normal',
      deadline: addDays(4),
      tags: ['#Лабораторная'],
      created_at: new Date().toISOString(),
    },
  },

  // Анна Васильева (ПО-41) — Сдано (Лаба 2)
  {
    id: 'task-anna-os-2',
    student_id: 'user-student-2',
    assignment_id: 'assign-os-2',
    status: 'done',
    position: 3,
    priority: 'normal',
    deadline: addDays(-5),
    repo_url: 'https://github.com/anna-vas/os-ipc',
    score: 95,
    teacher_comment: 'Отличная реализация на POSIX очереди сообщений. Зачтено!',
    student: {
      id: 'user-student-2',
      full_name: 'Анна Васильева',
      group: 'ПО-41',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignment: {
      id: 'assign-os-2',
      course_id: 'course-os',
      title: 'Лабораторная работа №2: Межпроцессное взаимодействие IPC #Лабораторная',
      order: 2,
      max_score: 100,
      priority: 'normal',
      deadline: addDays(-5),
      tags: ['#Лабораторная'],
      created_at: new Date().toISOString(),
    },
  },

  // Максим Ковалёв (ПО-41) — На проверке (Лаба 2)
  {
    id: 'task-max-os-2',
    student_id: 'user-student-3',
    assignment_id: 'assign-os-2',
    status: 'on_review',
    position: 2,
    priority: 'normal',
    deadline: addDays(3),
    repo_url: 'https://github.com/max-kovalev/ipc-fifo-system',
    comment: 'Сделал клиент-сервер на именованных каналах FIFO. Прошу проверить корректность работы буфера.',
    student: {
      id: 'user-student-3',
      full_name: 'Максим Ковалёв',
      group: 'ПО-41',
    },
    submission_files: [
      {
        id: 'sf-max-1',
        name: 'Kovalev_Lab2_IPC.pdf',
        size: '1.4 МБ',
        url: '/files/submissions/Kovalev_Lab2_IPC.pdf',
        uploaded_at: '1 час назад',
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignment: {
      id: 'assign-os-2',
      course_id: 'course-os',
      title: 'Лабораторная работа №2: Межпроцессное взаимодействие IPC #Лабораторная',
      description: 'Реализация клиент-серверного взаимодействия через именованные каналы FIFO и разделяемую память.',
      order: 2,
      max_score: 100,
      priority: 'normal',
      deadline: addDays(3),
      tags: ['#Лабораторная'],
      created_at: new Date().toISOString(),
    },
  },

  // Екатерина Попова (ПО-42) — На проверке (Курсовой проект)
  {
    id: 'task-kate-os-kp',
    student_id: 'user-student-4',
    assignment_id: 'assign-os-kp',
    status: 'on_review',
    position: 3,
    priority: 'urgent',
    deadline: addDays(-1),
    repo_url: 'https://github.com/kate-popova/thread-pool-dispatcher',
    comment: 'Готова пояснительная записка по ГОСТ 7.32 и исходные коды планировщика пула потоков.',
    student: {
      id: 'user-student-4',
      full_name: 'Екатерина Попова',
      group: 'ПО-42',
    },
    submission_files: [
      {
        id: 'sf-kate-1',
        name: 'Popova_KP_Dispatcher_2026.pdf',
        size: '4.8 МБ',
        url: '/files/submissions/Popova_KP_Dispatcher_2026.pdf',
        uploaded_at: '2 часа назад',
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignment: {
      id: 'assign-os-kp',
      course_id: 'course-os',
      title: 'Курсовой проект: Проектирование диспетчера задач #Курсовая',
      description: 'Разработка распределенного пула потоков с адаптивным планировщиком задач.',
      order: 10,
      max_score: 100,
      priority: 'urgent',
      deadline: addDays(-1),
      tags: ['#Курсовая'],
      created_at: new Date().toISOString(),
    },
  },

  // Дмитрий Морозов (ПО-42) — На проверке (Лаба 4)
  {
    id: 'task-dima-os-4',
    student_id: 'user-student-5',
    assignment_id: 'assign-os-4',
    status: 'on_review',
    position: 4,
    priority: 'urgent',
    deadline: addDays(2),
    comment: 'Решена задача «Обедающие философы» с иерархией мьютексов Дейкстры. Добавлены тесты.',
    student: {
      id: 'user-student-5',
      full_name: 'Дмитрий Морозов',
      group: 'ПО-42',
    },
    submission_files: [
      {
        id: 'sf-dima-1',
        name: 'Morozov_Threads_Lab4.zip',
        size: '1.2 МБ',
        url: '/files/submissions/Morozov_Threads_Lab4.zip',
        uploaded_at: '3 часа назад',
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignment: {
      id: 'assign-os-4',
      course_id: 'course-os',
      title: 'Лабораторная работа №4: Синхронизация потоков и семафоры #Лабораторная',
      description: 'Изучить механизмы синхронизации параллельных потоков с использованием библиотеки pthread и семафоров.',
      order: 4,
      max_score: 100,
      priority: 'urgent',
      deadline: addDays(2),
      tags: ['#Лабораторная'],
      created_at: new Date().toISOString(),
    },
  },
];
