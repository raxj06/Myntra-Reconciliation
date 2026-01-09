import supabase from '../config/supabaseClient.js';

/**
 * Supabase database service for CRUD operations - V2
 */

// ============ INSERT OPERATIONS ============

export async function insertOrders(orders) {
    const { data, error } = await supabase
        .from('orders')
        .upsert(orders, { onConflict: 'order_line_id', ignoreDuplicates: false })
        .select();
    if (error) { console.error('Error inserting orders:', error); throw error; }
    return data;
}

export async function insertCancellations(cancellations) {
    const { data, error } = await supabase
        .from('cancellations')
        .upsert(cancellations, { onConflict: 'order_line_id', ignoreDuplicates: false })
        .select();
    if (error) { console.error('Error inserting cancellations:', error); throw error; }
    return data;
}

export async function insertReturns(returns) {
    const { data, error } = await supabase
        .from('returns')
        .upsert(returns, { onConflict: 'order_line_id', ignoreDuplicates: false })
        .select();
    if (error) { console.error('Error inserting returns:', error); throw error; }
    return data;
}

export async function insertPayments(payments) {
    const { data, error } = await supabase
        .from('payments')
        .upsert(payments, { onConflict: 'order_line_id', ignoreDuplicates: false })
        .select();
    if (error) { console.error('Error inserting payments:', error); throw error; }
    return data;
}

export async function insertReturnCharges(returnCharges) {
    const { data, error } = await supabase
        .from('return_charges')
        .upsert(returnCharges, { onConflict: 'order_line_id', ignoreDuplicates: false })
        .select();
    if (error) { console.error('Error inserting return charges:', error); throw error; }
    return data;
}

// ============ SELECT OPERATIONS ============

export async function getOrders() {
    const { data, error } = await supabase.from('orders').select('*');
    if (error) throw error;
    return data || [];
}

export async function getCancellations() {
    const { data, error } = await supabase.from('cancellations').select('*');
    if (error) throw error;
    return data || [];
}

export async function getReturns() {
    const { data, error } = await supabase.from('returns').select('*');
    if (error) throw error;
    return data || [];
}

export async function getPayments() {
    const { data, error } = await supabase.from('payments').select('*');
    if (error) throw error;
    return data || [];
}

export async function getReturnCharges() {
    const { data, error } = await supabase.from('return_charges').select('*');
    if (error) throw error;
    return data || [];
}

// ============ RECONCILIATION RESULTS ============

export async function saveReconciliationResults(results) {
    if (results.length === 0) return { success: true, count: 0 };

    // Get the period from the first result
    const period = results[0]?.period;

    if (period) {
        // Delete only records for this specific period (allows historical data to coexist)
        await supabase.from('reconciliation_results').delete().eq('period', period);

    }

    // Insert in batches of 500 to avoid size limits
    const batchSize = 500;
    for (let i = 0; i < results.length; i += batchSize) {
        const batch = results.slice(i, i + batchSize);
        const { error } = await supabase.from('reconciliation_results').insert(batch);
        if (error) { console.error('Error saving reconciliation batch:', error); throw error; }
    }

    return { success: true, count: results.length };
}

export async function getReconciliationResults(page = 1, pageSize = 50, statusFilter = null, period = null) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from('reconciliation_results')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (statusFilter && statusFilter !== 'All') {
        query = query.eq('item_status', statusFilter);
    }

    if (period) {
        query = query.eq('period', period);
    }

    const { data, error, count } = await query;
    if (error) { console.error('Error fetching reconciliation results:', error); throw error; }
    return { data: data || [], count };
}

// Get list of available periods (for dropdown)
export async function getAvailablePeriods() {
    const { data, error } = await supabase
        .from('reconciliation_results')
        .select('period')
        .order('period', { ascending: false });

    if (error) { console.error('Error fetching periods:', error); throw error; }

    // Get unique periods
    const periods = [...new Set((data || []).map(d => d.period).filter(Boolean))];
    return periods;
}

export async function getReconciliationSummary(period = null) {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            let query = supabase
                .from('reconciliation_results')
                .select('item_status, reconciliation_status, customer_paid_amount, net_settlement, difference');

            if (period) {
                query = query.eq('period', period);
            }

            const { data, error } = await query;

            if (error) throw error;

            const summary = {
                totalOrders: 0,
                delivered: 0,
                cancelled: 0,
                returned: 0,
                rto: 0,
                inTransit: 0,
                miscellaneous: 0,
                totalCustomerPaid: 0,
                totalSettled: 0,
                totalDifference: 0
            };

            (data || []).forEach(row => {
                summary.totalOrders++;
                if (row.item_status === 'Delivered') summary.delivered++;
                else if (row.item_status === 'Cancelled') summary.cancelled++;
                else if (row.item_status === 'Returned') summary.returned++;
                else if (row.item_status === 'RTO') summary.rto++;
                else if (row.item_status === 'In Transit') summary.inTransit++;
                else if (row.item_status === 'Miscellaneous') summary.miscellaneous++;

                summary.totalCustomerPaid += Number(row.customer_paid_amount) || 0;
                summary.totalSettled += Number(row.net_settlement) || 0;
                summary.totalDifference += Number(row.difference) || 0;
            });

            return summary;

        } catch (error) {
            console.error(`Error fetching summary (Attempt ${attempt + 1}/${maxRetries}):`, error.message);
            attempt++;
            if (attempt === maxRetries) throw error;
            // Wait before retrying (exponential backoff: 1s, 2s, 3s)
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
    }
}

export async function getTableCounts() {
    const tables = ['orders', 'cancellations', 'returns', 'payments', 'return_charges'];
    const counts = {};

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
        counts[table] = error ? 0 : count;
    }

    return counts;
}

export async function clearAllData() {
    const tables = ['reconciliation_results', 'return_charges', 'payments', 'returns', 'cancellations', 'orders'];
    for (const table of tables) {
        await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }
    return { success: true };
}
