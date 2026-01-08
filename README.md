# Myntra Reconciliation Platform

A Myntra-only seller reconciliation system that matches Order, Return, and Payment CSV files at the Sub Order ID level.

## Quick Start

### 1. Setup Supabase Database

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project (or use existing)
3. Go to **SQL Editor**
4. Copy and run the contents of `backend/supabase_schema.sql`
5. Copy your **Project URL** and **Anon Key** from Settings > API

### 2. Configure Backend

```bash
cd backend

# Edit .env file with your Supabase credentials
# SUPABASE_URL=https://your-project-id.supabase.co
# SUPABASE_ANON_KEY=your-anon-key

# Install dependencies
npm install

# Start server
npm run dev
```

Backend will run on: http://localhost:3001

### 3. Start Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend will run on: http://localhost:5173

## Usage

1. **Upload CSV Files**: Drag & drop or click to upload your Myntra CSV files:
   - ORDER.csv
   - CANCEL ORDER.csv
   - RETURN ORDER.csv
   - RETURN PAYMENT.csv

2. **Run Reconciliation**: Click "Run Reconciliation" to match orders with payments

3. **View Results**: See summary cards and detailed table with reconciliation status

4. **Export**: Download results as Excel with color-coded status

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/order` | Upload Order CSV |
| POST | `/api/upload/cancel` | Upload Cancel CSV |
| POST | `/api/upload/return` | Upload Return CSV |
| POST | `/api/upload/return-payment` | Upload Return Payment CSV |
| POST | `/api/reconcile` | Run Reconciliation |
| GET | `/api/summary` | Get Summary Metrics |
| GET | `/api/reconciliation-table` | Get Results Table |
| GET | `/api/export/excel` | Export Excel Report |
| DELETE | `/api/clear` | Clear All Data |

## Reconciliation Logic

### Item Status
- **Delivered**: Order present, not in returns or cancellations
- **Returned**: Order found in RETURN ORDER.csv
- **Cancelled**: Order found in CANCEL ORDER.csv

### Reconciliation Status
| Condition | Status |
|-----------|--------|
| Expected = Paid (and > 0) | **Fully Paid** |
| Paid > 0 but < Expected | **Partial Paid** |
| Paid = 0, Expected > 0 | **Not Paid** |
| Return/Cancel processed | **Return/Cancel** |
| Other differences | **Mismatch** |

## Tech Stack

- **Backend**: Node.js, Express.js, Supabase
- **Frontend**: React, Vite
- **Database**: Supabase (PostgreSQL)
- **Export**: ExcelJS

## Project Structure

```
Myntra-reconciliation/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabaseClient.js
│   │   ├── controllers/
│   │   │   ├── uploadController.js
│   │   │   └── reconcileController.js
│   │   ├── services/
│   │   │   ├── csvParser.js
│   │   │   ├── supabaseService.js
│   │   │   ├── reconciliationService.js
│   │   │   └── exportService.js
│   │   ├── utils/
│   │   │   └── fieldMapper.js
│   │   └── index.js
│   ├── supabase_schema.sql
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.jsx
│   │   │   ├── SummaryCards.jsx
│   │   │   └── ReconciliationTable.jsx
│   │   ├── pages/
│   │   │   └── Dashboard.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── index.css
│   └── package.json
└── CSV Data/
    ├── ORDER.csv
    ├── CANCEL ORDER.csv
    ├── RETURN ORDER.csv
    ├── PAYMENT.csv
    └── RETURN PAYMENT.csv
```
