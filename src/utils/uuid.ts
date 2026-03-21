/**
 * Generate a UUID v4 compatible with all browsers and environments
 * Falls back to a custom implementation if crypto.randomUUID is not available
 */
export function generateUUID(): string {
    // Try native crypto.randomUUID first (modern browsers)
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    // Fallback: Generate UUID v4 manually
    // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Generate a simple unique ID (not UUID standard, but unique enough for request IDs)
 * Faster alternative if you don't need strict UUID v4 compliance
 */
export function generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
