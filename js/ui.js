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
        this.initLanguage();
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
     * Initialize language based on stored preference
     */
    initLanguage() {
        const currentLanguage = i18n.currentLanguage || 'en';
        const languageIcons = {
            'en': 'circle-flags:us',
            'it': 'circle-flags:it',
            'fr': 'circle-flags:fr',
            'es': 'circle-flags:es',
            'de': 'circle-flags:de'
        };

        // Set the correct icon for current language
        $('#currentLanguageIcon').attr('icon', languageIcons[currentLanguage] || 'circle-flags:us');
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

        // Language dropdown events
        $('#languageSelectBtn').on('click', (e) => {
            e.stopPropagation();
            this.toggleLanguageDropdown();
        });

        $('.language-option').on('click', (e) => {
            const language = $(e.currentTarget).data('value');
            this.selectLanguage(language);
        });

        // Close dropdown when clicking outside
        $(document).on('click', (e) => {
            if (!$(e.target).closest('#languageSelectBtn, #languageDropdown').length) {
                this.closeLanguageDropdown();
            }
        });

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

        // Event delegation per task list – un solo listener per tipo di evento
        const $taskList = $('#taskList');

        // Toggle completion checkbox
        $taskList.off('change', '.custom-checkbox')
            .on('change', '.custom-checkbox', (e) => {
                const taskId = $(e.currentTarget).closest('.task-item').data('task-id');
                if (taskId) this.toggleTaskCompletion(taskId);
            });

        // Edit task button
        $taskList.off('click', '.edit-task-btn')
            .on('click', '.edit-task-btn', (e) => {
                const taskId = $(e.currentTarget).closest('.task-item').data('task-id');
                const task = storage.getTask(taskId);
                if (task) this.showTaskModal(Task.fromObject(task));
            });

        // Delete task button
        $taskList.off('click', '.delete-task-btn')
            .on('click', '.delete-task-btn', (e) => {
                const taskId = $(e.currentTarget).closest('.task-item').data('task-id');
                if (taskId) this.deleteTask(taskId);
            });

        // Remove image button
        $taskList.off('click', '.remove-image-btn')
            .on('click', '.remove-image-btn', (e) => {
                e.stopPropagation();
                const taskId = $(e.currentTarget).data('task-id');
                const imageId = $(e.currentTarget).data('image-id');
                if (taskId && imageId) this.removeTaskImage(taskId, imageId);
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
     * Toggle language dropdown visibility
     */
    toggleLanguageDropdown() {
        const $dropdown = $('#languageDropdown');
        const isVisible = !$dropdown.hasClass('hidden');

        if (isVisible) {
            this.closeLanguageDropdown();
        } else {
            this.openLanguageDropdown();
        }
    }

    /**
     * Open language dropdown
     */
    openLanguageDropdown() {
        $('#languageDropdown').removeClass('hidden');
    }

    /**
     * Close language dropdown
     */
    closeLanguageDropdown() {
        $('#languageDropdown').addClass('hidden');
    }

    /**
     * Select a language and update UI
     */
    selectLanguage(language) {
        const languageIcons = {
            'en': 'circle-flags:us',
            'it': 'circle-flags:it',
            'fr': 'circle-flags:fr',
            'es': 'circle-flags:es',
            'de': 'circle-flags:de'
        };

        // Update current language icon
        $('#currentLanguageIcon').attr('icon', languageIcons[language] || 'circle-flags:us');

        // Close dropdown
        this.closeLanguageDropdown();

        // Change language
        i18n.setLanguage(language).then(() => {
            this.renderTasks();
            this.showNotification(i18n.t('messages.languageChanged'), 'success');
        });
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

        taskService.add(task);
        $('#quickTaskInput').val('');
        this.renderTasks();
        this.showNotification(i18n.t('messages.taskAdded'), 'success');
    }

    /**
     * Render tasks based on current filters
     */
    renderTasks() {
        const filters = { ...this.currentFilters, completed: this.currentFilters.showCompleted ? undefined : false };
        const tasks = taskService.list(filters);

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

        // Compact due date badge
        const dueDate = task.getFormattedDueDate() ?
            `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${this.getDueDateClass(task.getDueDateStatus())} bg-opacity-10">
                <iconify-icon icon="mdi:calendar-blank-outline" class="text-xs mr-0.5"></iconify-icon>
                ${task.getFormattedDueDate()}
            </span>` : '';

        // Compact category badge
        const categoryBadge = category ?
            `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white" style="background-color: ${category.color}">
                <iconify-icon icon="mdi:tag-outline" class="text-xs mr-0.5"></iconify-icon>
                ${utils.escapeHtml(category.name)}
            </span>` : '';

        const taskHtml = `
            <div class="task-item bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600 p-2.5 hover:shadow-md transition-shadow ${task.completed ? 'opacity-60' : ''}" style="border-left: 3px solid ${priorityColor};" data-task-id="${task.id}">
                <div class="flex items-start gap-2">
                    <input type="checkbox" class="custom-checkbox w-4 h-4 mt-0.5 border-2 border-gray-300 dark:border-gray-500 rounded focus-ring" ${task.completed ? 'checked' : ''}>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-start mb-1">
                            <h3 class="font-medium text-sm text-gray-900 dark:text-gray-100 ${task.completed ? 'line-through' : ''} leading-tight">${utils.escapeHtml(task.title)}</h3>
                            <div class="task-actions flex items-center space-x-0.5 ml-2">
                                <button class="edit-task-btn p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                    <iconify-icon icon="mdi:pencil-outline" class="text-xs"></iconify-icon>
                                </button>
                                <button class="delete-task-btn p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                    <iconify-icon icon="mdi:delete-outline" class="text-xs"></iconify-icon>
                                </button>
                            </div>
                        </div>
                        ${task.description ? `<p class="text-xs text-gray-600 dark:text-gray-400 mb-1.5 leading-relaxed">${utils.autoLinkUrls(utils.escapeHtml(task.description))}</p>` : ''}
                        ${this.renderTaskImages(task)}
                        <div class="flex items-center gap-1.5 flex-wrap">
                            ${dueDate}
                            ${categoryBadge}
                        </div>
                    </div>
                </div>
            </div>`;

        const $task = $(taskHtml);
        return $task;
    }

    /**
     * Renderizza le immagini di un task
     */
    renderTaskImages(task) {
        const images = task.getImages ? task.getImages() : (task.images || []);
        if (!images.length) return '';

        const imageElements = images.map(img => {
            const imageData = typeof img === 'string' ? img : img.data;
            const imageId = typeof img === 'object' ? img.id : utils.generateId();

            return `
                <div class="task-image-container relative inline-block mr-2 mb-2">
                    <img src="${imageData}"
                         class="task-image max-w-24 max-h-24 object-cover rounded border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                         data-image-id="${imageId}"
                         onclick="ui.showImageModal('${imageData}')">
                    <button class="remove-image-btn absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center transition-colors"
                            data-task-id="${task.id}"
                            data-image-id="${imageId}"
                            title="${i18n.t('task.removeImage') || 'Remove image'}">
                        <iconify-icon icon="mdi:close" class="text-xs"></iconify-icon>
                    </button>
                </div>
            `;
        }).join('');

        return images.length > 0 ? `<div class="task-images mb-2">${imageElements}</div>` : '';
    }

    /**
     * Renderizza le immagini nel modal di modifica task
     */
    renderTaskModalImages(task) {
        if (!task || !task.images || !task.images.length) {
            return `<span class="text-gray-400 dark:text-gray-500 text-sm italic">${i18n.t('task.noImages') || 'No images'}</span>`;
        }

        const images = task.getImages ? task.getImages() : task.images;
        return images.map(img => {
            const imageData = typeof img === 'string' ? img : img.data;
            const imageId = typeof img === 'object' ? img.id : utils.generateId();

            return `
                <div class="modal-image-container relative inline-block">
                    <img src="${imageData}"
                         class="w-16 h-16 object-cover rounded border border-gray-200 dark:border-gray-600">
                    <button type="button" class="remove-modal-image-btn absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center"
                            data-image-id="${imageId}">
                        <iconify-icon icon="mdi:close" class="text-xs"></iconify-icon>
                    </button>
                </div>
            `;
        }).join('');
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
        taskService.toggleCompletion(taskId);
        this.renderTasks();
    }

    /**
     * Delete a task with modern confirmation
     */
    deleteTask(taskId) {
        if (confirm(i18n.t('messages.confirmDeleteTask'))) {
            taskService.delete(taskId);
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
            `<option value="${c.id}" ${task?.categoryId === c.id ? 'selected' : ''}>${utils.escapeHtml(c.name)}</option>`
        ).join('');
        const priorities = storage.getPriorities().sort((a,b) => a.order - b.order).map(p =>
            `<option value="${p.id}" ${task?.priorityId === p.id ? 'selected' : ''}>${utils.escapeHtml(p.name)}</option>`
        ).join('');

        const hasImages = task?.images && task.images.length > 0;
        const imageSectionHiddenClass = hasImages ? '' : 'hidden';

        const bodyHtml = `
            <div class="space-y-3 pr-1">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${i18n.t('task.title')}</label>
                    <input type="text" id="taskTitle" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                           value="${utils.escapeHtml(task?.title || '')}" placeholder="${i18n.t('task.title')}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${i18n.t('task.description')}</label>
                    <textarea id="taskDescription" rows="5" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                              placeholder="${i18n.t('task.description')}">${utils.escapeHtml(task?.description || '')}</textarea>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${i18n.t('task.dueDate')}</label>
                        <input type="date" id="taskDueDate" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                               value="${task?.dueDate || ''}">
                    </div>
                </div>
                <div id="imageSection" class="${imageSectionHiddenClass}">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">${i18n.t('task.images') || 'Images'}</label>
                    <div class="space-y-2">
                        <div id="taskImages" class="flex flex-wrap gap-2 min-h-12 p-2 border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-lg">
                            ${this.renderTaskModalImages(task)}
                        </div>
                        <div class="flex gap-2 flex-wrap">
                            <button type="button" id="addImageBtn" class="flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors text-sm">
                                <iconify-icon icon="mdi:image-plus"></iconify-icon>
                                <span>${i18n.t('task.addImage') || 'Add Image'}</span>
                            </button>
                            <span class="text-xs text-gray-500 dark:text-gray-400 self-center">${i18n.t('task.pasteImageHint') || 'Or paste image from clipboard'}</span>
                        </div>
                    </div>
                </div>
                <div id="showImagesToggle" class="${imageSectionHiddenClass ? 'block' : 'hidden'}">
                    <button type="button" class="text-blue-600 dark:text-blue-400 hover:underline text-sm">${i18n.t('task.addImage') || 'Add Image'}</button>
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

        // Setup image handling
        this.setupTaskModalImageHandling($modal, task);

        // Toggle sezione immagini
        $modal.find('#showImagesToggle button').on('click', () => {
            $modal.find('#imageSection').removeClass('hidden');
            $modal.find('#showImagesToggle').addClass('hidden');
        });

        // Rendo body scrollabile
        $modal.find('.modal-body').addClass('overflow-y-auto max-h-[75vh] pr-1');
        // Espando larghezza modal per layout 3 colonne
        $modal.find('.max-w-md').removeClass('max-w-md').addClass('sm:max-w-2xl');

        // Focus on title input
        setTimeout(() => $modal.find('#taskTitle').focus(), 100);
    }

    saveTask(task, closeModal, $modal) {
        const tempImages = $modal.data('tempImages') || [];
        const taskData = {
            id: task?.id,
            title: $modal.find('#taskTitle').val().trim(),
            description: $modal.find('#taskDescription').val(),
            categoryId: $modal.find('#taskCategory').val(),
            priorityId: $modal.find('#taskPriority').val(),
            dueDate: $modal.find('#taskDueDate').val(),
            images: tempImages,
            completed: task?.completed || false,
        };

        const taskInstance = new Task(taskData);
        const validation = taskInstance.validate();
        if (!validation.isValid) {
            this.showNotification(validation.errors[0] || i18n.t('messages.fillRequired'), 'error');
            return;
        }

        const isUpdate = Boolean(task);
        if (isUpdate) {
            taskService.update(task.id, taskInstance.toObject());
        } else {
            taskService.add(taskInstance);
        }

        const message = isUpdate ? 'messages.taskUpdated' : 'messages.taskAdded';
        this.renderTasks();
        this.showNotification(i18n.t(message), 'success');
        closeModal();
    }

    showSettingsModal() {
        // Modern & readable Settings modal
        const title = i18n.t('settings.title');

        // Modal body – grouped by purpose for better scan-ability
        const bodyHtml = `
            <div class="space-y-6">
                <!-- Manage entities section -->
                <div class="space-y-4">
                    <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">${i18n.t('settings.manageSection') || 'Manage'}</h4>
                    <div class="space-y-3">
                        <button id="manageCategoriesBtn" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-50 dark:bg-indigo-900 hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors text-indigo-700 dark:text-indigo-300">
                            <iconify-icon icon="mdi:tag-multiple-outline" class="text-lg"></iconify-icon>
                            <span class="flex-1 text-left">${i18n.t('settings.manageCategories') || 'Manage Categories'}</span>
                            <iconify-icon icon="mdi:chevron-right" class="text-sm opacity-60"></iconify-icon>
                        </button>
                        <button id="managePrioritiesBtn" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-purple-50 dark:bg-purple-900 hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors text-purple-700 dark:text-purple-300">
                            <iconify-icon icon="mdi:flag-outline" class="text-lg"></iconify-icon>
                            <span class="flex-1 text-left">${i18n.t('settings.managePriorities') || 'Manage Priorities'}</span>
                            <iconify-icon icon="mdi:chevron-right" class="text-sm opacity-60"></iconify-icon>
                        </button>
                    </div>
                </div>

                <!-- Backup / data section -->
                <div class="space-y-4">
                    <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">${i18n.t('settings.dataSection') || 'Data'}</h4>
                    <div class="space-y-3">
                        <button id="exportBtn" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800 transition-colors text-green-700 dark:text-green-300">
                            <iconify-icon icon="mdi:download-outline" class="text-lg"></iconify-icon>
                            <span class="flex-1 text-left">${i18n.t('settings.export')}</span>
                        </button>
                        <button id="importBtn" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors text-blue-700 dark:text-blue-300">
                            <iconify-icon icon="mdi:upload-outline" class="text-lg"></iconify-icon>
                            <span class="flex-1 text-left">${i18n.t('settings.import')}</span>
                        </button>
                        <button id="resetBtn" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900 hover:bg-red-100 dark:hover:bg-red-800 transition-colors text-red-700 dark:text-red-300">
                            <iconify-icon icon="mdi:delete-sweep-outline" class="text-lg"></iconify-icon>
                            <span class="flex-1 text-left">${i18n.t('settings.reset')}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Footer – single close button
        const footerHtml = `
            <button class="close-btn w-full px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors">
                ${i18n.t('common.close')}
            </button>
        `;

        const { $modal, closeModal } = this.showModal(title, bodyHtml, footerHtml);

        // Widen modal and make body scrollable for long content
        $modal.find('.max-w-md').removeClass('max-w-md').addClass('sm:max-w-lg');
        $modal.find('.modal-body').addClass('overflow-y-auto max-h-[75vh] pr-1');

        // Actions bindings
        $modal.find('.close-btn').on('click', closeModal);
        $modal.find('#manageCategoriesBtn').on('click', () => { closeModal(); this.showCategoryManager(); });
        $modal.find('#managePrioritiesBtn').on('click', () => { closeModal(); this.showPriorityManager(); });

        // Export data
        $modal.find('#exportBtn').on('click', () => {
            app.exportData();
        });

        // Import data (hidden input)
        const $fileInput = $('<input type="file" accept="application/json" class="hidden">');
        $('body').append($fileInput);
        $modal.find('#importBtn').on('click', () => {
            $fileInput.val('');
            $fileInput.one('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                app.importData(file)
                    .then(() => { closeModal(); $fileInput.remove(); })
                    .catch((err) => {
                        console.error('Import failed:', err);
                        ui.showNotification(i18n.t('messages.importFailed') || 'Failed to import', 'error');
                        $fileInput.remove();
                    });
            });
            $fileInput.trigger('click');
        });

        // Reset all data
        $modal.find('#resetBtn').on('click', () => {
            closeModal();
            app.resetAllData();
        });
    }

    /**
     * Load categories into select dropdowns
     */
    loadCategories() {
        const categories = storage.getCategories();
        const options = categories.map(c => `<option value="${c.id}">${utils.escapeHtml(c.name)}</option>`).join('');
        $('#categoryFilter').find('option:not(:first)').remove().end().append(options);
    }

    /**
     * Load priorities into select dropdowns
     */
    loadPriorities() {
        const priorities = storage.getPriorities().sort((a,b) => a.order - b.order);
        const options = priorities.map(p => `<option value="${p.id}">${utils.escapeHtml(p.name)}</option>`).join('');
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
                <span class="font-medium">${utils.escapeHtml(message)}</span>
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
     * Rimuovi un'immagine da un task
     */
    removeTaskImage(taskId, imageId) {
        const task = storage.getTask(taskId);
        if (!task) return;

        const taskInstance = Task.fromObject(task);
        taskInstance.removeImage(imageId);

        taskService.update(taskId, taskInstance.toObject());
        this.renderTasks();
        this.showNotification(i18n.t('messages.imageRemoved') || 'Image removed', 'success');
    }

    /**
     * Mostra modal per visualizzare un'immagine a schermo intero
     */
    showImageModal(imageSrc) {
        const bodyHtml = `
            <div class="text-center">
                <img src="${imageSrc}" class="max-w-full max-h-96 mx-auto rounded-lg shadow-lg">
            </div>
        `;

        const footerHtml = `
            <button class="close-btn w-full px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors">
                ${i18n.t('common.close')}
            </button>
        `;

        const { $modal, closeModal } = this.showModal(i18n.t('task.viewImage') || 'View Image', bodyHtml, footerHtml);
        $modal.find('.close-btn').on('click', closeModal);
    }

    /**
     * Show Category Manager modal (CRUD)
     */
    showCategoryManager() {
        const categories = storage.getCategories();
        const listHtml = categories.map(c => `
            <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-600 rounded-lg p-3">
                <div class="flex items-center gap-3">
                    <span class="w-5 h-5 rounded-full border" style="background-color: ${c.color};"></span>
                    <span class="font-medium text-gray-800 dark:text-gray-100">${utils.escapeHtml(c.name)}</span>
                </div>
                <div class="flex items-center gap-1">
                    <button class="edit-category-btn p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors" data-id="${c.id}">
                        <iconify-icon icon="mdi:pencil-outline" class="text-sm"></iconify-icon>
                    </button>
                    <button class="delete-category-btn p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors" data-id="${c.id}">
                        <iconify-icon icon="mdi:delete-outline" class="text-sm"></iconify-icon>
                    </button>
                </div>
            </div>
        `).join('');

        const bodyHtml = `
            <div class="space-y-3">
                ${listHtml || `<p class="text-center text-gray-500 dark:text-gray-400">${i18n.t('category.noCategories') || 'No categories yet.'}</p>`}
            </div>`;

        const footerHtml = `
            <div class="flex flex-col sm:flex-row gap-3 sm:justify-between">
                <button class="add-category-btn px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-colors flex items-center space-x-2">
                    <iconify-icon icon="mdi:plus"></iconify-icon>
                    <span>${i18n.t('category.add') || 'Add Category'}</span>
                </button>
                <button class="close-btn px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors">
                    ${i18n.t('common.close')}
                </button>
            </div>`;

        const { $modal, closeModal } = this.showModal(i18n.t('category.manage') || 'Manage Categories', bodyHtml, footerHtml);

        $modal.find('.close-btn').on('click', closeModal);
        $modal.find('.add-category-btn').on('click', () => {
            this.showCategoryFormModal(null, () => { closeModal(); this.showCategoryManager(); });
        });
        $modal.find('.edit-category-btn').on('click', (e) => {
            const id = $(e.currentTarget).data('id');
            const category = storage.getCategory(id);
            if (category) this.showCategoryFormModal(category, () => { closeModal(); this.showCategoryManager(); });
        });
        $modal.find('.delete-category-btn').on('click', (e) => {
            const id = $(e.currentTarget).data('id');
            if (confirm(i18n.t('messages.confirmDelete') || 'Delete?')) {
                storage.deleteCategory(id);
                this.loadCategories();
                this.renderTasks();
                this.showNotification(i18n.t('messages.success') || 'Deleted', 'success');
                closeModal();
                this.showCategoryManager();
            }
        });
    }

    /**
     * Show Category Form modal for create / edit
     */
    showCategoryFormModal(category = null, onSave = () => {}) {
        const isEdit = !!category;
        const title = isEdit ? (i18n.t('category.edit') || 'Edit Category') : (i18n.t('category.add') || 'Add Category');

        const bodyHtml = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${i18n.t('category.name') || 'Name'}</label>
                    <input type="text" id="categoryName" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100" value="${utils.escapeHtml(category?.name || '')}" placeholder="Category name">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${i18n.t('category.color') || 'Color'}</label>
                    <input type="color" id="categoryColor" class="w-full h-10 border-0 p-0 bg-transparent" value="${category?.color || '#3B82F6'}">
                </div>
            </div>`;

        const footerHtml = `
            <div class="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button class="cancel-btn px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg font-medium transition-colors">
                    ${i18n.t('common.cancel')}
                </button>
                <button class="save-btn px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-colors flex items-center space-x-2">
                    <iconify-icon icon="mdi:content-save-outline"></iconify-icon>
                    <span>${i18n.t('common.save')}</span>
                </button>
            </div>`;

        const { $modal, closeModal } = this.showModal(title, bodyHtml, footerHtml);
        $modal.find('.cancel-btn').on('click', closeModal);
        $modal.find('.save-btn').on('click', () => {
            const name = $modal.find('#categoryName').val().trim();
            const color = $modal.find('#categoryColor').val();
            if (!name) {
                this.showNotification(i18n.t('messages.fillRequired') || 'Please fill required fields', 'error');
                return;
            }
            if (isEdit) {
                storage.updateCategory(category.id, { name, color });
                this.showNotification(i18n.t('messages.success') || 'Saved', 'success');
            } else {
                storage.addCategory({ name, color });
                this.showNotification(i18n.t('messages.success') || 'Saved', 'success');
            }
            this.loadCategories();
            this.renderTasks();
            closeModal();
            onSave();
        });
        setTimeout(() => $modal.find('#categoryName').focus(), 100);
    }

    /**
     * Show Priority Manager modal (CRUD)
     */
    showPriorityManager() {
        const priorities = storage.getPriorities().sort((a,b) => a.order - b.order);
        const listHtml = priorities.map(p => `
            <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-600 rounded-lg p-3">
                <div class="flex items-center gap-3">
                    <span class="w-5 h-5 rounded-full border" style="background-color: ${p.color};"></span>
                    <span class="font-medium text-gray-800 dark:text-gray-100">${utils.escapeHtml(p.name)}</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">#${p.order}</span>
                </div>
                <div class="flex items-center gap-1">
                    <button class="edit-priority-btn p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors" data-id="${p.id}">
                        <iconify-icon icon="mdi:pencil-outline" class="text-sm"></iconify-icon>
                    </button>
                    <button class="delete-priority-btn p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors" data-id="${p.id}">
                        <iconify-icon icon="mdi:delete-outline" class="text-sm"></iconify-icon>
                    </button>
                </div>
            </div>
        `).join('');

        const bodyHtml = `
            <div class="space-y-3">
                ${listHtml || `<p class="text-center text-gray-500 dark:text-gray-400">${i18n.t('priority.noPriorities') || 'No priorities yet.'}</p>`}
            </div>`;

        const footerHtml = `
            <div class="flex flex-col sm:flex-row gap-3 sm:justify-between">
                <button class="add-priority-btn px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow-sm transition-colors flex items-center space-x-2">
                    <iconify-icon icon="mdi:plus"></iconify-icon>
                    <span>${i18n.t('priority.add') || 'Add Priority'}</span>
                </button>
                <button class="close-btn px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors">
                    ${i18n.t('common.close')}
                </button>
            </div>`;

        const { $modal, closeModal } = this.showModal(i18n.t('priority.manage') || 'Manage Priorities', bodyHtml, footerHtml);

        $modal.find('.close-btn').on('click', closeModal);
        $modal.find('.add-priority-btn').on('click', () => {
            this.showPriorityFormModal(null, () => { closeModal(); this.showPriorityManager(); });
        });
        $modal.find('.edit-priority-btn').on('click', (e) => {
            const id = $(e.currentTarget).data('id');
            const priority = storage.getPriority(id);
            if (priority) this.showPriorityFormModal(priority, () => { closeModal(); this.showPriorityManager(); });
        });
        $modal.find('.delete-priority-btn').on('click', (e) => {
            const id = $(e.currentTarget).data('id');
            if (confirm(i18n.t('messages.confirmDelete') || 'Delete?')) {
                storage.deletePriority(id);
                this.loadPriorities();
                this.renderTasks();
                this.showNotification(i18n.t('messages.success') || 'Deleted', 'success');
                closeModal();
                this.showPriorityManager();
            }
        });
    }

    /**
     * Show Priority Form modal
     */
    showPriorityFormModal(priority = null, onSave = () => {}) {
        const isEdit = !!priority;
        const title = isEdit ? (i18n.t('priority.edit') || 'Edit Priority') : (i18n.t('priority.add') || 'Add Priority');

        const bodyHtml = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${i18n.t('priority.name') || 'Name'}</label>
                    <input type="text" id="priorityName" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100" value="${utils.escapeHtml(priority?.name || '')}" placeholder="Priority name">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${i18n.t('priority.color') || 'Color'}</label>
                        <input type="color" id="priorityColor" class="w-full h-10 border-0 p-0 bg-transparent" value="${priority?.color || '#6B7280'}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${i18n.t('priority.order') || 'Order'}</label>
                        <input type="number" min="1" id="priorityOrder" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100" value="${priority?.order || 1}">
                    </div>
                </div>
            </div>`;

        const footerHtml = `
            <div class="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button class="cancel-btn px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg font-medium transition-colors">
                    ${i18n.t('common.cancel')}
                </button>
                <button class="save-btn px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow-sm transition-colors flex items-center space-x-2">
                    <iconify-icon icon="mdi:content-save-outline"></iconify-icon>
                    <span>${i18n.t('common.save')}</span>
                </button>
            </div>`;

        const { $modal, closeModal } = this.showModal(title, bodyHtml, footerHtml);
        $modal.find('.cancel-btn').on('click', closeModal);
        $modal.find('.save-btn').on('click', () => {
            const name = $modal.find('#priorityName').val().trim();
            const color = $modal.find('#priorityColor').val();
            const order = parseInt($modal.find('#priorityOrder').val(), 10) || 1;
            if (!name) {
                this.showNotification(i18n.t('messages.fillRequired') || 'Please fill required fields', 'error');
                return;
            }
            if (isEdit) {
                storage.updatePriority(priority.id, { name, color, order });
                this.showNotification(i18n.t('messages.success') || 'Saved', 'success');
            } else {
                storage.addPriority({ name, color, order });
                this.showNotification(i18n.t('messages.success') || 'Saved', 'success');
            }
            this.loadPriorities();
            this.renderTasks();
            closeModal();
            onSave();
        });
        setTimeout(() => $modal.find('#priorityName').focus(), 100);
    }

    /**
     * Configura la gestione delle immagini nel modal del task
     */
    setupTaskModalImageHandling($modal, task) {
        // Array per tenere traccia delle immagini temporanee
        $modal.data('tempImages', []);

        // Copia le immagini esistenti nell'array temporaneo
        if (task && task.images) {
            const existingImages = task.getImages ? task.getImages() : task.images;
            $modal.data('tempImages', [...existingImages]);
        }

        // Gestore per il pulsante "Add Image"
        $modal.find('#addImageBtn').on('click', () => {
            const $fileInput = $('<input type="file" accept="image/*" multiple class="hidden">');
            $('body').append($fileInput);

            $fileInput.on('change', async (e) => {
                const files = Array.from(e.target.files);
                for (const file of files) {
                    try {
                        const base64 = await utils.fileToBase64(file);
                        const resized = await utils.resizeBase64Image(base64);
                        this.addImageToModal($modal, resized);
                    } catch (error) {
                        console.error('Error processing image:', error);
                        this.showNotification(i18n.t('messages.imageError') || 'Error processing image', 'error');
                    }
                }
                $fileInput.remove();
            });

            $fileInput.trigger('click');
        });

        // Gestore per rimuovere immagini dal modal
        $modal.off('click', '.remove-modal-image-btn')
            .on('click', '.remove-modal-image-btn', (e) => {
                const imageId = $(e.currentTarget).data('image-id');
                this.removeImageFromModal($modal, imageId);
            });

        // Gestore per paste di immagini
        $modal.on('paste', async (e) => {
            const items = e.originalEvent.clipboardData?.items;
            if (!items) return;

            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) {
                        try {
                            const base64 = await utils.fileToBase64(file);
                            const resized = await utils.resizeBase64Image(base64);
                            this.addImageToModal($modal, resized);
                            this.showNotification(i18n.t('messages.imagePasted') || 'Image pasted', 'success');
                        } catch (error) {
                            console.error('Error pasting image:', error);
                            this.showNotification(i18n.t('messages.imageError') || 'Error processing image', 'error');
                        }
                    }
                }
            }
        });

        // Gestore per drag and drop di immagini
        const $dropZone = $modal.find('#taskImages');

        $dropZone.on('dragover', (e) => {
            e.preventDefault();
            $dropZone.addClass('drag-over');
        });

        $dropZone.on('dragleave', (e) => {
            e.preventDefault();
            if (!$dropZone[0].contains(e.relatedTarget)) {
                $dropZone.removeClass('drag-over');
            }
        });

        $dropZone.on('drop', async (e) => {
            e.preventDefault();
            $dropZone.removeClass('drag-over');

            const files = Array.from(e.originalEvent.dataTransfer.files);
            const imageFiles = files.filter(file => file.type.startsWith('image/'));

            for (const file of imageFiles) {
                try {
                    const base64 = await utils.fileToBase64(file);
                    const resized = await utils.resizeBase64Image(base64);
                    this.addImageToModal($modal, resized);
                } catch (error) {
                    console.error('Error processing dropped image:', error);
                    this.showNotification(i18n.t('messages.imageError') || 'Error processing image', 'error');
                }
            }

            if (imageFiles.length > 0) {
                this.showNotification(i18n.t('messages.imagesAdded') || 'Images added successfully', 'success');
            }
        });
    }

    /**
     * Aggiungi un'immagine al modal
     */
    addImageToModal($modal, imageData) {
        const tempImages = $modal.data('tempImages') || [];
        const imageObj = {
            id: utils.generateId(),
            data: imageData,
            type: imageData.match(/data:image\/([^;]+)/)?.[1] || 'unknown',
            addedAt: utils.nowISO()
        };

        tempImages.push(imageObj);
        $modal.data('tempImages', tempImages);

        this.updateModalImagesDisplay($modal);
    }

    /**
     * Rimuovi un'immagine dal modal
     */
    removeImageFromModal($modal, imageId) {
        const tempImages = $modal.data('tempImages') || [];
        const filteredImages = tempImages.filter(img => img.id !== imageId);
        $modal.data('tempImages', filteredImages);

        this.updateModalImagesDisplay($modal);
    }

    /**
     * Aggiorna la visualizzazione delle immagini nel modal
     */
    updateModalImagesDisplay($modal) {
        const tempImages = $modal.data('tempImages') || [];
        const $container = $modal.find('#taskImages');

        if (tempImages.length === 0) {
            $container.html(`<span class="text-gray-400 dark:text-gray-500 text-sm italic">${i18n.t('task.noImages') || 'No images'}</span>`);
            $modal.find('#imageSection').addClass('hidden');
            $modal.find('#showImagesToggle').removeClass('hidden');
            return;
        }

        $modal.find('#imageSection').removeClass('hidden');
        $modal.find('#showImagesToggle').addClass('hidden');

        const imageElements = tempImages.map(img => {
            return `
                <div class="modal-image-container relative inline-block">
                    <img src="${img.data}" class="w-16 h-16 object-cover rounded border border-gray-200 dark:border-gray-600">
                    <button type="button" class="remove-modal-image-btn absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center" data-image-id="${img.id}">
                        <iconify-icon icon="mdi:close" class="text-xs"></iconify-icon>
                    </button>
                </div>`;
        }).join('');

        $container.html(imageElements);

        // Re-scan icons
        if (window.Iconify) window.Iconify.scan($container[0]);
    }
}

// Initialize UI
const ui = new UI();
// Note: app.js will call ui.init()