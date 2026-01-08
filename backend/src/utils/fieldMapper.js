// Field mappings for Myntra Reconciliation Files (New Format)

// 1. ORDER.csv
export const ORDER_FIELD_MAP = {
    'order line id': 'order_line_id',
    'order release id': 'order_release_id',
    'order status': 'order_status',
    'final amount': 'final_amount',
    'total mrp': 'total_mrp',
    'discount': 'discount',
    'delivered on': 'delivered_on',
    'cancelled on': 'cancelled_on',
    'return creation date': 'return_creation_date',
    'seller sku code': 'sku_code',
    'style name': 'style_name',
    'brand': 'brand'
};

// 2. CANCEL.csv
export const CANCELLATION_FIELD_MAP = {
    'order line id': 'order_line_id',
    'order release id': 'order_release_id',
    'cancellation reason': 'cancellation_reason',
    'cancellation type': 'cancellation_type',
    'order cancellation date': 'cancellation_date'
};

// 3. RETURN.csv
export const RETURN_FIELD_MAP = {
    'order_line_id': 'order_line_id',
    'order_id': 'order_release_id', // Note: using order_id as release_id based on file analysis
    'return_reason': 'return_reason',
    'status': 'status', // RTO or Return
    'return_created_date': 'return_created_date',
    'refunded_date': 'refunded_date',
    'return_id': 'return_id'
};

// 4. PAYMENT.csv
export const PAYMENT_FIELD_MAP = {
    'order_line_id': 'order_line_id',
    'order_release_id': 'order_release_id',
    'customer_paid_amt': 'customer_paid_amount',
    'seller_product_amount': 'seller_product_amount',
    'total_expected_settlement': 'expected_settlement',
    'total_actual_settlement': 'actual_settlement',
    'amount_pending_settlement': 'pending_settlement',
    'total_commission': 'commission',
    'total_logistics_deduction': 'logistics_deduction'
};

// 5. RETURN CHRGE.csv
export const RETURN_PAYMENT_FIELD_MAP = {
    'order_line_id': 'order_line_id',
    'order_release_id': 'order_release_id',
    'return_type': 'return_type',
    'total_settlement': 'settlement_amount',
    'total_actual_settlement': 'actual_settlement'
};

// numeric Fields for parsing
const NUMERIC_FIELDS = [
    'final_amount', 'total_mrp', 'discount',
    'customer_paid_amount', 'seller_product_amount',
    'expected_settlement', 'actual_settlement', 'pending_settlement',
    'commission', 'logistics_deduction',
    'settlement_amount'
];

// Date fields for parsing
const DATE_FIELDS = [
    'delivered_on', 'cancelled_on', 'return_creation_date',
    'cancellation_date', 'refunded_date'
];

/**
 * Normalizes a CSV row based on the provided field map.
 * @param {Object} row - The raw CSV row object.
 * @param {Object} map - The field map to use.
 * @returns {Object} - The normalized object.
 */
export const normalizeRow = (row, map) => {
    const normalized = {};

    // Create a lower-case key lookup for the row
    const rowKeys = Object.keys(row);
    const rowKeyLookup = rowKeys.reduce((acc, key) => {
        acc[key.toLowerCase().trim()] = key;
        return acc;
    }, {});

    for (const [csvField, dbField] of Object.entries(map)) {
        const actualKey = rowKeyLookup[csvField.toLowerCase().trim()];
        if (actualKey) {
            let value = row[actualKey];

            // Handle numeric fields
            if (NUMERIC_FIELDS.includes(dbField)) {
                // Remove currency symbols and commas
                if (typeof value === 'string') {
                    value = value.replace(/[^0-9.-]+/g, '');
                    value = value === '' ? 0 : parseFloat(value);
                }
            }

            // Handle date fields
            if (DATE_FIELDS.includes(dbField)) {
                if (!value || value.trim() === '' || value.toLowerCase() === 'na' || value.toLowerCase() === 'n/a') {
                    value = null;
                } else {
                    // Try to parse date, if invalid leave as is (postgres might reject, but better than random data)
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                        value = date.toISOString();
                    } else {
                        value = null; // Set to null if invalid date
                    }
                }
            }

            normalized[dbField] = value;
        }
    }
    return normalized;
};
