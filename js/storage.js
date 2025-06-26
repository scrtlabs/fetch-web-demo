/**
 * Storage Management for Medical Diagnostics Platform
 * Handles localStorage operations, data persistence, and caching
 */

class StorageManager {
    constructor(prefix = 'medical_app_') {
        this.prefix = prefix;
        this.isAvailable = this.checkStorageAvailability();
        this.cache = new Map();
        this.listeners = new Map();
    }

    /**
     * Check if localStorage is available
     */
    checkStorageAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('localStorage is not available:', e);
            return false;
        }
    }

    /**
     * Generate storage key with prefix
     */
    getKey(key) {
        return this.prefix + key;
    }

    /**
     * Set item in storage
     */
    setItem(key, value, options = {}) {
        const storageKey = this.getKey(key);

        try {
            const data = {
                value,
                timestamp: Date.now(),
                expires: options.expires ? Date.now() + options.expires : null,
                version: options.version || 1
            };

            const serialized = JSON.stringify(data);

            if (this.isAvailable) {
                localStorage.setItem(storageKey, serialized);
            }

            // Update cache
            this.cache.set(key, data);

            // Trigger listeners
            this.triggerListeners(key, value, 'set');

            return true;
        } catch (error) {
            console.error('Error setting storage item:', error);
            return false;
        }
    }

    /**
     * Get item from storage
     */
    getItem(key, defaultValue = null) {
        const storageKey = this.getKey(key);

        try {
            // Check cache first
            if (this.cache.has(key)) {
                const cached = this.cache.get(key);
                if (this.isValidData(cached)) {
                    return cached.value;
                } else {
                    this.cache.delete(key);
                }
            }

            // Check localStorage
            if (this.isAvailable) {
                const stored = localStorage.getItem(storageKey);
                if (stored) {
                    const data = JSON.parse(stored);

                    if (this.isValidData(data)) {
                        this.cache.set(key, data);
                        return data.value;
                    } else {
                        // Data is expired or invalid, remove it
                        this.removeItem(key);
                    }
                }
            }

            return defaultValue;
        } catch (error) {
            console.error('Error getting storage item:', error);
            return defaultValue;
        }
    }

    /**
     * Check if stored data is valid (not expired)
     */
    isValidData(data) {
        if (!data || typeof data !== 'object') return false;
        if (data.expires && Date.now() > data.expires) return false;
        return true;
    }

    /**
     * Remove item from storage
     */
    removeItem(key) {
        const storageKey = this.getKey(key);

        try {
            if (this.isAvailable) {
                localStorage.removeItem(storageKey);
            }

            this.cache.delete(key);
            this.triggerListeners(key, null, 'remove');

            return true;
        } catch (error) {
            console.error('Error removing storage item:', error);
            return false;
        }
    }

    /**
     * Clear all items with this prefix
     */
    clear() {
        try {
            if (this.isAvailable) {
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(this.prefix)) {
                        keysToRemove.push(key);
                    }
                }

                keysToRemove.forEach(key => localStorage.removeItem(key));
            }

            this.cache.clear();
            this.triggerListeners('*', null, 'clear');

            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }

    /**
     * Get all keys
     */
    getKeys() {
        const keys = new Set();

        // From cache
        this.cache.forEach((_, key) => keys.add(key));

        // From localStorage
        if (this.isAvailable) {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keys.add(key.substring(this.prefix.length));
                }
            }
        }

        return Array.from(keys);
    }

    /**
     * Get storage usage information
     */
    getUsageInfo() {
        let totalSize = 0;
        let itemCount = 0;

        if (this.isAvailable) {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    const value = localStorage.getItem(key);
                    totalSize += key.length + (value ? value.length : 0);
                    itemCount++;
                }
            }
        }

        return {
            itemCount,
            totalSize,
            totalSizeFormatted: this.formatBytes(totalSize),
            maxSize: 5 * 1024 * 1024, // 5MB typical localStorage limit
            usagePercentage: (totalSize / (5 * 1024 * 1024)) * 100
        };
    }

    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Add change listener
     */
    addListener(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
    }

    /**
     * Remove change listener
     */
    removeListener(key, callback) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).delete(callback);
        }
    }

    /**
     * Trigger change listeners
     */
    triggerListeners(key, value, action) {
        // Specific key listeners
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => {
                try {
                    callback(key, value, action);
                } catch (error) {
                    console.error('Error in storage listener:', error);
                }
            });
        }

        // Global listeners
        if (this.listeners.has('*')) {
            this.listeners.get('*').forEach(callback => {
                try {
                    callback(key, value, action);
                } catch (error) {
                    console.error('Error in global storage listener:', error);
                }
            });
        }
    }

    /**
     * Export all data
     */
    exportData() {
        const data = {};
        const keys = this.getKeys();

        keys.forEach(key => {
            data[key] = this.getItem(key);
        });

        return {
            data,
            exported_at: new Date().toISOString(),
            version: '1.0'
        };
    }

    /**
     * Import data
     */
    importData(importedData, options = {}) {
        const { overwrite = false, validate = true } = options;

        try {
            if (validate && !this.validateImportData(importedData)) {
                throw new Error('Invalid import data format');
            }

            const results = {
                imported: 0,
                skipped: 0,
                errors: []
            };

            Object.entries(importedData.data || importedData).forEach(([key, value]) => {
                try {
                    if (!overwrite && this.getItem(key) !== null) {
                        results.skipped++;
                        return;
                    }

                    this.setItem(key, value);
                    results.imported++;
                } catch (error) {
                    results.errors.push({ key, error: error.message });
                }
            });

            return results;
        } catch (error) {
            throw new Error(`Import failed: ${error.message}`);
        }
    }

    /**
     * Validate import data structure
     */
    validateImportData(data) {
        if (!data || typeof data !== 'object') return false;

        // Check if it's our export format
        if (data.data && data.version) {
            return typeof data.data === 'object';
        }

        // Check if it's raw data object
        return typeof data === 'object';
    }
}

/**
 * Request Storage Manager
 * Specialized storage for diagnostic requests
 */
class RequestStorage extends StorageManager {
    constructor() {
        super('medical_requests_');
        this.requestsKey = 'all_requests';
        this.settingsKey = 'settings';
        this.preferencesKey = 'user_preferences';
    }

    /**
     * Save all requests
     */
    saveRequests(requests) {
        return this.setItem(this.requestsKey, requests, {
            version: 2
        });
    }

    /**
     * Load all requests
     */
    loadRequests() {
        return this.getItem(this.requestsKey, []);
    }

    /**
     * Save single request
     */
    saveRequest(request) {
        const requests = this.loadRequests();
        const existingIndex = requests.findIndex(r => r.id === request.id);

        if (existingIndex >= 0) {
            requests[existingIndex] = request;
        } else {
            requests.unshift(request);
        }

        return this.saveRequests(requests);
    }

    /**
     * Delete request
     */
    deleteRequest(requestId) {
        const requests = this.loadRequests();
        const filteredRequests = requests.filter(r => r.id !== requestId);
        return this.saveRequests(filteredRequests);
    }

    /**
     * Get request by ID
     */
    getRequest(requestId) {
        const requests = this.loadRequests();
        return requests.find(r => r.id === requestId) || null;
    }

    /**
     * Update request status
     */
    updateRequestStatus(requestId, status, additionalData = {}) {
        const requests = this.loadRequests();
        const request = requests.find(r => r.id === requestId);

        if (request) {
            request.status = status;
            request.lastUpdated = new Date().toISOString();
            Object.assign(request, additionalData);

            return this.saveRequests(requests);
        }

        return false;
    }

    /**
     * Get requests by status
     */
    getRequestsByStatus(status) {
        const requests = this.loadRequests();
        return requests.filter(r => r.status === status);
    }

    /**
     * Search requests
     */
    searchRequests(query, filters = {}) {
        const requests = this.loadRequests();
        const lowerQuery = query.toLowerCase();

        return requests.filter(request => {
            // Text search
            const matchesQuery = !query ||
                request.filename.toLowerCase().includes(lowerQuery) ||
                request.note.toLowerCase().includes(lowerQuery) ||
                request.id.toLowerCase().includes(lowerQuery);

            // Status filter
            const matchesStatus = !filters.status ||
                filters.status === 'all' ||
                request.status === filters.status;

            // Date range filter
            const matchesDateRange = !filters.dateFrom || !filters.dateTo ||
                (new Date(request.timestamp) >= new Date(filters.dateFrom) &&
                    new Date(request.timestamp) <= new Date(filters.dateTo));

            return matchesQuery && matchesStatus && matchesDateRange;
        });
    }

    /**
     * Get storage statistics
     */
    getStatistics() {
        const requests = this.loadRequests();
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const stats = {
            total: requests.length,
            byStatus: {},
            thisWeek: 0,
            thisMonth: 0,
            totalFileSize: 0,
            averageFileSize: 0
        };

        // Count by status
        requests.forEach(request => {
            stats.byStatus[request.status] = (stats.byStatus[request.status] || 0) + 1;

            const requestDate = new Date(request.timestamp);
            if (requestDate >= oneWeekAgo) stats.thisWeek++;
            if (requestDate >= oneMonthAgo) stats.thisMonth++;

            if (request.fileSize) {
                stats.totalFileSize += request.fileSize;
            }
        });

        stats.averageFileSize = requests.length > 0 ? stats.totalFileSize / requests.length : 0;

        return stats;
    }

    /**
     * Clean up old requests
     */
    cleanupOldRequests(maxAge = 90 * 24 * 60 * 60 * 1000) { // 90 days default
        const requests = this.loadRequests();
        const cutoffDate = new Date(Date.now() - maxAge);

        const activeRequests = requests.filter(request => {
            const requestDate = new Date(request.timestamp);
            return requestDate >= cutoffDate || request.status === 'pending' || request.status === 'processing';
        });

        const deletedCount = requests.length - activeRequests.length;

        if (deletedCount > 0) {
            this.saveRequests(activeRequests);
        }

        return {
            deletedCount,
            remainingCount: activeRequests.length
        };
    }

    /**
     * Save user settings
     */
    saveSettings(settings) {
        return this.setItem(this.settingsKey, settings, {
            version: 1
        });
    }

    /**
     * Load user settings
     */
    loadSettings() {
        return this.getItem(this.settingsKey, {
            theme: 'light',
            notifications: true,
            autoRefresh: true,
            defaultView: 'grid',
            itemsPerPage: 20
        });
    }

    /**
     * Save user preferences
     */
    savePreferences(preferences) {
        return this.setItem(this.preferencesKey, preferences, {
            version: 1
        });
    }

    /**
     * Load user preferences
     */
    loadPreferences() {
        return this.getItem(this.preferencesKey, {
            defaultApiKey: '',
            favoriteFilters: [],
            recentSearches: [],
            exportFormat: 'pdf'
        });
    }

    /**
     * Add to recent searches
     */
    addRecentSearch(query) {
        const preferences = this.loadPreferences();
        const searches = preferences.recentSearches || [];

        // Remove if already exists
        const filtered = searches.filter(s => s !== query);

        // Add to beginning and limit to 10
        filtered.unshift(query);
        preferences.recentSearches = filtered.slice(0, 10);

        return this.savePreferences(preferences);
    }

    /**
     * Clear recent searches
     */
    clearRecentSearches() {
        const preferences = this.loadPreferences();
        preferences.recentSearches = [];
        return this.savePreferences(preferences);
    }

    /**
     * Backup data to file
     */
    async backupToFile(filename = null) {
        const timestamp = new Date().toISOString().split('T')[0];
        const defaultFilename = `medical_diagnostics_backup_${timestamp}.json`;

        const exportData = {
            requests: this.loadRequests(),
            settings: this.loadSettings(),
            preferences: this.loadPreferences(),
            metadata: {
                version: '1.0',
                exported_at: new Date().toISOString(),
                total_requests: this.loadRequests().length
            }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || defaultFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return exportData;
    }

    /**
     * Restore data from file
     */
    async restoreFromFile(file, options = {}) {
        const { overwrite = false } = options;

        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const importData = JSON.parse(e.target.result);

                    if (!this.validateBackupData(importData)) {
                        reject(new Error('Invalid backup file format'));
                        return;
                    }

                    const results = {
                        requests: { imported: 0, skipped: 0 },
                        settings: false,
                        preferences: false
                    };

                    // Restore requests
                    if (importData.requests && Array.isArray(importData.requests)) {
                        const existingRequests = overwrite ? [] : this.loadRequests();
                        const existingIds = new Set(existingRequests.map(r => r.id));

                        importData.requests.forEach(request => {
                            if (!existingIds.has(request.id)) {
                                existingRequests.push(request);
                                results.requests.imported++;
                            } else {
                                results.requests.skipped++;
                            }
                        });

                        this.saveRequests(existingRequests);
                    }

                    // Restore settings
                    if (importData.settings && (overwrite || !this.getItem(this.settingsKey))) {
                        this.saveSettings(importData.settings);
                        results.settings = true;
                    }

                    // Restore preferences
                    if (importData.preferences && (overwrite || !this.getItem(this.preferencesKey))) {
                        this.savePreferences(importData.preferences);
                        results.preferences = true;
                    }

                    resolve(results);
                } catch (error) {
                    reject(new Error(`Failed to parse backup file: ${error.message}`));
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read backup file'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Validate backup data structure
     */
    validateBackupData(data) {
        if (!data || typeof data !== 'object') return false;

        // Check for required structure
        if (!data.metadata || !data.metadata.version) return false;

        // Validate requests array if present
        if (data.requests && !Array.isArray(data.requests)) return false;

        // Validate settings object if present
        if (data.settings && typeof data.settings !== 'object') return false;

        // Validate preferences object if present
        if (data.preferences && typeof data.preferences !== 'object') return false;

        return true;
    }
}

/**
 * Cache Manager for temporary data
 */
class CacheManager {
    constructor(maxSize = 50 * 1024 * 1024) { // 50MB default
        this.cache = new Map();
        this.maxSize = maxSize;
        this.currentSize = 0;
        this.accessTimes = new Map();
    }

    /**
     * Set cache item
     */
    set(key, value, ttl = 3600000) { // 1 hour default TTL
        const size = this.estimateSize(value);

        // Make room if needed
        while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
            this.evictLRU();
        }

        const item = {
            value,
            expires: Date.now() + ttl,
            size
        };

        // Remove existing item if present
        if (this.cache.has(key)) {
            this.currentSize -= this.cache.get(key).size;
        }

        this.cache.set(key, item);
        this.accessTimes.set(key, Date.now());
        this.currentSize += size;

        return true;
    }

    /**
     * Get cache item
     */
    get(key) {
        const item = this.cache.get(key);

        if (!item) return null;

        // Check if expired
        if (Date.now() > item.expires) {
            this.delete(key);
            return null;
        }

        // Update access time
        this.accessTimes.set(key, Date.now());

        return item.value;
    }

    /**
     * Delete cache item
     */
    delete(key) {
        const item = this.cache.get(key);
        if (item) {
            this.currentSize -= item.size;
            this.cache.delete(key);
            this.accessTimes.delete(key);
            return true;
        }
        return false;
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
        this.accessTimes.clear();
        this.currentSize = 0;
    }

    /**
     * Evict least recently used item
     */
    evictLRU() {
        let oldestKey = null;
        let oldestTime = Date.now();

        for (const [key, time] of this.accessTimes) {
            if (time < oldestTime) {
                oldestTime = time;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.delete(oldestKey);
        }
    }

    /**
     * Estimate object size in bytes
     */
    estimateSize(obj) {
        if (typeof obj === 'string') {
            return obj.length * 2; // Rough estimate for UTF-16
        }

        try {
            return JSON.stringify(obj).length * 2;
        } catch {
            return 1024; // Default estimate
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const now = Date.now();
        let expiredCount = 0;

        for (const [key, item] of this.cache) {
            if (now > item.expires) {
                expiredCount++;
            }
        }

        return {
            size: this.cache.size,
            currentSize: this.currentSize,
            maxSize: this.maxSize,
            usagePercentage: (this.currentSize / this.maxSize) * 100,
            expiredCount
        };
    }

    /**
     * Clean up expired items
     */
    cleanup() {
        const now = Date.now();
        const keysToDelete = [];

        for (const [key, item] of this.cache) {
            if (now > item.expires) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.delete(key));

        return keysToDelete.length;
    }
}

/**
 * Offline Storage Handler
 */
class OfflineStorage {
    constructor() {
        this.isOnline = navigator.onLine;
        this.pendingOperations = [];
        this.syncInProgress = false;

        // Listen for online/offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    /**
     * Handle online event
     */
    handleOnline() {
        this.isOnline = true;
        this.syncPendingOperations();
    }

    /**
     * Handle offline event
     */
    handleOffline() {
        this.isOnline = false;
    }

    /**
     * Queue operation for when online
     */
    queueOperation(operation) {
        this.pendingOperations.push({
            ...operation,
            timestamp: Date.now(),
            id: this.generateOperationId()
        });

        // Try to sync immediately if online
        if (this.isOnline) {
            this.syncPendingOperations();
        }
    }

    /**
     * Sync pending operations
     */
    async syncPendingOperations() {
        if (this.syncInProgress || this.pendingOperations.length === 0) {
            return;
        }

        this.syncInProgress = true;

        try {
            const results = [];

            for (const operation of this.pendingOperations) {
                try {
                    const result = await this.executeOperation(operation);
                    results.push({ operation, result, success: true });
                } catch (error) {
                    results.push({ operation, error, success: false });
                }
            }

            // Remove successful operations
            this.pendingOperations = this.pendingOperations.filter(op =>
                !results.find(r => r.operation.id === op.id && r.success)
            );

            return results;
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Execute queued operation
     */
    async executeOperation(operation) {
        // This would be implemented based on specific operation types
        // For now, just simulate success
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true };
    }

    /**
     * Generate operation ID
     */
    generateOperationId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Get sync status
     */
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            pendingOperations: this.pendingOperations.length,
            syncInProgress: this.syncInProgress
        };
    }
}

// Create global instances
const storage = new RequestStorage();
const cache = new CacheManager();
const offlineStorage = new OfflineStorage();

// Export for global use
window.StorageManager = StorageManager;
window.RequestStorage = RequestStorage;
window.CacheManager = CacheManager;
window.OfflineStorage = OfflineStorage;

// Export instances
window.storage = storage;
window.cache = cache;
window.offlineStorage = offlineStorage;