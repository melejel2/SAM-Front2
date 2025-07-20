/**
 * Security utilities for input validation and sanitization
 */

/**
 * Validates if a string is a safe URL
 * @param url - The URL to validate
 * @returns boolean indicating if the URL is safe
 */
export const isValidUrl = (url: string): boolean => {
    try {
        const urlObj = new URL(url);
        // Only allow http and https protocols
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
        return false;
    }
};

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input - The input string to sanitize
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
    if (typeof input !== 'string') return '';
    
    return input
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
};

/**
 * Validates email format
 * @param email - The email to validate
 * @returns boolean indicating if email is valid
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
};

/**
 * Validates if a redirect URL is safe (relative or same origin)
 * @param url - The redirect URL to validate
 * @returns boolean indicating if redirect is safe
 */
export const isSafeRedirect = (url: string): boolean => {
    // Allow relative URLs
    if (url.startsWith('/')) {
        return true;
    }
    
    // Check if URL is same origin
    try {
        const urlObj = new URL(url);
        return urlObj.origin === window.location.origin;
    } catch {
        return false;
    }
};

/**
 * Validates database name to prevent injection attacks
 * @param dbName - The database name to validate
 * @returns boolean indicating if database name is safe
 */
export const isValidDatabaseName = (dbName: string): boolean => {
    // Only allow alphanumeric characters, underscores, and hyphens
    const dbNameRegex = /^[a-zA-Z0-9_-]+$/;
    return dbNameRegex.test(dbName) && dbName.length <= 64;
};

/**
 * Validates username or email format for login
 * @param usernameOrEmail - The username or email to validate
 * @returns boolean indicating if the input is a valid username or email
 */
export const isValidUsernameOrEmail = (usernameOrEmail: string): boolean => {
    if (typeof usernameOrEmail !== 'string' || usernameOrEmail.trim().length === 0) {
        return false;
    }

    const trimmed = usernameOrEmail.trim();
    
    // Check if it's a valid email
    if (trimmed.includes('@')) {
        return isValidEmail(trimmed);
    }
    
    // Validate as username: allow alphanumeric, dots, underscores, hyphens
    // Minimum 2 characters, maximum 50 characters
    const usernameRegex = /^[a-zA-Z0-9._-]{2,50}$/;
    return usernameRegex.test(trimmed);
};

/**
 * Validates username format for login (no email)
 * @param username - The username to validate
 * @returns boolean indicating if the input is a valid username
 */
export const isValidUsername = (username: string): boolean => {
    if (typeof username !== 'string' || username.trim().length === 0) {
        return false;
    }

    const trimmed = username.trim();
    
    // Validate as username: allow alphanumeric, dots, underscores, hyphens
    // Minimum 2 characters, maximum 50 characters
    const usernameRegex = /^[a-zA-Z0-9._-]{2,50}$/;
    return usernameRegex.test(trimmed);
};