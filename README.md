# CampaignPilot CRM - "Coffee Delights"

CampaignPilot is an AI-powered CRM designed specifically for retail and coffee brands. It allows marketing teams to effortlessly query their customer database, plan targeted campaigns using natural language AI, and simulate delivery metrics in real-time.

## Architecture overview

This project is structured as a monorepo containing three distinct microservices:

1. **`backend/` (Core API)**: A high-performance FastAPI server powered by SQLite and SQLAlchemy. It handles all business logic, database management, and integrates directly with Google's Gemini AI to parse marketing objectives into executable audience filters and campaign messages.
2. **`frontend/` (Web Application)**: A beautiful, modern React UI built with Vite. It features a custom glass-morphism design system using Vanilla CSS, complete with interactive analytics dashboards, live campaign tracking, and Google OAuth authentication.
3. **`channel-service/` (Delivery Simulator)**: A standalone, lightweight mock service that simulates external delivery providers (like Twilio or an Email Gateway). When a campaign is launched, it asynchronously sends realistic delivery events (delivered, read, clicked) back to the main backend via webhooks.

## Tech Stack

- **Frontend**: React 18, Vite, Axios, Recharts
- **Backend**: FastAPI, Python 3.10+, SQLAlchemy, SQLite
- **AI Integration**: Google GenAI SDK (Gemini)
- **Authentication**: Google OAuth 2.0

## Setup & Installation

### 1. The Core Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env # Fill in your GEMINI_API_KEY
python seed.py # Seeds the database with fake "Coffee Delights" data
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. The Channel Simulator
Open a new terminal window:
```bash
cd channel-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### 3. The React Frontend
Open a third terminal window:
```bash
cd frontend
npm install
cp .env.example .env # Ensure Google OAuth Client ID is set
npm run dev
```

## Key Features
- **AI Campaign Planning:** Type "Give a buy 1 get 1 offer to high spenders" and watch the AI auto-generate the audience filters, messaging, and estimated conversion rates.
- **Audience Segmentation:** Powerful backend filtering allowing you to target users by total spend, last order date, age, and preferred channels.
- **Mock Delivery Webhooks:** Campaigns transition from `draft` to `launched`, triggering real-time background simulations of message delivery.
- **Interactive Dashboards:** Track your revenue, conversion rates, and campaign funnel drop-offs visually.
