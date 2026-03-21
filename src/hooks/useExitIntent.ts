import { useEffect, useRef } from 'react';

const STORAGE_KEY = 'tv_winback_shown';

/**
 * Fires `onExitIntent` once per session when the mouse leaves toward the top of the page.
 * Only triggers if `enabled` is true.
 */
export function useExitIntent(onExitIntent: () => void, enabled: boolean) {
    const fired = useRef(false);

    useEffect(() => {
        if (!enabled) return;
        // Already shown this session
        if (sessionStorage.getItem(STORAGE_KEY) === '1') return;

        const handleMouseLeave = (e: MouseEvent) => {
            // Only trigger when leaving toward the top
            if (e.clientY <= 10 && !fired.current) {
                fired.current = true;
                sessionStorage.setItem(STORAGE_KEY, '1');
                onExitIntent();
            }
        };

        // Small delay so it doesn't trigger immediately on page load
        const timer = setTimeout(() => {
            document.addEventListener('mouseleave', handleMouseLeave);
        }, 3000);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [enabled, onExitIntent]);
}
