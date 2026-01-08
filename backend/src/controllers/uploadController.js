import { parseCSV, parseCSVSimple } from '../services/csvParser.js';
import * as supabaseService from '../services/supabaseService.js';
import {
    ORDER_FIELD_MAP,
    CANCELLATION_FIELD_MAP,
    RETURN_FIELD_MAP,
    RETURN_PAYMENT_FIELD_MAP,
    PAYMENT_FIELD_MAP,
    normalizeRow
} from '../utils/fieldMapper.js';

/**
 * Try parsing with main parser, fallback to simple parser if it fails
 */
async function safeParse(csvContent) {
    try {
        const rows = await parseCSV(csvContent);
        if (rows.length > 0) return rows;
    } catch (error) {
        console.log('Main parser failed, trying simple parser:', error.message);
    }

    // Fallback to simple parser
    return parseCSVSimple(csvContent);
}

/**
 * Normalize multiple rows using field mapper
 */
function normalizeRows(rawRows, fieldMap) {
    return rawRows.map(row => normalizeRow(row, fieldMap));
}

/**
 * Upload and process Order CSV
 */
export async function uploadOrders(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const csvContent = req.file.buffer.toString('utf-8');
        const rawRows = await safeParse(csvContent);

        if (rawRows.length === 0) {
            return res.status(400).json({ error: 'CSV file is empty or could not be parsed' });
        }

        console.log(`Parsed ${rawRows.length} rows from Order CSV`);

        // Normalize using field mapper
        const normalizedRows = normalizeRows(rawRows, ORDER_FIELD_MAP);

        // Insert into Supabase
        const inserted = await supabaseService.insertOrders(normalizedRows);

        res.json({
            success: true,
            message: `Uploaded ${inserted.length} orders`,
            count: inserted.length
        });
    } catch (error) {
        console.error('Error uploading orders:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Upload and process Cancel Order CSV
 */
export async function uploadCancellations(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const csvContent = req.file.buffer.toString('utf-8');
        const rawRows = await safeParse(csvContent);

        if (rawRows.length === 0) {
            return res.status(400).json({ error: 'CSV file is empty or could not be parsed' });
        }

        console.log(`Parsed ${rawRows.length} rows from Cancel CSV`);

        // Normalize using field mapper
        const normalizedRows = normalizeRows(rawRows, CANCELLATION_FIELD_MAP);

        // Insert into Supabase
        const inserted = await supabaseService.insertCancellations(normalizedRows);

        res.json({
            success: true,
            message: `Uploaded ${inserted.length} cancellations`,
            count: inserted.length
        });
    } catch (error) {
        console.error('Error uploading cancellations:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Upload and process Return Order CSV
 */
export async function uploadReturns(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const csvContent = req.file.buffer.toString('utf-8');
        const rawRows = await safeParse(csvContent);

        if (rawRows.length === 0) {
            return res.status(400).json({ error: 'CSV file is empty or could not be parsed' });
        }

        console.log(`Parsed ${rawRows.length} rows from Return CSV`);

        // Normalize using field mapper
        const normalizedRows = normalizeRows(rawRows, RETURN_FIELD_MAP);

        // Insert into Supabase
        const inserted = await supabaseService.insertReturns(normalizedRows);

        res.json({
            success: true,
            message: `Uploaded ${inserted.length} returns`,
            count: inserted.length
        });
    } catch (error) {
        console.error('Error uploading returns:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Upload and process Return Charge CSV (RETURN CHRGE.csv)
 */
export async function uploadReturnCharges(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const csvContent = req.file.buffer.toString('utf-8');
        const rawRows = await safeParse(csvContent);

        if (rawRows.length === 0) {
            return res.status(400).json({ error: 'CSV file is empty or could not be parsed' });
        }

        console.log(`Parsed ${rawRows.length} rows from Return Charge CSV`);

        // Normalize using field mapper
        const normalizedRows = normalizeRows(rawRows, RETURN_PAYMENT_FIELD_MAP);

        // Insert into Supabase
        const inserted = await supabaseService.insertReturnCharges(normalizedRows);

        res.json({
            success: true,
            message: `Uploaded ${inserted.length} return charges`,
            count: inserted.length
        });
    } catch (error) {
        console.error('Error uploading return charges:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Upload and process Payment CSV
 */
export async function uploadPayments(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const csvContent = req.file.buffer.toString('utf-8');
        const rawRows = await safeParse(csvContent);

        if (rawRows.length === 0) {
            return res.status(400).json({ error: 'CSV file is empty or could not be parsed' });
        }

        console.log(`Parsed ${rawRows.length} rows from Payment CSV`);

        // Normalize using field mapper
        const normalizedRows = normalizeRows(rawRows, PAYMENT_FIELD_MAP);

        // Insert into Supabase
        const inserted = await supabaseService.insertPayments(normalizedRows);

        res.json({
            success: true,
            message: `Uploaded ${inserted.length} payments`,
            count: inserted.length
        });
    } catch (error) {
        console.error('Error uploading payments:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Get counts of uploaded data
 */
export async function getUploadStatus(req, res) {
    try {
        const counts = await supabaseService.getTableCounts();
        res.json(counts);
    } catch (error) {
        console.error('Error getting upload status:', error);
        res.status(500).json({ error: error.message });
    }
}
