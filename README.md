# Calendar Todo List Application

This is a simple Calendar Todo List application with a Node.js/HTML/CSS/JavaScript frontend and a FastAPI (Python) backend, using SQLite for data storage.

## Project Structure

- `/backend`: Contains the FastAPI application, SQLite database, and related Python files.
- `/frontend`: Contains the HTML, CSS, and JavaScript files for the user interface.
- `/database`: (Initially created, but the database `todos.db` will be generated within the `/backend` directory by default).

## Features

- Display a monthly calendar.
- Select a date to view and manage todos.
- Add new todo items for a selected date.
- Mark todo items as completed or pending.
- Delete todo items.

## Setup and Running the Application

You will need Python 3.7+ and Node.js (for potential future frontend tools, though not strictly necessary for the current static setup) installed.

### 1. Backend (FastAPI)

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create a virtual environment (recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the FastAPI development server:**
    ```bash
    uvicorn main:app --reload
    ```
    The backend will typically be available at `http://localhost:8000`. The `todos.db` SQLite file will be created in the `backend` directory if it doesn't exist.

### 2. Frontend (HTML/CSS/JS)

1.  **Open the `index.html` file:**
    Navigate to the `frontend` directory in your file explorer.
    ```bash
    cd frontend 
    ```
    Then, simply open `index.html` in your preferred web browser (e.g., by double-clicking it or using `open index.html` on macOS, or `start index.html` on Windows).

    *Alternatively, you can use a simple HTTP server if you prefer (requires Node.js and npm):*
    ```bash
    # If you don't have live-server, install it globally (or use npx)
    # npm install -g live-server 
    cd frontend
    live-server
    ```
    This will typically serve the frontend at `http://localhost:8080` or a similar address.

### 3. Using the Application

1.  Once the backend is running and you have opened `frontend/index.html` in your browser:
2.  Use the month/year picker to select the desired month.
3.  Click on a day in the calendar to select it. The "Todos for [selected-date]" section will update.
4.  To add a new todo:
    *   Type the description in the "Todo description" input field.
    *   Click the "Add Todo" button.
5.  To mark a todo as complete/incomplete, click the corresponding button next to the todo item.
6.  To delete a todo, click the "Delete" button next to the todo item.

## API Endpoints (Backend)

The backend provides the following API endpoints (base URL: `http://localhost:8000`):

- `POST /todos/`: Create a new todo.
  - Body: `{ "date": "YYYY-MM-DD", "description": "string", "completed": false }`
- `GET /todos/{date}`: Get all todos for a specific date.
- `PUT /todos/{todo_id}`: Update a todo item.
  - Body: `{ "date": "YYYY-MM-DD", "description": "string", "completed": true }`
- `DELETE /todos/{todo_id}`: Delete a todo item.
