/**
 * TaskService – facade che incapsula l'accesso a storage e TaskManager
 * Permette di separare la logica di dominio dalla UI.
 */
class TaskService {
    /**
     * Crea un nuovo task e lo salva nello storage
     * @param {Task} task
     * @returns {Task|null}
     */
    add(task) {
        const saved = storage.addTask(task.toObject());
        return saved ? Task.fromObject(saved) : null;
    }

    /**
     * Aggiorna un task esistente
     * @param {string} id
     * @param {object} updates
     * @returns {Task|null}
     */
    update(id, updates) {
        const updated = storage.updateTask(id, updates);
        return updated ? Task.fromObject(updated) : null;
    }

    /**
     * Elimina un task
     * @param {string} id
     * @returns {boolean}
     */
    delete(id) {
        return storage.deleteTask(id);
    }

    /**
     * Toggles completion
     * @param {string} id
     * @returns {Task|null}
     */
    toggleCompletion(id) {
        const taskObj = storage.getTask(id);
        if (!taskObj) return null;
        const task = Task.fromObject(taskObj);
        task.toggleCompleted();
        return this.update(id, task.toObject());
    }

    /**
     * Ottiene singolo task
     */
    get(id) {
        const task = storage.getTask(id);
        return task ? Task.fromObject(task) : null;
    }

    /**
     * Restituisce array di Task filtrati
     * @param {object} filters
     * @returns {Task[]}
     */
    list(filters = {}) {
        return TaskManager.getFilteredTasks(filters);
    }
}

// Istanza singleton globale
const taskService = new TaskService();
if (typeof module !== 'undefined') module.exports = taskService;