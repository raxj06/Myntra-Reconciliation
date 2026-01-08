import { runReconciliation } from '../services/reconciliationService.js';
import * as supabaseService from '../services/supabaseService.js';
import { generateExcelReport } from '../services/exportService.js';

/**
 * Trigger reconciliation process
 */
export async function reconcile(req, res) {
    try {
        const { summary } = await runReconciliation();

        res.json({
            success: true,
            message: 'Reconciliation completed',
            summary
        });
    } catch (error) {
        console.error('Error during reconciliation:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Get reconciliation summary
 */
export async function getSummary(req, res) {
    try {
        const summary = await supabaseService.getReconciliationSummary();
        res.json(summary);
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Get reconciliation results table with pagination
 */
export async function getReconciliationTable(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 50;
        const status = req.query.status || null;

        const { data, count } = await supabaseService.getReconciliationResults(page, pageSize, status);

        res.json({
            data,
            pagination: {
                page,
                pageSize,
                total: count,
                totalPages: Math.ceil(count / pageSize)
            }
        });
    } catch (error) {
        console.error('Error fetching reconciliation table:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Export reconciliation results to Excel
 */
export async function exportExcel(req, res) {
    try {
        const buffer = await generateExcelReport();

        const filename = `myntra_reconciliation_${new Date().toISOString().split('T')[0]}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    } catch (error) {
        console.error('Error exporting Excel:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Clear all data
 */
export async function clearData(req, res) {
    try {
        await supabaseService.clearAllData();
        res.json({ success: true, message: 'All data cleared' });
    } catch (error) {
        console.error('Error clearing data:', error);
        res.status(500).json({ error: error.message });
    }
}
