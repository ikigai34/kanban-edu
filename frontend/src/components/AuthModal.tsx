'use client';

import React, { useState } from 'react';
import { User, UserRole } from '@/types';
import { loginUser, registerUser, getCurrentUser } from '@/lib/api';
import {
  GraduationCap,
  Lock,
  Mail,
  User as UserIcon,
  Shield,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Форма логина
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Форма регистрации
  const [regEmail, setRegEmail] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('student');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginUser(loginEmail, loginPassword);
      const user = await getCurrentUser();
      if (user) {
        onSuccess(user);
      } else {
        throw new Error('Не удалось получить профиль пользователя');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка входа в систему');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await registerUser(regEmail, regFullName, regPassword, regRole);
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации аккаунта');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: 'student' | 'teacher' | 'student2') => {
    setLoading(true);
    setError(null);
    try {
      const email =
        role === 'teacher'
          ? 'teacher@mail.com'
          : role === 'student2'
          ? 'vasilieva@togu.dv'
          : 'user@togu.dv';
      const res = await loginUser(email, 'password');
      if (res.user) {
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка быстрого входа в БД');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#1c1c1c] rounded-3xl shadow-2xl border border-slate-200/90 dark:border-[#2a2a2a] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Шапка модального окна */}
        <div className="p-6 bg-gradient-to-br from-[#0F2D59] to-[#1a4480] text-white text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md mx-auto flex items-center justify-center mb-3 shadow-inner">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">ТОГУ • kanban-edu</h2>
          <p className="text-xs text-white/80 mt-1">
            Система управления учебными заданиями и проектами
          </p>
        </div>

        {/* Переключатель вкладок «Вход» и «Регистрация» */}
        <div className="flex border-b border-slate-200 dark:border-[#2a2a2a] bg-slate-50/70 dark:bg-[#242424]/60 p-1.5 m-4 mb-2 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'login'
                ? 'bg-white dark:bg-[#252525] text-slate-900 dark:text-neutral-100 shadow-2xs'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
            }`}
          >
            Вход в систему
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'register'
                ? 'bg-white dark:bg-[#252525] text-slate-900 dark:text-neutral-100 shadow-2xs'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
            }`}
          >
            Регистрация
          </button>
        </div>

        {/* Сообщение об ошибке */}
        {error && (
          <div className="mx-6 mt-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Форма Входа */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="p-6 pt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Электронная почта (Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-neutral-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="student@togu.ru"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#333333] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Пароль
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-neutral-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#333333] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#0F2D59] hover:bg-[#163e77] active:scale-99 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Вход в систему...' : 'Войти в аккаунт'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Быстрый демо-вход для тестирования интерфейса */}
            <div className="pt-2">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-[#2a2a2a]"></div>
                <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                  Или быстрый вход для теста
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-[#2a2a2a]"></div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('student')}
                  disabled={loading}
                  className="py-2 px-3 border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 text-blue-900 dark:text-blue-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  title="user@togu.dv (Перелыгин Роман)"
                >
                  <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Роман (Студент)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('teacher')}
                  disabled={loading}
                  className="py-2 px-3 border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100/70 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  title="teacher@mail.com (Иванов Д.С.)"
                >
                  <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Преподаватель</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Форма Регистрации */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="p-6 pt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                Имя и Фамилия
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 dark:text-neutral-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Иван Петров"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-xs bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#333333] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                Электронная почта
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-neutral-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="ivan@togu.ru"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-xs bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#333333] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                Пароль
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-neutral-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Минимум 6 символов"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-xs bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#333333] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500"
                />
              </div>
            </div>

            {/* Выбор роли: Студент или Преподаватель */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Роль в системе
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegRole('student')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    regRole === 'student'
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 ring-1 ring-blue-400'
                      : 'bg-slate-50 dark:bg-[#252525] border-slate-200 dark:border-[#333333] text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#333333]'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Студент</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('teacher')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    regRole === 'teacher'
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200 ring-1 ring-amber-400'
                      : 'bg-slate-50 dark:bg-[#252525] border-slate-200 dark:border-[#333333] text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#333333]'
                  }`}
                >
                  <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Преподаватель</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-[#0F2D59] hover:bg-[#163e77] text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Создание аккаунта...' : 'Зарегистрироваться'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
