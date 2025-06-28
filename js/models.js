/**
 * Model classes for TaskToGo
 */

/**
 * Task model
 */
class Task {
    constructor(data = {}) {
        this.id = data.id || null;
        this.title = data.title || '';
        this.description = data.description || '';
        this.categoryId = data.categoryId || null;
        this.priorityId = data.priorityId || null;
        this.completed = data.completed || false;
        this.dueDate = data.dueDate || null;
        this.createdAt = data.createdAt || null;
        this.updatedAt = data.updatedAt || null;
        this.completedAt = data.completedAt || null;
    }

    /**
     * Validate task data
     */
    validate() {
        const errors = [];

        if (!this.title || this.title.trim().length === 0) {
            errors.push('Title is required');
        }

        if (this.title && this.title.length > 200) {
            errors.push('Title must be less than 200 characters');
        }

        if (this.description && this.description.length > 1000) {
            errors.push('Description must be less than 1000 characters');
        }

        if (this.dueDate && !this.isValidDate(this.dueDate)) {
            errors.push('Invalid due date');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Check if date is valid
     */
    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    /**
     * Get due date status
     */
    getDueDateStatus() {
        if (!this.dueDate) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dueDate = new Date(this.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'overdue';
        if (diffDays === 0) return 'today';
        if (diffDays === 1) return 'tomorrow';
        if (diffDays <= 7) return 'soon';
        return 'future';
    }

    /**
     * Get formatted due date
     */
    getFormattedDueDate() {
        if (!this.dueDate) return null;

        const date = new Date(this.dueDate);
        const status = this.getDueDateStatus();

        switch (status) {
            case 'today':
                return i18n.t('task.dueToday');
            case 'tomorrow':
                return i18n.t('task.dueTomorrow');
            case 'overdue':
                return `${i18n.t('task.overdue')} (${date.toLocaleDateString()})`;
            default:
                return date.toLocaleDateString();
        }
    }

    /**
     * Toggle completion status
     */
    toggleCompleted() {
        this.completed = !this.completed;
        this.completedAt = this.completed ? new Date().toISOString() : null;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Get category
     */
    getCategory() {
        if (!this.categoryId) return null;
        return storage.getCategory(this.categoryId);
    }

    /**
     * Get priority
     */
    getPriority() {
        if (!this.priorityId) return null;
        return storage.getPriority(this.priorityId);
    }

    /**
     * Convert to plain object
     */
    toObject() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            categoryId: this.categoryId,
            priorityId: this.priorityId,
            completed: this.completed,
            dueDate: this.dueDate,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            completedAt: this.completedAt
        };
    }

    /**
     * Create from plain object
     */
    static fromObject(data) {
        return new Task(data);
    }
}

/**
 * Category model
 */
class Category {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || '';
        this.color = data.color || '#3B82F6';
        this.createdAt = data.createdAt || null;
    }

    /**
     * Validate category data
     */
    validate() {
        const errors = [];

        if (!this.name || this.name.trim().length === 0) {
            errors.push('Category name is required');
        }

        if (this.name && this.name.length > 50) {
            errors.push('Category name must be less than 50 characters');
        }

        if (!this.isValidColor(this.color)) {
            errors.push('Invalid color format');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Check if color is valid hex color
     */
    isValidColor(color) {
        return /^#[0-9A-F]{6}$/i.test(color);
    }

    /**
     * Get task count for this category
     */
    getTaskCount() {
        const tasks = storage.getTasks();
        return tasks.filter(task => task.categoryId === this.id).length;
    }

    /**
     * Get completed task count for this category
     */
    getCompletedTaskCount() {
        const tasks = storage.getTasks();
        return tasks.filter(task => task.categoryId === this.id && task.completed).length;
    }

    /**
     * Convert to plain object
     */
    toObject() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            createdAt: this.createdAt
        };
    }

    /**
     * Create from plain object
     */
    static fromObject(data) {
        return new Category(data);
    }
}

/**
 * Priority model
 */
class Priority {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || '';
        this.color = data.color || '#6B7280';
        this.order = data.order || 1;
        this.createdAt = data.createdAt || null;
    }

    /**
     * Validate priority data
     */
    validate() {
        const errors = [];

        if (!this.name || this.name.trim().length === 0) {
            errors.push('Priority name is required');
        }

        if (this.name && this.name.length > 50) {
            errors.push('Priority name must be less than 50 characters');
        }

        if (!this.isValidColor(this.color)) {
            errors.push('Invalid color format');
        }

        if (!Number.isInteger(this.order) || this.order < 1) {
            errors.push('Order must be a positive integer');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Check if color is valid hex color
     */
    isValidColor(color) {
        return /^#[0-9A-F]{6}$/i.test(color);
    }

    /**
     * Get task count for this priority
     */
    getTaskCount() {
        const tasks = storage.getTasks();
        return tasks.filter(task => task.priorityId === this.id).length;
    }

    /**
     * Get completed task count for this priority
     */
    getCompletedTaskCount() {
        const tasks = storage.getTasks();
        return tasks.filter(task => task.priorityId === this.id && task.completed).length;
    }

    /**
     * Convert to plain object
     */
    toObject() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            order: this.order,
            createdAt: this.createdAt
        };
    }

    /**
     * Create from plain object
     */
    static fromObject(data) {
        return new Priority(data);
    }
}

/**
 * Task manager for business logic
 */
class TaskManager {
    /**
     * Get filtered tasks
     */
    static getFilteredTasks(filters = {}) {
        let tasks = storage.getTasks().map(task => Task.fromObject(task));

        // Filter by category
        if (filters.categoryId) {
            tasks = tasks.filter(task => task.categoryId === filters.categoryId);
        }

        // Filter by priority
        if (filters.priorityId) {
            tasks = tasks.filter(task => task.priorityId === filters.priorityId);
        }

        // Filter by completion status
        if (filters.completed !== undefined) {
            tasks = tasks.filter(task => task.completed === filters.completed);
        }

        // Filter by due date status
        if (filters.dueDateStatus) {
            tasks = tasks.filter(task => {
                const status = task.getDueDateStatus();
                return status === filters.dueDateStatus;
            });
        }

        // Sort tasks
        return this.sortTasks(tasks, filters.sortBy || 'createdAt', filters.sortOrder || 'desc');
    }

    /**
     * Sort tasks
     */
    static sortTasks(tasks, sortBy = 'createdAt', sortOrder = 'desc') {
        return tasks.sort((a, b) => {
            let valueA, valueB;

            switch (sortBy) {
                case 'title':
                    valueA = a.title.toLowerCase();
                    valueB = b.title.toLowerCase();
                    break;
                case 'dueDate':
                    valueA = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
                    valueB = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
                    break;
                case 'priority':
                    const priorityA = a.getPriority();
                    const priorityB = b.getPriority();
                    valueA = priorityA ? priorityA.order : 999;
                    valueB = priorityB ? priorityB.order : 999;
                    break;
                case 'category':
                    const categoryA = a.getCategory();
                    const categoryB = b.getCategory();
                    valueA = categoryA ? categoryA.name.toLowerCase() : 'zzz';
                    valueB = categoryB ? categoryB.name.toLowerCase() : 'zzz';
                    break;
                case 'completed':
                    valueA = a.completed;
                    valueB = b.completed;
                    break;
                default: // createdAt, updatedAt
                    valueA = new Date(a[sortBy] || 0);
                    valueB = new Date(b[sortBy] || 0);
            }

            if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
            if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }

    /**
     * Get task statistics
     */
    static getStatistics() {
        const tasks = storage.getTasks();
        const categories = storage.getCategories();
        const priorities = storage.getPriorities();

        return {
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.completed).length,
            pendingTasks: tasks.filter(t => !t.completed).length,
            overdueTasks: tasks.filter(t => {
                const task = Task.fromObject(t);
                return task.getDueDateStatus() === 'overdue' && !t.completed;
            }).length,
            dueTodayTasks: tasks.filter(t => {
                const task = Task.fromObject(t);
                return task.getDueDateStatus() === 'today' && !t.completed;
            }).length,
            totalCategories: categories.length,
            totalPriorities: priorities.length
        };
    }
}