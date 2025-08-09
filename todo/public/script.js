// UCLA Todo App - JavaScript
class UCLATodoApp {
  constructor() {
    this.apiBaseUrl = "";
    this.username = localStorage.getItem("ucla-username") || "bruin";
    this.todos = JSON.parse(localStorage.getItem(this.getLocalKey())) || [];
    this.currentFilter = "all";
    this.currentSort = "date";
    this.currentView = "list";
    this.currentMonth = new Date();

    this.initializeElements();
    this.bindEvents();
    this.updateUserBadge();
    this.loadTodosFromServer().finally(() => {
      this.renderTodos();
      this.renderCalendar();
      this.updateStats();
    });
  }

  initializeElements() {
    this.todoForm = document.getElementById("todo-form");
    this.todoInput = document.getElementById("todo-input");
    this.prioritySelect = document.getElementById("priority");
    this.dueDateInput = document.getElementById("due-date");
    this.todoList = document.getElementById("todo-list");
    this.filterButtons = document.querySelectorAll(".filter-btn[data-filter]");
    this.sortSelect = document.getElementById("sort-select");
    this.statsElements = {
      total: document.getElementById("total-todos"),
      completed: document.getElementById("completed-todos"),
      pending: document.getElementById("pending-todos"),
    };
    // View toggle & calendar elements
    this.viewListBtn = document.getElementById("view-list-btn");
    this.viewCalendarBtn = document.getElementById("view-calendar-btn");
    this.listContainer = document.getElementById("list-container");
    this.calendarContainer = document.getElementById("calendar-container");
    this.calendarGrid = document.getElementById("calendar-grid");
    this.calendarMonthLabel = document.getElementById("calendar-month-label");
    this.calendarPrevBtn = document.getElementById("calendar-prev");
    this.calendarNextBtn = document.getElementById("calendar-next");
    this.calendarDayDetails = document.getElementById("calendar-day-details");
    // User controls
    this.usernameInput = document.getElementById("username-input");
    this.switchUserBtn = document.getElementById("switch-user-btn");
    this.currentUserBadge = document.getElementById("current-user-badge");
  }

  bindEvents() {
    // Form submission
    this.todoForm.addEventListener("submit", (e) => this.handleSubmit(e));

    // Filter buttons
    this.filterButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => this.handleFilter(e));
    });

    // Sort select
    this.sortSelect.addEventListener("change", (e) => this.handleSort(e));

    // Enter key in input
    this.todoInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.handleSubmit(e);
      }
    });

    // View toggles
    if (this.viewListBtn && this.viewCalendarBtn) {
      this.viewListBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.setView("list");
      });
      this.viewCalendarBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.setView("calendar");
      });
    }

    // Calendar navigation
    if (this.calendarPrevBtn && this.calendarNextBtn) {
      this.calendarPrevBtn.addEventListener("click", () => {
        this.currentMonth = new Date(
          this.currentMonth.getFullYear(),
          this.currentMonth.getMonth() - 1,
          1
        );
        this.renderCalendar();
      });
      this.calendarNextBtn.addEventListener("click", () => {
        this.currentMonth = new Date(
          this.currentMonth.getFullYear(),
          this.currentMonth.getMonth() + 1,
          1
        );
        this.renderCalendar();
      });
    }

    // User switching
    if (this.switchUserBtn) {
      this.switchUserBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const name = (this.usernameInput?.value || "").trim();
        if (!name) {
          this.showNotification("Please enter a username", "warning");
          return;
        }
        await this.switchUser(name);
      });
    }
  }

  handleSubmit(e) {
    e.preventDefault();

    const text = this.todoInput.value.trim();
    const priority = this.prioritySelect.value;
    const dueDateLocal = this.dueDateInput ? this.dueDateInput.value : "";
    const dueDateIso = dueDateLocal
      ? this.fromLocalDateTimeInputValue(dueDateLocal)
      : null;

    if (!text) {
      this.showNotification("Please enter a task!", "warning");
      return;
    }

    const todo = {
      id: Date.now() + Math.random(),
      text: text,
      priority: priority,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
      dueDate: dueDateIso,
    };

    this.todos.unshift(todo);
    this.saveTodos();
    this.syncToServer();
    this.renderTodos();
    this.renderCalendar();
    this.updateStats();

    // Reset form
    this.todoInput.value = "";
    this.prioritySelect.value = "medium";
    if (this.dueDateInput) this.dueDateInput.value = "";
    this.todoInput.focus();

    this.showNotification("Task added successfully! Go Bruins! 🐻", "success");
  }

  handleFilter(e) {
    const filter =
      (e.currentTarget && e.currentTarget.dataset.filter) ||
      e.target.closest("button[data-filter]")?.dataset.filter;
    if (!filter) return;

    // Update active button
    this.filterButtons.forEach((btn) => btn.classList.remove("active"));
    (e.currentTarget || e.target.closest("button[data-filter]")).classList.add(
      "active"
    );

    this.currentFilter = filter;
    this.renderTodos();
    if (this.currentView === "calendar") this.renderCalendar();
  }

  handleSort(e) {
    this.currentSort = e.target.value;
    this.renderTodos();
    if (this.currentView === "calendar") this.renderCalendar();
  }

  toggleTodo(id) {
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      todo.completedAt = todo.completed ? new Date().toISOString() : null;
      this.saveTodos();
      this.syncToServer();
      this.renderTodos();
      this.renderCalendar();
      this.updateStats();

      const message = todo.completed
        ? "Task completed! Great job, Bruin! 🎉"
        : "Task marked as pending";
      this.showNotification(message, "success");
    }
  }

  deleteTodo(id) {
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      this.todos = this.todos.filter((t) => t.id !== id);
      this.saveTodos();
      this.syncToServer();
      this.renderTodos();
      this.renderCalendar();
      this.updateStats();
      this.showNotification("Task deleted!", "info");
    }
  }

  editTodo(id) {
    const todo = this.todos.find((t) => t.id === id);
    if (!todo) return;

    const overlay = document.createElement("div");
    overlay.style.cssText = `
            position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 2000;
        `;
    const modal = document.createElement("div");
    modal.style.cssText = `
            background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); padding: 20px; width: min(520px, 92vw);
        `;
    modal.innerHTML = `
            <h3 style="margin-bottom: 12px; color: var(--ucla-blue);">Edit Task</h3>
            <div style="display:flex; flex-direction:column; gap:12px;">
                <label style="display:flex; flex-direction:column; gap:6px;">
                    <span style="font-weight:600;">Text</span>
                    <input id="edit-text" type="text" value="${this.escapeHtml(
                      todo.text
                    )}" style="padding:10px; border:2px solid var(--light-gray); border-radius:8px;">
                </label>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                    <label style="display:flex; flex-direction:column; gap:6px;">
                        <span style="font-weight:600;">Priority</span>
                        <select id="edit-priority" style="padding:10px; border:2px solid var(--light-gray); border-radius:8px;">
                            <option value="low" ${
                              todo.priority === "low" ? "selected" : ""
                            }>Low</option>
                            <option value="medium" ${
                              todo.priority === "medium" ? "selected" : ""
                            }>Medium</option>
                            <option value="high" ${
                              todo.priority === "high" ? "selected" : ""
                            }>High</option>
                        </select>
                    </label>
                    <label style="display:flex; flex-direction:column; gap:6px;">
                        <span style="font-weight:600;">Due</span>
                        <input id="edit-due" type="datetime-local" value="${
                          todo.dueDate
                            ? this.toLocalDateTimeInputValue(todo.dueDate)
                            : ""
                        }" style="padding:10px; border:2px solid var(--light-gray); border-radius:8px;">
                    </label>
                </div>
                <label style="display:flex; align-items:center; gap:10px;">
                    <input id="edit-completed" type="checkbox" ${
                      todo.completed ? "checked" : ""
                    }>
                    <span>Completed</span>
                </label>
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top: 8px;">
                    <button id="edit-cancel" class="filter-btn" style="border-color: var(--gray); color: var(--gray);">Cancel</button>
                    <button id="edit-save" class="filter-btn active">Save</button>
                </div>
            </div>
        `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = () => {
      if (overlay && overlay.parentNode)
        overlay.parentNode.removeChild(overlay);
    };
    modal.querySelector("#edit-cancel").addEventListener("click", (e) => {
      e.preventDefault();
      close();
    });
    modal.querySelector("#edit-save").addEventListener("click", (e) => {
      e.preventDefault();
      const newText = modal.querySelector("#edit-text").value.trim();
      const newPriority = modal.querySelector("#edit-priority").value;
      const newDueLocal = modal.querySelector("#edit-due").value;
      const newCompleted = modal.querySelector("#edit-completed").checked;
      if (!newText) {
        this.showNotification("Task text cannot be empty", "warning");
        return;
      }
      todo.text = newText;
      todo.priority = newPriority;
      todo.dueDate = newDueLocal
        ? this.fromLocalDateTimeInputValue(newDueLocal)
        : null;
      todo.completed = newCompleted;
      todo.completedAt = newCompleted
        ? todo.completedAt || new Date().toISOString()
        : null;
      this.saveTodos();
      this.syncToServer();
      this.renderTodos();
      this.renderCalendar();
      this.updateStats();
      this.showNotification("Task updated!", "success");
      close();
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
  }

  getFilteredTodos() {
    let filtered = [...this.todos];

    // Apply filter
    switch (this.currentFilter) {
      case "active":
        filtered = filtered.filter((todo) => !todo.completed);
        break;
      case "completed":
        filtered = filtered.filter((todo) => todo.completed);
        break;
      default:
        // 'all' - no filtering needed
        break;
    }

    // Apply sorting
    switch (this.currentSort) {
      case "priority":
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        filtered.sort(
          (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
        );
        break;
      case "alphabetical":
        filtered.sort((a, b) => a.text.localeCompare(b.text));
        break;
      case "dueDate":
        filtered.sort((a, b) => {
          const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return aTime - bTime;
        });
        break;
      case "date":
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
                        <p>${
                          this.currentFilter === "all"
                            ? "Add your first task to get started!"
                            : `No ${this.currentFilter} tasks found.`
                        }</p>
                        ${
                          this.currentFilter !== "all"
                            ? '<button class="filter-btn" onclick="app.clearFilter()">Show All Tasks</button>'
                            : ""
                        }
                    </div>
                </li>
            `;
      return;
    }

    this.todoList.innerHTML = filteredTodos
      .map((todo) => this.createTodoElement(todo))
      .join("");

    // Bind events to new elements
    this.bindTodoEvents();
  }

  createTodoElement(todo) {
    const createdAt = new Date(todo.createdAt);
    const formattedCreatedAt = createdAt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const dueDate = todo.dueDate ? new Date(todo.dueDate) : null;
    const isOverdue =
      dueDate && !todo.completed && dueDate.getTime() < Date.now();
    const formattedDue = dueDate
      ? dueDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

    const priorityClass = todo.priority;
    const priorityText =
      todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1);

    return `
            <li class="todo-item ${
              todo.completed ? "completed" : ""
            }" data-id="${todo.id}">
                <div class="todo-checkbox ${
                  todo.completed ? "checked" : ""
                }" onclick="app.toggleTodo(${todo.id})"></div>
                <div class="todo-content">
                    <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                    <div class="todo-meta">
                        <div class="todo-date">
                            <i class="fas fa-calendar-alt"></i>
                            ${formattedCreatedAt}
                        </div>
                        <div class="todo-priority ${priorityClass}">${priorityText}</div>
                        ${
                          formattedDue
                            ? `<div class="todo-due ${
                                isOverdue ? "overdue" : ""
                              }"><i class="fas fa-clock"></i> ${formattedDue}</div>`
                            : ""
                        }
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="action-btn edit" onclick="app.editTodo(${
                      todo.id
                    })" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="app.deleteTodo(${
                      todo.id
                    })" title="Delete task">
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
    const completed = this.todos.filter((todo) => todo.completed).length;
    const pending = total - completed;

    this.statsElements.total.textContent = total;
    this.statsElements.completed.textContent = completed;
    this.statsElements.pending.textContent = pending;
  }

  saveTodos() {
    localStorage.setItem(this.getLocalKey(), JSON.stringify(this.todos));
  }

  clearFilter() {
    this.currentFilter = "all";
    this.filterButtons.forEach((btn) => btn.classList.remove("active"));
    this.filterButtons[0].classList.add("active");
    this.renderTodos();
    if (this.currentView === "calendar") this.renderCalendar();
  }

  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
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
      notification.style.transform = "translateX(0)";
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  getNotificationIcon(type) {
    switch (type) {
      case "success":
        return "fa-check-circle";
      case "warning":
        return "fa-exclamation-triangle";
      case "error":
        return "fa-times-circle";
      default:
        return "fa-info-circle";
    }
  }

  getNotificationColor(type) {
    switch (type) {
      case "success":
        return "var(--success)";
      case "warning":
        return "var(--warning)";
      case "error":
        return "var(--danger)";
      default:
        return "var(--ucla-blue)";
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Utility method to clear all todos (for testing)
  clearAllTodos() {
    if (
      confirm(
        "Are you sure you want to clear all tasks? This cannot be undone."
      )
    ) {
      this.todos = [];
      this.saveTodos();
      this.renderTodos();
      this.renderCalendar();
      this.updateStats();
      this.showNotification("All tasks cleared!", "info");
    }
  }

  // Export todos (for backup)
  exportTodos() {
    const dataStr = JSON.stringify(this.todos, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${this.username}-todos-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Import todos (for restore)
  importTodos() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
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
              this.syncToServer();
              this.renderTodos();
              this.renderCalendar();
              this.updateStats();
              this.showNotification("Todos imported successfully!", "success");
            } else {
              throw new Error("Invalid format");
            }
          } catch (error) {
            this.showNotification(
              "Error importing todos. Please check the file format.",
              "error"
            );
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  // -------- View and Calendar Methods --------
  setView(view) {
    if (view !== "list" && view !== "calendar") return;
    this.currentView = view;
    if (this.listContainer && this.calendarContainer) {
      this.listContainer.style.display = view === "list" ? "" : "none";
      this.calendarContainer.style.display = view === "calendar" ? "" : "none";
    }
    if (this.viewListBtn && this.viewCalendarBtn) {
      this.viewListBtn.classList.toggle("active", view === "list");
      this.viewCalendarBtn.classList.toggle("active", view === "calendar");
    }
    if (view === "calendar") {
      this.renderCalendar();
    }
  }

  renderCalendar() {
    if (!this.calendarGrid) return;

    // Clear grid
    this.calendarGrid.innerHTML = "";
    this.calendarDayDetails.innerHTML = "";

    const year = this.currentMonth.getFullYear();
    const monthIndex = this.currentMonth.getMonth();
    const firstOfMonth = new Date(year, monthIndex, 1);
    const firstWeekday = firstOfMonth.getDay(); // 0..6 (Sun..Sat)
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    // Month label
    if (this.calendarMonthLabel) {
      const monthName = firstOfMonth.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      this.calendarMonthLabel.textContent = monthName;
    }

    // Weekday headers
    const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (const name of weekdayNames) {
      const headerCell = document.createElement("div");
      headerCell.className = "calendar-weekday";
      headerCell.textContent = name;
      this.calendarGrid.appendChild(headerCell);
    }

    // Leading empty cells
    for (let i = 0; i < firstWeekday; i++) {
      const emptyCell = document.createElement("div");
      emptyCell.className = "calendar-cell empty";
      this.calendarGrid.appendChild(emptyCell);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, monthIndex, day);
      const tasksDue = this.getTodosDueOnDate(cellDate).filter(
        (t) => !t.completed
      );
      const cell = document.createElement("div");
      cell.className = "calendar-cell";
      if (this.isSameDate(cellDate, new Date())) {
        cell.classList.add("today");
      }
      const dateNumber = document.createElement("div");
      dateNumber.className = "date-number";
      dateNumber.textContent = String(day);
      cell.appendChild(dateNumber);

      if (tasksDue.length > 0) {
        const badge = document.createElement("div");
        badge.className = "calendar-badge";
        badge.textContent = `${tasksDue.length} due`;
        cell.appendChild(badge);
      }

      cell.addEventListener("click", () => {
        this.renderCalendarDayDetails(cellDate);
      });

      this.calendarGrid.appendChild(cell);
    }
  }

  renderCalendarDayDetails(dateObj) {
    if (!this.calendarDayDetails) return;
    const tasks = this.getTodosDueOnDate(dateObj);
    const friendly = dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    if (tasks.length === 0) {
      this.calendarDayDetails.innerHTML = `<div class="empty-state"><div class="empty-content"><h3>No tasks due on ${friendly}</h3></div></div>`;
      return;
    }
    const listHtml = tasks
      .sort((a, b) => {
        const at = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const bt = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return at - bt;
      })
      .map((t) => this.createTodoElement(t))
      .join("");
    this.calendarDayDetails.innerHTML = `
            <div style="margin-bottom:8px; font-weight:700; color: var(--ucla-blue);">Tasks due on ${friendly}</div>
            <ul class="todo-list">${listHtml}</ul>
        `;
  }

  getTodosDueOnDate(dateObj) {
    return this.todos.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return this.isSameDate(d, dateObj);
    });
  }

  isSameDate(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  toLocalDateTimeInputValue(isoString) {
    try {
      const d = new Date(isoString);
      const tzAdjusted = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      return tzAdjusted.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  }

  fromLocalDateTimeInputValue(localValue) {
    try {
      const d = new Date(localValue);
      return d.toISOString();
    } catch {
      return null;
    }
  }

  // -------- User & Server Methods --------
  getLocalKey() {
    return `ucla-todos-${this.username}`;
  }

  updateUserBadge() {
    if (this.currentUserBadge) {
      this.currentUserBadge.textContent = this.username;
    }
    if (this.usernameInput) this.usernameInput.value = this.username;
  }

  async switchUser(newUsername) {
    this.username = newUsername;
    localStorage.setItem("ucla-username", this.username);
    this.updateUserBadge();
    // Load from cache first
    this.todos = JSON.parse(localStorage.getItem(this.getLocalKey())) || [];
    this.renderTodos();
    this.renderCalendar();
    this.updateStats();
    // Fetch from server to refresh
    await this.loadTodosFromServer();
    this.renderTodos();
    this.renderCalendar();
    this.updateStats();
    this.showNotification(`Switched user to ${this.username}`, "success");
  }

  async loadTodosFromServer() {
    try {
      const res = await fetch(
        `/api/users/${encodeURIComponent(this.username)}/todos`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (Array.isArray(data)) {
        this.todos = data;
        this.saveTodos();
      }
    } catch (e) {
      console.warn("Using cached todos due to server error or offline.", e);
    }
  }

  async syncToServer() {
    try {
      await fetch(`/api/users/${encodeURIComponent(this.username)}/todos`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.todos),
      });
    } catch (e) {
      console.warn("Sync to server failed; will remain in local cache.", e);
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
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
        completedAt: null,
        dueDate: null,
      },
      {
        id: Date.now() + 2,
        text: "Add your first task using the input above",
        priority: "medium",
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
        dueDate: null,
      },
      {
        id: Date.now() + 3,
        text: "Check off tasks by clicking the checkbox",
        priority: "low",
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
        dueDate: null,
      },
    ];

    app.todos = sampleTodos;
    app.saveTodos();
    app.syncToServer();
    app.renderTodos();
    app.renderCalendar();
    app.updateStats();
  }
});

// Add keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Ctrl/Cmd + Enter to add todo
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    document.getElementById("todo-form").dispatchEvent(new Event("submit"));
  }

  // Escape to clear input
  if (e.key === "Escape") {
    document.getElementById("todo-input").value = "";
    document.getElementById("todo-input").blur();
  }
});
