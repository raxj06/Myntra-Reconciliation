import { parse } from 'csv-parse';

/**
 * Parse CSV content string into array of objects
 * Configured to handle Myntra CSV files which may have:
 * - Unescaped quotes in data
 * - Mixed quote styles
 * - BOM characters
 * @param {string} csvContent - Raw CSV content
 * @returns {Promise<Array>} - Array of row objects
 */
export function parseCSV(csvContent) {
    return new Promise((resolve, reject) => {
        const records = [];

        const parser = parse({
            columns: true,          // Use first row as headers
            skip_empty_lines: true,
            trim: true,
            bom: true,              // Handle BOM characters
            relax_column_count: true,
            relax_quotes: true,     // Handle unescaped quotes in fields
            escape: '\\',           // Use backslash as escape character
            quote: '"',             // Quote character
            ltrim: true,
            rtrim: true,
            skip_records_with_error: true,  // Skip problematic rows instead of failing
            on_record: (record, { lines }) => {
                // Return the record as-is
                return record;
            }
        });

        parser.on('readable', function () {
            let record;
            while ((record = parser.read()) !== null) {
                records.push(record);
            }
        });

        parser.on('error', function (err) {
            console.error('CSV Parse Error:', err.message);
            // Don't reject - try to continue with what we have
            if (records.length > 0) {
                resolve(records);
            } else {
                reject(err);
            }
        });

        parser.on('end', function () {
            resolve(records);
        });

        parser.write(csvContent);
        parser.end();
    });
}

/**
 * Alternative parser using simple split for problematic CSVs
 * @param {string} csvContent - Raw CSV content
 * @returns {Array} - Array of row objects
 */
export function parseCSVSimple(csvContent) {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    // Get headers from first line
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    const records = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length > 0) {
            const record = {};
            headers.forEach((header, index) => {
                record[header] = values[index] || '';
            });
            records.push(record);
        }
    }

    return records;
}

/**
 * Parse a single CSV line handling quoted values
 * @param {string} line - CSV line
 * @returns {Array} - Array of values
 */
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
}

/**
 * Get column headers from CSV content
 * @param {string} csvContent - Raw CSV content
 * @returns {Promise<Array>} - Array of column header strings
 */
export function getCSVHeaders(csvContent) {
    return new Promise((resolve, reject) => {
        const parser = parse({
            to: 1,  // Only parse first row
            trim: true,
            bom: true,
            relax_quotes: true
        });

        let headers = [];

        parser.on('readable', function () {
            let record;
            while ((record = parser.read()) !== null) {
                headers = record;
            }
        });

        parser.on('error', function (err) {
            reject(err);
        });

        parser.on('end', function () {
            resolve(headers);
        });

        parser.write(csvContent);
        parser.end();
    });
}
