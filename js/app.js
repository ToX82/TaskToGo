/**
 * Main application file for TaskToGo
 */
class App {
    constructor() {
        this.isInitialized = false;
        this.version = '1.0.0';
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.isInitialized) return;

        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.init());
                return;
            }

            // Initialize i18n system first
            await this.waitForI18n();

            // Initialize UI (which also handles theme)
            ui.init();

            // Set up global error handling
            this.setupErrorHandling();

            // Set up periodic data backup
            this.setupDataBackup();

            // Initial data integrity check
            this.checkDataIntegrity();

            // Mark as initialized
            this.isInitialized = true;

            console.log(`TaskToGo v${this.version} initialized successfully`);

        } catch (error) {
            console.error('Failed to initialize TaskToGo:', error);
            this.showErrorMessage('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Wait for i18n system to be ready
     */
    async waitForI18n() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max

        while (!i18n.translations || Object.keys(i18n.translations).length === 0) {
            if (attempts >= maxAttempts) {
                throw new Error('i18n system failed to initialize');
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
    }

    /**
     * Setup global error handling
     */
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showErrorMessage('An unexpected error occurred. Please check the console for details.');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showErrorMessage('An unexpected error occurred. Please check the console for details.');
        });
    }

    /**
     * Setup periodic data backup to prevent data loss
     */
    setupDataBackup() {
        // Backup data every 5 minutes
        setInterval(() => {
            try {
                const data = storage.exportData();
                localStorage.setItem('taskToGo_backup', JSON.stringify(data));
                console.log('Data backup completed');
            } catch (error) {
                console.error('Failed to backup data:', error);
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    /**
     * Show error message to user
     */
    showErrorMessage(message) {
        const $errorDiv = $(`
            <div class="fixed top-4 left-4 right-4 bg-red-500 dark:bg-red-700 text-white p-4 rounded-lg shadow-lg z-50">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <iconify-icon icon="mdi:alert-circle" class="text-xl"></iconify-icon>
                        <span>${message}</span>
                    </div>
                    <button class="ml-4 hover:bg-red-600 dark:hover:bg-red-800 p-1 rounded">
                        <iconify-icon icon="mdi:close" class="text-lg"></iconify-icon>
                    </button>
                </div>
            </div>
        `);

        $errorDiv.find('button').on('click', () => {
            $errorDiv.remove();
        });

        $('body').append($errorDiv);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            $errorDiv.fadeOut(() => $errorDiv.remove());
        }, 10000);
    }

    /**
     * Export application data
     */
    exportData() {
        try {
            const data = storage.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `tasktogo-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            ui.showNotification(i18n.t('messages.success'), 'success');
        } catch (error) {
            console.error('Failed to export data:', error);
            ui.showNotification('Failed to export data', 'error');
        }
    }

    /**
     * Import application data
     */
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    // Validate data structure
                    if (!this.validateImportData(data)) {
                        reject(new Error('Invalid data format'));
                        return;
                    }

                    // Import data
                    if (storage.importData(data)) {
                        // Refresh UI and apply theme
                        ui.initTheme(); // Re-apply theme in case it was imported
                        ui.loadCategories();
                        ui.loadPriorities();
                        ui.renderTasks();

                        ui.showNotification(i18n.t('messages.success'), 'success');
                        resolve(true);
                    } else {
                        reject(new Error('Failed to import data'));
                    }
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Validate import data structure
     */
    validateImportData(data) {
        return (
            data &&
            typeof data === 'object' &&
            Array.isArray(data.tasks) &&
            Array.isArray(data.categories) &&
            Array.isArray(data.priorities)
        );
    }

    /**
     * Reset all application data
     */
    resetAllData() {
        if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
            try {
                storage.clearAll();
                // Re-initialize UI after reset
                ui.loadCategories();
                ui.loadPriorities();
                ui.renderTasks();
                ui.showNotification('All data has been reset', 'success');
            } catch (error) {
                console.error('Failed to reset data:', error);
                ui.showNotification('Failed to reset data', 'error');
            }
        }
    }

    /**
     * Get application statistics
     */
    getStatistics() {
        return TaskManager.getStatistics();
    }

    /**
     * Check for data corruption and attempt recovery
     */
    checkDataIntegrity() {
        try {
            const tasks = storage.getTasks();
            const categories = storage.getCategories();
            const priorities = storage.getPriorities();

            // Check for orphaned tasks
            const orphanedTasks = tasks.filter(task => {
                const hasValidCategory = !task.categoryId || categories.some(c => c.id === task.categoryId);
                const hasValidPriority = !task.priorityId || priorities.some(p => p.id === task.priorityId);
                return !hasValidCategory || !hasValidPriority;
            });

            if (orphanedTasks.length > 0) {
                console.warn(`Found ${orphanedTasks.length} orphaned tasks`);

                // Attempt to fix orphaned tasks
                const defaultCategory = categories[0];
                const defaultPriority = priorities.find(p => p.name.toLowerCase() === 'normal') || priorities[0];

                orphanedTasks.forEach(task => {
                    const updates = {};
                    if (task.categoryId && !categories.some(c => c.id === task.categoryId)) {
                        updates.categoryId = defaultCategory?.id || null;
                    }
                    if (task.priorityId && !priorities.some(p => p.id === task.priorityId)) {
                        updates.priorityId = defaultPriority?.id || null;
                    }

                    if (Object.keys(updates).length > 0) {
                        storage.updateTask(task.id, updates);
                    }
                });

                console.log('Orphaned tasks have been fixed');
                ui.renderTasks();
            }

            return {
                isHealthy: true,
                orphanedTasks: orphanedTasks.length,
                totalTasks: tasks.length,
                totalCategories: categories.length,
                totalPriorities: priorities.length
            };

        } catch (error) {
            console.error('Data integrity check failed:', error);
            return {
                isHealthy: false,
                error: error.message
            };
        }
    }

    /**
     * Get application version
     */
    getVersion() {
        return this.version;
    }

    /**
     * Check if application is initialized
     */
    isReady() {
        return this.isInitialized;
    }
}

// Create and initialize the application
const app = new App();

// Initialize when DOM is ready
$(document).ready(() => {
    app.init();
});

// Expose app globally for debugging
window.TaskToGoApp = app;