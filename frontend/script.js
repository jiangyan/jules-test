document.addEventListener('DOMContentLoaded', () => {
    const monthYearPicker = document.getElementById('month-year-picker');
    const calendarGrid = document.getElementById('calendar-grid');
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const todoList = document.getElementById('todo-list');
    const todoDescriptionInput = document.getElementById('todo-description');
    const addTodoBtn = document.getElementById('add-todo-btn');

    let currentDate = new Date();
    let selectedFullDate = null; 

    monthYearPicker.value = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;

    monthYearPicker.addEventListener('change', () => {
        const [year, month] = monthYearPicker.value.split('-');
        renderCalendar(parseInt(year), parseInt(month));
    });

    async function fetchAndMarkTodoDates(year, month) {
        try {
            const response = await fetch(`http://localhost:8000/todos/dates_with_todos/${year}/${month}`);
            if (!response.ok) {
                console.error('Failed to fetch dates with todos:', response.status);
                return;
            }
            const datesWithTodos = await response.json();

            document.querySelectorAll('.calendar-day.date-has-todos').forEach(cell => {
                cell.classList.remove('date-has-todos');
            });

            datesWithTodos.forEach(dateStr => {
                const dayCell = calendarGrid.querySelector(`.calendar-day[data-date="${dateStr}"]`);
                if (dayCell) {
                    dayCell.classList.add('date-has-todos');
                }
            });
        } catch (error) {
            console.error('Error fetching or marking dates with todos:', error);
        }
    }

    function renderCalendar(year, month) {
        calendarGrid.innerHTML = ''; 
        // selectedDateDisplay.textContent = 'N/A'; // Keep selected date if still valid
        // todoList.innerHTML = ''; // Keep todos if date still selected

        const daysInMonth = new Date(year, month, 0).getDate();
        const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); 

        const header = document.createElement('div');
        header.classList.add('calendar-header');
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.textContent = day;
            header.appendChild(dayEl);
        });
        calendarGrid.appendChild(header);
        
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            calendarGrid.appendChild(emptyCell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-day');
            dayCell.textContent = day;
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            dayCell.dataset.date = dateStr;
            
            if (dateStr === selectedFullDate) { // Re-apply selected class if this date was selected
                dayCell.classList.add('selected');
            }

            dayCell.addEventListener('click', () => {
                document.querySelectorAll('.calendar-day.selected').forEach(d => d.classList.remove('selected'));
                dayCell.classList.add('selected');
                selectedFullDate = dayCell.dataset.date;
                selectedDateDisplay.textContent = selectedFullDate;
                fetchTodosForDate(selectedFullDate);
            });
            calendarGrid.appendChild(dayCell);
        }
        
        fetchAndMarkTodoDates(year, month);

        // If a date was selected and is in the current month view, reload its todos.
        // Otherwise, clear the selection and todo list.
        const currentMonthStr = `${year}-${month.toString().padStart(2, '0')}`;
        if (selectedFullDate && selectedFullDate.startsWith(currentMonthStr)) {
            const stillSelectedCell = calendarGrid.querySelector(`.calendar-day[data-date="${selectedFullDate}"]`);
            if (stillSelectedCell) { // Should be true if selectedFullDate is in this month
                 if (!stillSelectedCell.classList.contains('selected')){ // If not already selected by above logic
                    stillSelectedCell.classList.add('selected');
                 }
                selectedDateDisplay.textContent = selectedFullDate;
                fetchTodosForDate(selectedFullDate);
            } else { // Should not happen if logic is correct
                selectedFullDate = null;
                selectedDateDisplay.textContent = 'N/A';
                todoList.innerHTML = '<li>Select a date.</li>';
            }
        } else if (selectedFullDate && !selectedFullDate.startsWith(currentMonthStr)) { 
            // If a date was selected but it's not in the current month/year view
            selectedFullDate = null;
            selectedDateDisplay.textContent = 'N/A';
            todoList.innerHTML = '<li>Select a date.</li>';
        } else {
             // Default state if no date is selected
            if (!selectedFullDate){ // only clear if no date is actually selected
                selectedDateDisplay.textContent = 'N/A';
                todoList.innerHTML = '<li>Select a date.</li>';
            }
        }
    }

    async function fetchTodosForDate(date) {
        todoList.innerHTML = '<li>Loading...</li>';
        try {
            const response = await fetch(`http://localhost:8000/todos/${date}`);
            if (!response.ok) {
                if (response.status === 404) { 
                    const todos = await response.json(); // Check if backend returns empty list on 404 for this path
                    if (todos && todos.length === 0) {
                         todoList.innerHTML = '<li>No todos for this date.</li>';
                    } else {
                         todoList.innerHTML = '<li>No todos for this date. (or error fetching)</li>'; // Or specific error
                    }
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const todos = await response.json();
            if(todos.length === 0){ // Explicitly check for empty array even on 200 OK
                todoList.innerHTML = '<li>No todos for this date.</li>';
                return;
            }
            renderTodos(todos);
        } catch (error) {
            console.error('Error fetching todos:', error);
            todoList.innerHTML = '<li>Error loading todos.</li>';
        }
    }

    function renderTodos(todos) {
        todoList.innerHTML = '';
        if (todos.length === 0) { // This check might be redundant if fetchTodosForDate handles it
            todoList.innerHTML = '<li>No todos for this date.</li>';
            return;
        }
        todos.forEach(todo => {
            const listItem = document.createElement('li');
            listItem.textContent = `${todo.description} (${todo.completed ? 'Completed' : 'Pending'})`;
            listItem.dataset.id = todo.id;

            const completeButton = document.createElement('button');
            completeButton.textContent = todo.completed ? 'Mark Incomplete' : 'Mark Complete';
            completeButton.classList.add(todo.completed ? 'incomplete-btn' : 'complete-btn');
            completeButton.addEventListener('click', () => toggleTodoComplete(todo));
            
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
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify(newTodo),
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            todoDescriptionInput.value = ''; 
            fetchTodosForDate(selectedFullDate); 
            const [year, month] = monthYearPicker.value.split('-');
            fetchAndMarkTodoDates(parseInt(year), parseInt(month)); 
        } catch (error) {
            console.error('Error adding todo:', error);
            alert('Failed to add todo.');
        }
    });

    async function toggleTodoComplete(todo) {
        const updatedTodoData = { date: todo.date, description: todo.description, completed: !todo.completed };
        try {
            const response = await fetch(`http://localhost:8000/todos/${todo.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedTodoData)
            });
            if (!response.ok) throw new Error('Failed to update todo');
            fetchTodosForDate(selectedFullDate); 
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
            fetchTodosForDate(selectedFullDate); 
            const [year, month] = monthYearPicker.value.split('-');
            fetchAndMarkTodoDates(parseInt(year), parseInt(month));
        } catch (error) {
            console.error('Error deleting todo:', error);
            alert('Failed to delete todo.');
        }
    }

    // Initial render
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth() + 1);
});
