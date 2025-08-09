// UCLA Todo App - JavaScript
class UCLATodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('ucla-todos')) || [];
        this.currentFilter = 'all';
        this.currentSort = 'date';
        
        this.initializeElements();
        this.bindEvents();
        this.renderTodos();
        this.updateStats();
    }

    initializeElements() {
        this.todoForm = document.getElementById('todo-form');
        this.todoInput = document.getElementById('todo-input');
        this.prioritySelect = document.getElementById('priority');
        this.todoList = document.getElementById('todo-list');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.sortSelect = document.getElementById('sort-select');
        this.statsElements = {
            total: document.getElementById('total-todos'),
            completed: document.getElementById('completed-todos'),
            pending: document.getElementById('pending-todos')
        };
    }

    bindEvents() {
        // Form submission
        this.todoForm.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Filter buttons
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e));
        });
        
        // Sort select
        this.sortSelect.addEventListener('change', (e) => this.handleSort(e));
        
        // Enter key in input
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSubmit(e);
            }
        });
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const text = this.todoInput.value.trim();
        const priority = this.prioritySelect.value;
        
        if (!text) {
            this.showNotification('Please enter a task!', 'warning');
            return;
        }
        
        const todo = {
            id: Date.now() + Math.random(),
            text: text,
            priority: priority,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };
        
        this.todos.unshift(todo);
        this.saveTodos();
        this.renderTodos();
        this.updateStats();
        
        // Reset form
        this.todoInput.value = '';
        this.prioritySelect.value = 'medium';
        this.todoInput.focus();
        
        this.showNotification('Task added successfully! Go Bruins! 🐻', 'success');
    }

    handleFilter(e) {
        const filter = e.target.dataset.filter;
        
        // Update active button
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        this.currentFilter = filter;
        this.renderTodos();
    }

    handleSort(e) {
        this.currentSort = e.target.value;
        this.renderTodos();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            todo.completedAt = todo.completed ? new Date().toISOString() : null;
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            
            const message = todo.completed ? 'Task completed! Great job, Bruin! 🎉' : 'Task marked as pending';
            this.showNotification(message, 'success');
        }
    }

    deleteTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            this.todos = this.todos.filter(t => t.id !== id);
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            this.showNotification('Task deleted!', 'info');
        }
    }

    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;
        
        const newText = prompt('Edit your task:', todo.text);
        if (newText !== null && newText.trim() !== '') {
            todo.text = newText.trim();
            this.saveTodos();
            this.renderTodos();
            this.showNotification('Task updated!', 'success');
        }
    }

    getFilteredTodos() {
        let filtered = [...this.todos];
        
        // Apply filter
        switch (this.currentFilter) {
            case 'active':
                filtered = filtered.filter(todo => !todo.completed);
                break;
            case 'completed':
                filtered = filtered.filter(todo => todo.completed);
                break;
            default:
                // 'all' - no filtering needed
                break;
        }
        
        // Apply sorting
        switch (this.currentSort) {
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                filtered.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
                break;
            case 'alphabetical':
                filtered.sort((a, b) => a.text.localeCompare(b.text));
                break;
            case 'date':
            default:
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }
        
        return filtered;
    }

    renderTodos() {
        const filteredTodos = this.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            this.todoList.innerHTML = `
                <li class="empty-state">
                    <div class="empty-content">
                        <i class="fas fa-clipboard-list" style="font-size: 3rem; color: var(--ucla-light-blue); margin-bottom: 15px;"></i>
                        <h3>No tasks found!</h3>
                        <p>${this.currentFilter === 'all' ? 'Add your first task to get started!' : `No ${this.currentFilter} tasks found.`}</p>
                        ${this.currentFilter !== 'all' ? '<button class="filter-btn" onclick="app.clearFilter()">Show All Tasks</button>' : ''}
                    </div>
                </li>
            `;
            return;
        }
        
        this.todoList.innerHTML = filteredTodos.map(todo => this.createTodoElement(todo)).join('');
        
        // Bind events to new elements
        this.bindTodoEvents();
    }

    createTodoElement(todo) {
        const date = new Date(todo.createdAt);
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const priorityClass = todo.priority;
        const priorityText = todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1);
        
        return `
            <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" onclick="app.toggleTodo(${todo.id})"></div>
                <div class="todo-content">
                    <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                    <div class="todo-meta">
                        <div class="todo-date">
                            <i class="fas fa-calendar-alt"></i>
                            ${formattedDate}
                        </div>
                        <div class="todo-priority ${priorityClass}">${priorityText}</div>
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="action-btn edit" onclick="app.editTodo(${todo.id})" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="app.deleteTodo(${todo.id})" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </li>
        `;
    }

    bindTodoEvents() {
        // Checkbox events are handled inline for better performance
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const pending = total - completed;
        
        this.statsElements.total.textContent = total;
        this.statsElements.completed.textContent = completed;
        this.statsElements.pending.textContent = pending;
    }

    saveTodos() {
        localStorage.setItem('ucla-todos', JSON.stringify(this.todos));
    }

    clearFilter() {
        this.currentFilter = 'all';
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        this.filterButtons[0].classList.add('active');
        this.renderTodos();
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            font-weight: 500;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'warning': return 'fa-exclamation-triangle';
            case 'error': return 'fa-times-circle';
            default: return 'fa-info-circle';
        }
    }

    getNotificationColor(type) {
        switch (type) {
            case 'success': return 'var(--success)';
            case 'warning': return 'var(--warning)';
            case 'error': return 'var(--danger)';
            default: return 'var(--ucla-blue)';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Utility method to clear all todos (for testing)
    clearAllTodos() {
        if (confirm('Are you sure you want to clear all tasks? This cannot be undone.')) {
            this.todos = [];
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            this.showNotification('All tasks cleared!', 'info');
        }
    }

    // Export todos (for backup)
    exportTodos() {
        const dataStr = JSON.stringify(this.todos, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ucla-todos-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    // Import todos (for restore)
    importTodos() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedTodos = JSON.parse(e.target.result);
                        if (Array.isArray(importedTodos)) {
                            this.todos = importedTodos;
                            this.saveTodos();
                            this.renderTodos();
                            this.updateStats();
                            this.showNotification('Todos imported successfully!', 'success');
                        } else {
                            throw new Error('Invalid format');
                        }
                    } catch (error) {
                        this.showNotification('Error importing todos. Please check the file format.', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new UCLATodoApp();
    
    // Add some sample todos for first-time users
    if (app.todos.length === 0) {
        const sampleTodos = [
            {
                id: Date.now() + 1,
                text: "Welcome to UCLA Student Todo! 🐻",
                priority: "high",
                completed: false,
                createdAt: new Date().toISOString(),
                completedAt: null
            },
            {
                id: Date.now() + 2,
                text: "Add your first task using the input above",
                priority: "medium",
                completed: false,
                createdAt: new Date().toISOString(),
                completedAt: null
            },
            {
                id: Date.now() + 3,
                text: "Check off tasks by clicking the checkbox",
                priority: "low",
                completed: false,
                createdAt: new Date().toISOString(),
                completedAt: null
            }
        ];
        
        app.todos = sampleTodos;
        app.saveTodos();
        app.renderTodos();
        app.updateStats();
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to add todo
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('todo-form').dispatchEvent(new Event('submit'));
    }
    
    // Escape to clear input
    if (e.key === 'Escape') {
        document.getElementById('todo-input').value = '';
        document.getElementById('todo-input').blur();
    }
});

// Add service worker for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
