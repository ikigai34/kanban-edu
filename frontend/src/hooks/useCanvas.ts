'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { CanvasTransform } from '@/types';

interface UseCanvasOptions {
  minScale?: number;
  maxScale?: number;
  scaleStep?: number;
  initialScale?: number;
}

export function useCanvas(options: UseCanvasOptions = {}) {
  const {
    minScale = 0.4,
    maxScale = 2.0,
    scaleStep = 0.1,
    initialScale = 1.0,
  } = options;

  const [transform, setTransform] = useState<CanvasTransform>({
    x: 0,
    y: 0,
    scale: initialScale,
  });

  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isHandToolActive, setIsHandToolActive] = useState(false);

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const isPanningRef = useRef(isPanning);
  isPanningRef.current = isPanning;

  // Глобальное отслеживание отпускания мыши (решает проблему зависания СКМ)
  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isPanningRef.current) {
        setIsPanning(false);
      }
    };

    const handleWindowBlur = () => {
      setIsPanning(false);
      setIsSpacePressed(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('pointerup', handleGlobalMouseUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('pointerup', handleGlobalMouseUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  // Отслеживание нажатия пробела
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const zoomIn = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(maxScale, Math.round((prev.scale + scaleStep) * 10) / 10),
    }));
  }, [maxScale, scaleStep]);

  const zoomOut = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(minScale, Math.round((prev.scale - scaleStep) * 10) / 10),
    }));
  }, [minScale, scaleStep]);

  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1.0 });
  }, []);

  // Начало перемещения (СКМ button === 1, Пробел + ЛКМ, или активный режим Рука)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const isMiddleClick = e.button === 1; // Колесико мыши
      const isSpaceLeftClick = e.button === 0 && isSpacePressed;
      const isHandClick = e.button === 0 && isHandToolActive;

      if (isMiddleClick || isSpaceLeftClick || isHandClick) {
        e.preventDefault();
        e.stopPropagation();
        setIsPanning(true);
        dragStartRef.current = {
          x: e.clientX - transformRef.current.x,
          y: e.clientY - transformRef.current.y,
        };
      }
    },
    [isSpacePressed, isHandToolActive]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      e.preventDefault();
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      setTransform((prev) => ({
        ...prev,
        x: newX,
        y: newY,
      }));
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }
  }, [isPanning]);

  return {
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
  };
}
