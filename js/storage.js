/**
 * Storage system for TaskToGo using localStorage
 */
class Storage {
    constructor() {
        this.keys = {
            tasks: 'taskToGo_tasks',
            categories: 'taskToGo_categories',
            priorities: 'taskToGo_priorities',
            settings: 'taskToGo_settings',
            theme: 'taskToGo_theme'
        };
        this.initializeDefaults();
    }

    /**
     * Initialize default data if not exists
     */
    initializeDefaults() {
        // Default categories
        if (!this.getCategories().length) {
            const defaultCategories = [
                { id: this.generateId(), name: 'Work', color: '#3B82F6' },
                { id: this.generateId(), name: 'Personal', color: '#10B981' },
                { id: this.generateId(), name: 'Shopping', color: '#F59E0B' },
                { id: this.generateId(), name: 'Health', color: '#EF4444' }
            ];
            this.setCategories(defaultCategories);
        }

        // Default priorities
        if (!this.getPriorities().length) {
            const defaultPriorities = [
                { id: this.generateId(), name: 'High', color: '#EF4444', order: 1 },
                { id: this.generateId(), name: 'Medium', color: '#F59E0B', order: 2 },
                { id: this.generateId(), name: 'Low', color: '#10B981', order: 3 },
                { id: this.generateId(), name: 'Normal', color: '#6B7280', order: 4 }
            ];
            this.setPriorities(defaultPriorities);
        }
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Get data from localStorage
     */
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    }

    /**
     * Set data to localStorage
     */
    set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    }

    /**
     * Remove data from localStorage
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }

    // Task operations
    getTasks() {
        return this.get(this.keys.tasks) || [];
    }

    setTasks(tasks) {
        return this.set(this.keys.tasks, tasks);
    }

    addTask(task) {
        const tasks = this.getTasks();
        task.id = this.generateId();
        task.createdAt = new Date().toISOString();
        task.updatedAt = new Date().toISOString();
        tasks.push(task);
        return this.setTasks(tasks) ? task : null;
    }

    updateTask(taskId, updates) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...updates, updatedAt: new Date().toISOString() };
            return this.setTasks(tasks) ? tasks[index] : null;
        }
        return null;
    }

    deleteTask(taskId) {
        const tasks = this.getTasks();
        const filteredTasks = tasks.filter(t => t.id !== taskId);
        return this.setTasks(filteredTasks);
    }

    getTask(taskId) {
        const tasks = this.getTasks();
        return tasks.find(t => t.id === taskId) || null;
    }

    // Category operations
    getCategories() {
        return this.get(this.keys.categories) || [];
    }

    setCategories(categories) {
        return this.set(this.keys.categories, categories);
    }

    addCategory(category) {
        const categories = this.getCategories();
        category.id = this.generateId();
        category.createdAt = new Date().toISOString();
        categories.push(category);
        return this.setCategories(categories) ? category : null;
    }

    updateCategory(categoryId, updates) {
        const categories = this.getCategories();
        const index = categories.findIndex(c => c.id === categoryId);
        if (index !== -1) {
            categories[index] = { ...categories[index], ...updates };
            return this.setCategories(categories) ? categories[index] : null;
        }
        return null;
    }

    deleteCategory(categoryId) {
        const categories = this.getCategories();
        const filteredCategories = categories.filter(c => c.id !== categoryId);

        // Update tasks that used this category
        const tasks = this.getTasks();
        const updatedTasks = tasks.map(task => {
            if (task.categoryId === categoryId) {
                return { ...task, categoryId: null, updatedAt: new Date().toISOString() };
            }
            return task;
        });
        this.setTasks(updatedTasks);

        return this.setCategories(filteredCategories);
    }

    getCategory(categoryId) {
        const categories = this.getCategories();
        return categories.find(c => c.id === categoryId) || null;
    }

    // Priority operations
    getPriorities() {
        return this.get(this.keys.priorities) || [];
    }

    setPriorities(priorities) {
        return this.set(this.keys.priorities, priorities);
    }

    addPriority(priority) {
        const priorities = this.getPriorities();
        priority.id = this.generateId();
        priority.createdAt = new Date().toISOString();
        priority.order = priority.order || priorities.length + 1;
        priorities.push(priority);
        return this.setPriorities(priorities) ? priority : null;
    }

    updatePriority(priorityId, updates) {
        const priorities = this.getPriorities();
        const index = priorities.findIndex(p => p.id === priorityId);
        if (index !== -1) {
            priorities[index] = { ...priorities[index], ...updates };
            return this.setPriorities(priorities) ? priorities[index] : null;
        }
        return null;
    }

    deletePriority(priorityId) {
        const priorities = this.getPriorities();
        const filteredPriorities = priorities.filter(p => p.id !== priorityId);

        // Update tasks that used this priority
        const tasks = this.getTasks();
        const normalPriority = priorities.find(p => p.name.toLowerCase() === 'normal');
        const defaultPriorityId = normalPriority ? normalPriority.id : null;

        const updatedTasks = tasks.map(task => {
            if (task.priorityId === priorityId) {
                return { ...task, priorityId: defaultPriorityId, updatedAt: new Date().toISOString() };
            }
            return task;
        });
        this.setTasks(updatedTasks);

        return this.setPriorities(filteredPriorities);
    }

    getPriority(priorityId) {
        const priorities = this.getPriorities();
        return priorities.find(p => p.id === priorityId) || null;
    }

    // Settings operations
    getSettings() {
        return this.get(this.keys.settings) || {};
    }

    setSettings(settings) {
        return this.set(this.keys.settings, settings);
    }

    getSetting(key, defaultValue = null) {
        const settings = this.getSettings();
        return settings[key] !== undefined ? settings[key] : defaultValue;
    }

    setSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        return this.setSettings(settings);
    }

    // Theme operations
    getTheme() {
        return localStorage.getItem(this.keys.theme) || 'system';
    }

    setTheme(theme) {
        localStorage.setItem(this.keys.theme, theme);
    }

    // Export/Import operations
    exportData() {
        return {
            tasks: this.getTasks(),
            categories: this.getCategories(),
            priorities: this.getPriorities(),
            settings: this.getSettings(),
            theme: this.getTheme(),
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
    }

    importData(data) {
        try {
            if (data.tasks) this.setTasks(data.tasks);
            if (data.categories) this.setCategories(data.categories);
            if (data.priorities) this.setPriorities(data.priorities);
            if (data.settings) this.setSettings(data.settings);
            if (data.theme) this.setTheme(data.theme);
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Clear all data
    clearAll() {
        Object.values(this.keys).forEach(key => {
            if (key !== this.keys.theme) {
                this.remove(key);
            }
        });
        this.initializeDefaults();
    }
}

// Initialize storage system
const storage = new Storage();