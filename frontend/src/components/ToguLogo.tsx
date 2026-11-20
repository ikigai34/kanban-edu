'use client';

import React from 'react';

interface ToguLogoProps {
  className?: string;
  size?: number;
}

export const ToguLogo: React.FC<ToguLogoProps> = ({
  className = '',
  size = 42,
}) => {
  return (
    <a
      href="https://portal.togudv.ru/"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center select-none group cursor-pointer transition-transform hover:opacity-90 active:scale-95 ${className}`}
      title="Тихоокеанский государственный университет — portal.togudv.ru"
    >
      <div
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden transition-transform group-hover:scale-105"
      >
        <img
          src="/togu-emblem-light.png"
          alt="Эмблема ТОГУ"
          className="w-full h-full object-contain rounded-xl block dark:hidden"
        />
        <img
          src="/togu-emblem-dark.png"
          alt="Эмблема ТОГУ"
          className="w-full h-full object-contain rounded-xl hidden dark:block"
        />
      </div>
    </a>
  );
};
