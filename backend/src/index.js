import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import controllers
import * as uploadController from './controllers/uploadController.js';
import * as reconcileController from './controllers/reconcileController.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

// ============ ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Upload endpoints
app.post('/api/upload/order', upload.single('file'), uploadController.uploadOrders);
app.post('/api/upload/cancel', upload.single('file'), uploadController.uploadCancellations);
app.post('/api/upload/return', upload.single('file'), uploadController.uploadReturns);
app.post('/api/upload/return-charge', upload.single('file'), uploadController.uploadReturnCharges);
app.post('/api/upload/payment', upload.single('file'), uploadController.uploadPayments);
app.get('/api/upload/status', uploadController.getUploadStatus);

// Reconciliation endpoints
app.post('/api/reconcile', reconcileController.reconcile);
app.get('/api/summary', reconcileController.getSummary);
app.get('/api/reconciliation-table', reconcileController.getReconciliationTable);
app.get('/api/export/excel', reconcileController.exportExcel);
app.delete('/api/clear', reconcileController.clearData);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║        Myntra Reconciliation Platform - Backend          ║
╠══════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}                ║
║                                                          ║
║  Endpoints:                                              ║
║  • POST /api/upload/order         - Upload Order CSV     ║
║  • POST /api/upload/cancel        - Upload Cancel CSV    ║
║  • POST /api/upload/return        - Upload Return CSV    ║
║  • POST /api/upload/return-payment - Upload Return Pay   ║
║  • POST /api/reconcile            - Run Reconciliation   ║
║  • GET  /api/summary              - Get Summary          ║
║  • GET  /api/reconciliation-table - Get Results          ║
║  • GET  /api/export/excel         - Export Excel         ║
║  • DELETE /api/clear              - Clear All Data       ║
╚══════════════════════════════════════════════════════════╝
  `);
});
