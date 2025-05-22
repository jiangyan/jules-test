// Basic structure and placeholders for script.js

document.addEventListener('DOMContentLoaded', () => {
    const monthYearPicker = document.getElementById('month-year-picker');
    const calendarGrid = document.getElementById('calendar-grid');
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const todoList = document.getElementById('todo-list');
    const todoDescriptionInput = document.getElementById('todo-description');
    const addTodoBtn = document.getElementById('add-todo-btn');

    let currentDate = new Date();
    let selectedFullDate = null; // To store YYYY-MM-DD

    // Set default value for month picker
    monthYearPicker.value = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;

    monthYearPicker.addEventListener('change', () => {
        const [year, month] = monthYearPicker.value.split('-');
        renderCalendar(parseInt(year), parseInt(month));
    });

    function renderCalendar(year, month) {
        calendarGrid.innerHTML = ''; // Clear previous calendar
        selectedDateDisplay.textContent = 'N/A';
        todoList.innerHTML = ''; // Clear todos

        const daysInMonth = new Date(year, month, 0).getDate();
        const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0 (Sun) - 6 (Sat)

        // Create header
        const header = document.createElement('div');
        header.classList.add('calendar-header');
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.textContent = day;
            header.appendChild(dayEl);
        });
        calendarGrid.appendChild(header);
        
        // Create empty cells for days before the first of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            calendarGrid.appendChild(emptyCell);
        }

        // Create cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-day');
            dayCell.textContent = day;
            dayCell.dataset.date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            
            dayCell.addEventListener('click', () => { // Corrected arrow function
                document.querySelectorAll('.calendar-day.selected').forEach(d => d.classList.remove('selected'));
                dayCell.classList.add('selected');
                selectedFullDate = dayCell.dataset.date;
                selectedDateDisplay.textContent = selectedFullDate;
                fetchTodosForDate(selectedFullDate);
            });
            calendarGrid.appendChild(dayCell);
        }
    }

    async function fetchTodosForDate(date) {
        todoList.innerHTML = '<li>Loading...</li>';
        try {
            // Assuming backend is running on port 8000
            const response = await fetch(`http://localhost:8000/todos/${date}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const todos = await response.json();
            renderTodos(todos);
        } catch (error) {
            console.error('Error fetching todos:', error);
            todoList.innerHTML = '<li>Error loading todos.</li>';
        }
    }

    function renderTodos(todos) {
        todoList.innerHTML = ''; // Clear existing todos
        if (todos.length === 0) {
            todoList.innerHTML = '<li>No todos for this date.</li>';
            return;
        }
        todos.forEach(todo => {
            const listItem = document.createElement('li');
            listItem.textContent = `${todo.description} (${todo.completed ? 'Completed' : 'Pending'})`;
            listItem.dataset.id = todo.id;

            // Add complete/incomplete button
            const completeButton = document.createElement('button');
            completeButton.textContent = todo.completed ? 'Mark Incomplete' : 'Mark Complete';
            completeButton.classList.add(todo.completed ? 'incomplete-btn' : 'complete-btn');
            completeButton.addEventListener('click', () => toggleTodoComplete(todo));
            
            // Add delete button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('delete-btn');
            deleteButton.addEventListener('click', () => deleteTodoItem(todo.id));

            listItem.appendChild(completeButton);
            listItem.appendChild(deleteButton);
            todoList.appendChild(listItem);
        });
    }

    addTodoBtn.addEventListener('click', async () => {
        const description = todoDescriptionInput.value.trim();
        if (!description) {
            alert('Please enter a todo description.');
            return;
        }
        if (!selectedFullDate) {
            alert('Please select a date from the calendar first.');
            return;
        }

        const newTodo = {
            date: selectedFullDate,
            description: description,
            completed: false
        };

        try {
            const response = await fetch('http://localhost:8000/todos/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newTodo),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // const createdTodo = await response.json(); // Not strictly needed to re-render
            fetchTodosForDate(selectedFullDate); // Refresh list
            todoDescriptionInput.value = ''; // Clear input
        } catch (error) {
            console.error('Error adding todo:', error);
            alert('Failed to add todo.');
        }
    });

    async function toggleTodoComplete(todo) {
        const updatedTodo = { ...todo, completed: !todo.completed }; // Corrected: create new object for Pydantic model
        // Pydantic model needs all fields, or FastAPI will complain.
        // We need to send all fields, not just 'completed'
        const todoToSend = { 
            id: updatedTodo.id, // id is not part of TodoIn, but needed for endpoint. Backend should ignore it.
            date: updatedTodo.date, 
            description: updatedTodo.description, 
            completed: updatedTodo.completed 
        };

        try {
            const response = await fetch(`http://localhost:8000/todos/${todo.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(todoToSend) // Send the full object for TodoIn
            });
            if (!response.ok) throw new Error('Failed to update todo');
            fetchTodosForDate(selectedFullDate); // Refresh
        } catch (error) {
            console.error('Error toggling todo complete:', error);
            alert('Failed to update todo.');
        }
    }

    async function deleteTodoItem(todoId) {
        if (!confirm('Are you sure you want to delete this todo?')) return;
        try {
            const response = await fetch(`http://localhost:8000/todos/${todoId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete todo');
            fetchTodosForDate(selectedFullDate); // Refresh
        } catch (error) {
            console.error('Error deleting todo:', error);
            alert('Failed to delete todo.');
        }
    }

    // Initial render for current month
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth() + 1);
});
