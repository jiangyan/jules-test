import aiosqlite
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

DATABASE_FILE = "todos.db"

app = FastAPI()

# CORS Middleware
origins = [
    "http://localhost",
    "http://localhost:8080", # Kept for general local server
    "http://127.0.0.1",
    "http://127.0.0.1:8080", # Kept for general local server
    "http://127.0.0.1:5500", # Added for user's specific frontend origin
    "http://localhost:5500",   # Added for user's specific frontend origin (alternative)
    "null" # To allow requests from `file:///` URLs
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model for Todo items
class TodoIn(BaseModel): # For input, id is not required
    date: str
    description: str
    completed: bool = False

class Todo(BaseModel): # For output, id is included
    id: int
    date: str
    description: str
    completed: bool = False

async def create_db_and_tables():
    async with aiosqlite.connect(DATABASE_FILE) as db: # MODIFIED
        await db.execute("""
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            description TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0
        );
        """)
        await db.commit()

@app.on_event("startup")
async def startup_event():
    await create_db_and_tables()

@app.get("/")
async def root():
    return {"message": "Hello from FastAPI Todo Backend"}

@app.get("/todos/dates_with_todos/{year}/{month}", response_model=List[str])
async def get_dates_with_todos(year: int, month: int):
    # Ensure month is two digits (e.g., 01, 02, ..., 12)
    month_str = f"{month:02d}"
    date_pattern = f"{year}-{month_str}-%" # SQL LIKE pattern for YYYY-MM-DD
    
    dates_with_todos = []
    async with aiosqlite.connect(DATABASE_FILE) as db:
        db.row_factory = lambda cursor, row: row[0] # To get just the date string
        async with db.execute(
            "SELECT DISTINCT date FROM todos WHERE date LIKE ?", 
            (date_pattern,)
        ) as cursor:
            dates_with_todos = await cursor.fetchall()
            
    if dates_with_todos is None: # Should return empty list if no rows, but defensive
        return []
    return dates_with_todos

# CRUD operations

@app.post("/todos/", response_model=Todo)
async def create_todo(todo_in: TodoIn):
    async with aiosqlite.connect(DATABASE_FILE) as db: # MODIFIED
        db.row_factory = aiosqlite.Row 
        cursor = await db.execute(
            "INSERT INTO todos (date, description, completed) VALUES (?, ?, ?)",
            (todo_in.date, todo_in.description, 1 if todo_in.completed else 0)
        )
        await db.commit()
        todo_id = cursor.lastrowid
        # Fetch the created todo to return it
        async with db.execute("SELECT id, date, description, completed FROM todos WHERE id = ?", (todo_id,)) as cursor_select:
            created_todo_row = await cursor_select.fetchone()
            if created_todo_row:
                 return Todo(id=created_todo_row['id'], date=created_todo_row['date'], description=created_todo_row['description'], completed=bool(created_todo_row['completed']))
            else: 
                raise HTTPException(status_code=500, detail="Failed to retrieve created todo")


@app.get("/todos/{date}", response_model=List[Todo])
async def get_todos_by_date(date: str):
    async with aiosqlite.connect(DATABASE_FILE) as db: # MODIFIED
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT id, date, description, completed FROM todos WHERE date = ?", (date,)) as cursor:
            rows = await cursor.fetchall()
            return [Todo(id=row['id'], date=row['date'], description=row['description'], completed=bool(row['completed'])) for row in rows]

@app.put("/todos/{todo_id}", response_model=Todo)
async def update_todo(todo_id: int, todo_in: TodoIn):
    async with aiosqlite.connect(DATABASE_FILE) as db: # MODIFIED
        db.row_factory = aiosqlite.Row
        # Check if todo exists
        async with db.execute("SELECT id FROM todos WHERE id = ?", (todo_id,)) as cursor_check:
            existing_todo = await cursor_check.fetchone()
            if not existing_todo:
                raise HTTPException(status_code=404, detail="Todo not found")

        await db.execute(
            "UPDATE todos SET date = ?, description = ?, completed = ? WHERE id = ?",
            (todo_in.date, todo_in.description, 1 if todo_in.completed else 0, todo_id)
        )
        await db.commit()
        # Fetch the updated todo to return it
        async with db.execute("SELECT id, date, description, completed FROM todos WHERE id = ?", (todo_id,)) as cursor_select:
            updated_todo_row = await cursor_select.fetchone()
            if updated_todo_row: 
                 return Todo(id=updated_todo_row['id'], date=updated_todo_row['date'], description=updated_todo_row['description'], completed=bool(updated_todo_row['completed']))
            else: 
                raise HTTPException(status_code=500, detail="Failed to retrieve updated todo")


@app.delete("/todos/{todo_id}")
async def delete_todo(todo_id: int):
    async with aiosqlite.connect(DATABASE_FILE) as db: # MODIFIED
        # Check if todo exists
        async with db.execute("SELECT id FROM todos WHERE id = ?", (todo_id,)) as cursor_check:
            existing_todo = await cursor_check.fetchone()
            if not existing_todo:
                raise HTTPException(status_code=404, detail="Todo not found")
        
        await db.execute("DELETE FROM todos WHERE id = ?", (todo_id,))
        await db.commit()
        return {"message": "Todo deleted successfully"}
