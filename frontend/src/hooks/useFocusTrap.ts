import { useEffect, useRef } from "react";

/**
 * 모달 포커스 트랩 — Tab 키가 모달 내부에서만 순환하도록 함
 * WCAG 2.1 Level A 준수
 */
export function useFocusTrap(isOpen: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !ref.current) return;

    const container = ref.current;
    const previousFocus = document.activeElement as HTMLElement;

    // 모달 열릴 때 첫 포커스 가능 요소로 이동
    const focusFirst = () => {
      const focusable = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) focusable[0].focus();
    };
    requestAnimationFrame(focusFirst);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusable = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      // 모달 닫힐 때 이전 포커스 복원
      previousFocus?.focus?.();
    };
  }, [isOpen]);

  return ref;
}
