/**
 * Utility functions for handling touch gestures (pinch-to-zoom, two-finger rotation)
 */

export interface PinchState {
    initialDistance: number;
    initialScale: number;
    initialRotation: number;
    initialAngle: number;
}

/**
 * Calculate distance between two touch points
 */
export function getTouchDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle between two touch points (in degrees)
 */
export function getTouchAngle(touch1: Touch, touch2: Touch): number {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
}

/**
 * Calculate center point between two touches
 */
export function getTouchCenter(touch1: Touch, touch2: Touch): { x: number; y: number } {
    return {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
    };
}

/**
 * Normalize angle to -180 to 180 range
 */
export function normalizeAngle(angle: number): number {
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;
    return angle;
}
