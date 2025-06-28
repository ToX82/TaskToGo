/**
 * UI management for TaskToGo - Modern UI/UX seguendo .cursorrules
 */
class UI {
    constructor() {
        this.currentFilters = {
            categoryId: '',
            priorityId: '',
            showCompleted: false
        };
        this.currentEditingTask = null;
    }

    /**
     * Initialize UI and Theme
     */
    init() {
        this.initTheme();
        this.bindEvents();
        this.loadCategories();
        this.loadPriorities();
        this.renderTasks();
        this.updateFiltersUI();
    }

    /**
     * Initialize theme based on stored preference
     */
    initTheme() {
        this.currentTheme = storage.getTheme();
        this.applyTheme(this.currentTheme);
    }

    /**
     * Apply theme to the document
     */
    applyTheme(theme) {
        const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        $('html').toggleClass('dark', isDark);
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        $('#themeSwitcherBtn').on('click', () => this.rotateTheme());
        $('#languageSelect').on('change', (e) => i18n.setLanguage(e.target.value).then(() => this.renderTasks()));
        $('#quickAddForm').on('submit', (e) => { e.preventDefault(); this.quickAddTask(); });
        $('#addTaskBtn').on('click', () => this.showTaskModal());
        $('#settingsBtn').on('click', () => this.showSettingsModal());
        $('#categoryFilter, #priorityFilter').on('change', (e) => {
            this.currentFilters[e.target.id.replace('Filter', 'Id')] = e.target.value;
            this.renderTasks();
        });
        $('#toggleCompletedBtn').on('click', () => {
            this.currentFilters.showCompleted = !this.currentFilters.showCompleted;
            this.updateToggleCompletedButton();
            this.renderTasks();
        });
    }

    rotateTheme() {
        const themes = ['light', 'dark', 'system'];
        const currentIndex = themes.indexOf(this.currentTheme);
        this.currentTheme = themes[(currentIndex + 1) % themes.length];
        storage.setTheme(this.currentTheme);
        this.applyTheme(this.currentTheme);
        this.showNotification(`${i18n.t('settings.theme')}: ${i18n.t('settings.themeOptions.' + this.currentTheme)}`, 'info');
    }

    /**
     * Quick add task
     */
    quickAddTask() {
        const title = $('#quickTaskInput').val().trim();
        if (!title) return;

        const defaultCategory = storage.getCategories()[0];
        const defaultPriority = storage.getPriorities().find(p => p.name.toLowerCase() === 'normal') || storage.getPriorities()[0];

        const task = new Task({ title, categoryId: defaultCategory?.id, priorityId: defaultPriority?.id });
        if (!task.validate().isValid) return;

        storage.addTask(task.toObject());
        $('#quickTaskInput').val('');
        this.renderTasks();
        this.showNotification(i18n.t('messages.taskAdded'), 'success');
    }

    /**
     * Render tasks based on current filters
     */
    renderTasks() {
        const filters = { ...this.currentFilters, completed: this.currentFilters.showCompleted ? undefined : false };
        const tasks = TaskManager.getFilteredTasks(filters);

        $('#emptyState').toggleClass('hidden', tasks.length > 0);
        const $taskList = $('#taskList').empty();

        tasks.forEach(task => {
            const $taskElement = this.createTaskElement(task);
            $taskList.append($taskElement);
        });

        if (window.Iconify) window.Iconify.scan($taskList[0]);
    }

    /**
     * Create a modern task card element
     */
    createTaskElement(task) {
        const category = task.getCategory();
        const priority = task.getPriority();
        const priorityColor = priority ? priority.color : '#6b7280';
        const dueDate = task.getFormattedDueDate() ?
            `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${this.getDueDateClass(task.getDueDateStatus())} bg-opacity-10">
                <iconify-icon icon="mdi:calendar-blank-outline" class="mr-1"></iconify-icon>
                ${task.getFormattedDueDate()}
            </span>` : '';

        const categoryBadge = category ?
            `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white" style="background-color: ${category.color}">
                <iconify-icon icon="mdi:tag-outline" class="mr-1"></iconify-icon>
                ${this.escapeHtml(category.name)}
            </span>` : '';

        const taskHtml = `
            <div class="task-item bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600 p-4 hover:shadow-md transition-shadow duration-200 ${task.completed ? 'opacity-60' : ''}"
                 style="border-left: 4px solid ${priorityColor};" data-task-id="${task.id}">
                <div class="flex items-start gap-3">
                    <input type="checkbox" class="custom-checkbox w-5 h-5 mt-0.5 border-2 border-gray-300 dark:border-gray-500 rounded-md focus-ring" ${task.completed ? 'checked' : ''}>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="font-semibold text-gray-900 dark:text-gray-100 ${task.completed ? 'line-through' : ''}">${this.escapeHtml(task.title)}</h3>
                            <div class="task-actions flex items-center space-x-1">
                                <button class="edit-task-btn p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                    <iconify-icon icon="mdi:pencil-outline" class="text-sm"></iconify-icon>
                                </button>
                                <button class="delete-task-btn p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                    <iconify-icon icon="mdi:delete-outline" class="text-sm"></iconify-icon>
                                </button>
                            </div>
                        </div>
                        ${task.description ? `<p class="text-sm text-gray-600 dark:text-gray-400 mb-3">${this.escapeHtml(task.description)}</p>` : ''}
                        <div class="flex items-center gap-2 flex-wrap">
                            ${dueDate}
                            ${categoryBadge}
                        </div>
                    </div>
                </div>
            </div>`;

        const $task = $(taskHtml);
        $task.find('.custom-checkbox').on('change', () => this.toggleTaskCompletion(task.id));
        $task.find('.edit-task-btn').on('click', () => this.showTaskModal(task));
        $task.find('.delete-task-btn').on('click', () => this.deleteTask(task.id));
        return $task;
    }

    /**
     * Get CSS classes for due date badge
     */
    getDueDateClass(status) {
        switch (status) {
            case 'overdue': return 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900';
            case 'today': return 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900';
            case 'tomorrow': return 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900';
            default: return 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800';
        }
    }

    /**
     * Toggle task completion status
     */
    toggleTaskCompletion(taskId) {
        const task = storage.getTask(taskId);
        if (task) {
            const taskObj = Task.fromObject(task);
            taskObj.toggleCompleted();
            storage.updateTask(taskId, taskObj.toObject());
            this.renderTasks();
        }
    }

    /**
     * Delete a task with modern confirmation
     */
    deleteTask(taskId) {
        if (confirm(i18n.t('messages.confirmDeleteTask'))) {
            storage.deleteTask(taskId);
            $(`[data-task-id="${taskId}"]`).fadeOut(300, () => this.renderTasks());
            this.showNotification(i18n.t('messages.taskDeleted'), 'success');
        }
    }

    /**
     * Show modern modal with smooth animations
     */
    showModal(title, bodyHtml, footerHtml) {
        const $modal = $('#modal-template').clone().removeAttr('id');
        $modal.find('.modal-title').text(title);
        $modal.find('.modal-body').html(bodyHtml);
        $modal.find('.modal-footer').html(footerHtml);

        $('body').append($modal);
        $modal.removeClass('hidden');

        // Smooth animation
        setTimeout(() => {
            $modal.removeClass('opacity-0').addClass('modal-enter');
            $modal.find('.transform').removeClass('scale-95');
        }, 10);

        const closeModal = () => {
            $modal.addClass('opacity-0 modal-exit');
            $modal.find('.transform').addClass('scale-95');
            setTimeout(() => $modal.remove(), 300);
        };

        // Close on backdrop click
        $modal.on('click', (e) => {
            if (e.target === $modal[0]) closeModal();
        });

        // Close button
        $modal.find('.modal-close').on('click', closeModal);

        return { $modal, closeModal };
    }

    /**
     * Show modern task modal
     */
    showTaskModal(task = null) {
        const title = i18n.t(task ? 'task.editTask' : 'task.addNew');
        const categories = storage.getCategories().map(c =>
            `<option value="${c.id}" ${task?.categoryId === c.id ? 'selected' : ''}>${this.escapeHtml(c.name)}</option>`
        ).join('');
        const priorities = storage.getPriorities().sort((a,b) => a.order - b.order).map(p =>
            `<option value="${p.id}" ${task?.priorityId === p.id ? 'selected' : ''}>${this.escapeHtml(p.name)}</option>`
        ).join('');

        const bodyHtml = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${i18n.t('task.title')}</label>
                    <input type="text" id="taskTitle" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                           value="${this.escapeHtml(task?.title || '')}" placeholder="${i18n.t('task.title')}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${i18n.t('task.description')}</label>
                    <textarea id="taskDescription" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                              placeholder="${i18n.t('task.description')}">${this.escapeHtml(task?.description || '')}</textarea>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${i18n.t('task.category')}</label>
                        <select id="taskCategory" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100">
                            ${categories}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${i18n.t('task.priority')}</label>
                        <select id="taskPriority" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100">
                            ${priorities}
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${i18n.t('task.dueDate')}</label>
                    <input type="date" id="taskDueDate" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                           value="${task?.dueDate || ''}">
                </div>
            </div>
        `;

        const footerHtml = `
            <div class="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button class="cancel-btn px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg font-medium transition-colors">
                    ${i18n.t('common.cancel')}
                </button>
                <button class="save-btn px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-colors flex items-center space-x-2">
                    <iconify-icon icon="mdi:content-save-outline"></iconify-icon>
                    <span>${i18n.t('common.save')}</span>
                </button>
            </div>
        `;

        const { $modal, closeModal } = this.showModal(title, bodyHtml, footerHtml);
        $modal.find('.save-btn').on('click', () => { this.saveTask(task, closeModal, $modal); });
        $modal.find('.cancel-btn').on('click', closeModal);

        // Focus on title input
        setTimeout(() => $modal.find('#taskTitle').focus(), 100);
    }

    saveTask(task, closeModal, $modal) {
        const taskData = {
            id: task?.id,
            title: $modal.find('#taskTitle').val().trim(),
            description: $modal.find('#taskDescription').val(),
            categoryId: $modal.find('#taskCategory').val(),
            priorityId: $modal.find('#taskPriority').val(),
            dueDate: $modal.find('#taskDueDate').val(),
            completed: task?.completed || false,
        };

        const taskInstance = new Task(taskData);
        const validation = taskInstance.validate();
        if (!validation.isValid) {
            this.showNotification(validation.errors[0] || i18n.t('messages.fillRequired'), 'error');
            return;
        }

        const action = task ? storage.updateTask : storage.addTask;
        const message = task ? 'messages.taskUpdated' : 'messages.taskAdded';

        action.call(storage, taskInstance.toObject());
        this.renderTasks();
        this.showNotification(i18n.t(message), 'success');
        closeModal();
    }

    showSettingsModal() {
        // Implementazione settings modal con nuovo design
        const title = i18n.t('settings.title');
        const bodyHtml = `
            <div class="space-y-4">
                <div class="text-center py-4">
                    <iconify-icon icon="mdi:cog-outline" class="text-4xl text-blue-600 dark:text-blue-400 mb-2"></iconify-icon>
                    <p class="text-gray-600 dark:text-gray-400">${i18n.t('settings.title')}</p>
                </div>
                <div class="space-y-3">
                    <button id="exportBtn" class="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors">
                        <iconify-icon icon="mdi:download-outline"></iconify-icon>
                        <span>${i18n.t('settings.export')}</span>
                    </button>
                    <button id="importBtn" class="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors">
                        <iconify-icon icon="mdi:upload-outline"></iconify-icon>
                        <span>${i18n.t('settings.import')}</span>
                    </button>
                    <button id="resetBtn" class="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-800 transition-colors">
                        <iconify-icon icon="mdi:delete-sweep-outline"></iconify-icon>
                        <span>${i18n.t('settings.reset')}</span>
                    </button>
                </div>
            </div>
        `;

        const footerHtml = `
            <button class="close-btn w-full px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors">
                ${i18n.t('common.close')}
            </button>
        `;

        const { $modal, closeModal } = this.showModal(title, bodyHtml, footerHtml);
        $modal.find('.close-btn').on('click', closeModal);
        // Bind settings actions here
    }

    /**
     * Load categories into select dropdowns
     */
    loadCategories() {
        const categories = storage.getCategories();
        const options = categories.map(c => `<option value="${c.id}">${this.escapeHtml(c.name)}</option>`).join('');
        $('#categoryFilter').find('option:not(:first)').remove().end().append(options);
    }

    /**
     * Load priorities into select dropdowns
     */
    loadPriorities() {
        const priorities = storage.getPriorities().sort((a,b) => a.order - b.order);
        const options = priorities.map(p => `<option value="${p.id}">${this.escapeHtml(p.name)}</option>`).join('');
        $('#priorityFilter').find('option:not(:first)').remove().end().append(options);
    }

    /**
     * Update UI state of filter controls
     */
    updateFiltersUI() {
        $('#categoryFilter').val(this.currentFilters.categoryId);
        $('#priorityFilter').val(this.currentFilters.priorityId);
        this.updateToggleCompletedButton();
    }

    /**
     * Update "Toggle Completed" button text and style
     */
    updateToggleCompletedButton() {
        const show = this.currentFilters.showCompleted;
        $('#toggleCompletedBtn span').text(i18n.t(show ? 'task.hideCompleted' : 'task.showCompleted'));
        $('#toggleCompletedBtn').toggleClass('active', show);
    }

    /**
     * Show modern toast notification (bottom-right)
     */
    showNotification(message, type = 'info') {
        const typeConfig = {
            success: {
                bg: 'bg-green-50 dark:bg-green-900',
                border: 'border-green-200 dark:border-green-700',
                text: 'text-green-800 dark:text-green-200',
                icon: 'mdi:check-circle'
            },
            error: {
                bg: 'bg-red-50 dark:bg-red-900',
                border: 'border-red-200 dark:border-red-700',
                text: 'text-red-800 dark:text-red-200',
                icon: 'mdi:alert-circle'
            },
            info: {
                bg: 'bg-blue-50 dark:bg-blue-900',
                border: 'border-blue-200 dark:border-blue-700',
                text: 'text-blue-800 dark:text-blue-200',
                icon: 'mdi:information'
            }
        };

        const config = typeConfig[type];
        const $notification = $(`
            <div class="notification-toast ${config.bg} border ${config.border} ${config.text} px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
                <iconify-icon icon="${config.icon}" class="text-lg flex-shrink-0"></iconify-icon>
                <span class="font-medium">${this.escapeHtml(message)}</span>
                <button class="ml-2 hover:bg-black hover:bg-opacity-10 p-1 rounded">
                    <iconify-icon icon="mdi:close" class="text-sm"></iconify-icon>
                </button>
            </div>`);

        $('#notification-container').append($notification);
        if (window.Iconify) window.Iconify.scan($notification[0]);

        // Close button
        $notification.find('button').on('click', () => {
            $notification.addClass('removing');
            setTimeout(() => $notification.remove(), 300);
        });

        // Auto-remove after 3.5 seconds
        setTimeout(() => {
            if ($notification.parent().length) {
                $notification.addClass('removing');
                setTimeout(() => $notification.remove(), 300);
            }
        }, 3500);
    }

    /**
     * Escape HTML special characters
     */
    escapeHtml(text) {
        return text ? $('<div>').text(text).html() : '';
    }
}

// Initialize UI
const ui = new UI();
// Note: app.js will call ui.init()
// Note: app.js will call ui.init()