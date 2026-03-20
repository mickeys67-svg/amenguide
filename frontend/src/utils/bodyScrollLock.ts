/**
 * 여러 모달이 동시에 body scroll을 잠글 때 충돌을 방지하는 카운터 기반 유틸.
 * lock()을 호출하면 카운터 증가, unlock()을 호출하면 카운터 감소.
 * 카운터가 0이 될 때만 실제로 overflow를 해제.
 */
let lockCount = 0;

export function lockBodyScroll() {
    lockCount++;
    if (lockCount === 1) {
        document.body.style.overflow = "hidden";
    }
}

export function unlockBodyScroll() {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
        document.body.style.overflow = "";
    }
}
