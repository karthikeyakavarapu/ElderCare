# Elder Care App

A full-stack elder care management application built with a modern frontend and backend architecture.

## Project Structure

```
Elder care/
├── frontend/        # Frontend application
├── backend/         # Backend API server
├── supabase_schema.sql          # Database schema
├── create_missing_tables.sql    # Additional tables migration
└── supabase_reset.sql           # Database reset script
```

## Getting Started

### Prerequisites
- Node.js (for frontend)
- Python (for backend)
- Supabase account (for database)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env   # Add your Supabase credentials
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env   # Add your Supabase credentials
   ```

4. **Database Setup**
   - Create a Supabase project
   - Run `supabase_schema.sql` in the Supabase SQL editor
   - Run `create_missing_tables.sql` if needed

## Features

- Elder care management dashboard
- Backend API with Supabase integration
- Responsive frontend interface
