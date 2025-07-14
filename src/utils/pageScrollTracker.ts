// Utility to track scroll hints shown per page
export class PageScrollTracker {
    private static shownPages = new Set<string>();

    static hasShownScrollHint(pageKey: string): boolean {
        return this.shownPages.has(pageKey);
    }

    static markScrollHintShown(pageKey: string): void {
        this.shownPages.add(pageKey);
    }

    static resetAllTracking(): void {
        this.shownPages.clear();
    }

    static resetPageTracking(pageKey: string): void {
        this.shownPages.delete(pageKey);
    }

    // Generate a page key based on the current pathname
    static generatePageKey(): string {
        return window.location.pathname;
    }
}