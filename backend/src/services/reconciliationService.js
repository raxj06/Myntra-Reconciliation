import * as supabaseService from '../services/supabaseService.js';

/**
 * Reconciliation Service V2
 * 
 * Status Codes from ORDER.csv:
 * - C = Delivered (Complete)
 * - F = Cancelled (Failed)
 * - RTO = Return To Origin
 * 
 * Difference Calculation:
 * - Customer Paid Amount - Net Settlement
 * - Return charges are NEGATIVE values (deducted from settlement)
 */

export async function runReconciliation() {
    console.log('Starting reconciliation...');

    // 1. Get all orders
    const orders = await supabaseService.getOrders();
    console.log(`Found ${orders.length} orders`);

    // 2. Get all cancellations (by order_line_id)
    const cancellations = await supabaseService.getCancellations();
    const cancelledIds = new Set(cancellations.map(c => c.order_line_id));
    console.log(`Found ${cancellations.length} cancellations`);

    // 3. Get all returns
    const returns = await supabaseService.getReturns();
    const returnedIds = new Set(returns.map(r => r.order_line_id));
    console.log(`Found ${returns.length} returns`);

    // 4. Get all payments
    const payments = await supabaseService.getPayments();
    const paymentMap = new Map(payments.map(p => [p.order_line_id, p]));
    console.log(`Found ${payments.length} payments`);

    // 5. Get all return charges
    const returnCharges = await supabaseService.getReturnCharges();
    const returnChargeMap = new Map(returnCharges.map(r => [r.order_line_id, r]));
    console.log(`Found ${returnCharges.length} return charges`);

    // 6. Process each order
    const results = orders.map(order => {
        const payment = paymentMap.get(order.order_line_id);
        const returnCharge = returnChargeMap.get(order.order_line_id);
        const hasPayment = !!payment;
        const hasReturnCharge = !!returnCharge;
        const isInPaymentSheet = paymentMap.has(order.order_line_id);
        const isInReturnChargeSheet = returnChargeMap.has(order.order_line_id);

        // Debug specific order
        if (order.order_line_id === '10757976718' || order.order_line_id === '10736693301') {
            console.log(`DEBUG Order ${order.order_line_id}:`, {
                order_status: order.order_status,
                hasPayment,
                hasReturnCharge,
                isInPaymentSheet,
                isInReturnChargeSheet,
                isInCancellations: cancelledIds.has(order.order_line_id),
                isInReturns: returnedIds.has(order.order_line_id),
                payment: payment || 'NOT FOUND',
                returnCharge: returnCharge || 'NOT FOUND'
            });
        }

        // Determine status based on multiple criteria
        let itemStatus;
        let isMiscellaneous = false;
        let miscType = null; // 'Return' or 'Delivered' for Miscellaneous orders

        // Priority 1: Check cancellations table
        if (cancelledIds.has(order.order_line_id)) {
            itemStatus = 'Cancelled';
        }
        // Priority 2: Check if order_status is RTO (before returns table)
        else if (order.order_status && order.order_status.toUpperCase().trim() === 'RTO') {
            itemStatus = 'RTO';
        }
        // Priority 3: Check returns table
        else if (returnedIds.has(order.order_line_id)) {
            // If returned but no return_charge data, mark as Miscellaneous (needs claim)
            if (!hasReturnCharge) {
                itemStatus = 'Miscellaneous';
                isMiscellaneous = true;
                miscType = 'Return';
            } else {
                itemStatus = 'Returned';
            }
        }
        // Priority 3: Check order_status field (F=Cancelled, C=Delivered, RTO=RTO)
        else if (order.order_status) {
            const status = order.order_status.toUpperCase().trim();
            if (status === 'C') {
                // Check if delivered but no payment data = Miscellaneous (needs claim)
                if (!hasPayment && !hasReturnCharge) {
                    itemStatus = 'Miscellaneous';
                    isMiscellaneous = true;
                    miscType = 'Delivered';
                } else {
                    itemStatus = 'Delivered';
                }
            } else if (status === 'F') {
                itemStatus = 'Cancelled';
            } else if (status === 'RTO') {
                itemStatus = 'RTO';  // RTO is now separate status
            } else if (status.includes('DELIVER')) {
                if (!hasPayment && !hasReturnCharge) {
                    itemStatus = 'Miscellaneous';
                    isMiscellaneous = true;
                    miscType = 'Delivered';
                } else {
                    itemStatus = 'Delivered';
                }
            } else if (status.includes('CANCEL')) {
                itemStatus = 'Cancelled';
            } else if (status.includes('RTO')) {
                itemStatus = 'RTO';
            } else if (status.includes('RETURN')) {
                itemStatus = 'Returned';
            } else {
                itemStatus = 'In Transit';
            }
        }
        // Priority 4: Check dates
        else if (order.delivered_on) {
            if (!hasPayment && !hasReturnCharge) {
                itemStatus = 'Miscellaneous';
                isMiscellaneous = true;
                miscType = 'Delivered';
            } else {
                itemStatus = 'Delivered';
            }
        } else if (order.cancelled_on) {
            itemStatus = 'Cancelled';
        } else {
            itemStatus = 'In Transit';
        }

        // Calculate amounts
        // Customer paid amount from PAYMENT.csv
        const customerPaid = hasPayment ? (Number(payment.customer_paid_amount) || 0) : 0;

        // Expected settlement from PAYMENT.csv
        const expectedSettlement = hasPayment ? (Number(payment.expected_settlement) || 0) : 0;

        // Actual settlement from PAYMENT.csv (forward payment to seller)
        const actualSettlement = hasPayment ? (Number(payment.actual_settlement) || 0) : 0;

        // Return charge from RETURN CHRGE.csv (NEGATIVE value - deducted from seller)
        let returnChargeAmt = hasReturnCharge ? (Number(returnCharge.actual_settlement) || 0) : 0;

        // Net Settlement = Forward payment + Return charge (return charges are typically NEGATIVE)
        const netSettlement = actualSettlement + returnChargeAmt;

        // Difference calculation depends on item status
        let difference;
        if (itemStatus === 'Returned') {
            // For Returns: show amount seller owes
            difference = -(actualSettlement + returnChargeAmt);
        } else {
            // For Delivered/Cancelled/In Transit: expected - actual
            difference = expectedSettlement - actualSettlement;
        }

        // Customer Difference calculation depends on status
        let customerDifference;
        if (itemStatus === 'Returned') {
            // For Returns: customer_paid + return_charge
            // Since return_charge is negative, this shows the net refund amount
            customerDifference = customerPaid + returnChargeAmt;
        } else {
            // For others: customer_paid - net_settlement
            customerDifference = customerPaid - netSettlement;
        }

        // Determine reconciliation status
        let reconStatus;
        if (itemStatus === 'In Transit') {
            reconStatus = 'Pending';
        } else if (!hasPayment && !hasReturnCharge) {
            // No payment or return charge data - can't reconcile
            reconStatus = 'Pending';
        } else if (Math.abs(difference) < 1) {
            reconStatus = 'Matched';
        } else if (difference > 0) {
            reconStatus = 'Under Settled';
        } else {
            reconStatus = 'Over Settled';
        }

        return {
            order_line_id: order.order_line_id,
            order_release_id: order.order_release_id,
            sku_code: order.sku_code,
            style_name: order.style_name,
            item_status: itemStatus,
            misc_type: miscType,  // 'Return' or 'Delivered' for Miscellaneous orders
            final_amount: Number(order.final_amount) || 0,
            customer_paid_amount: customerPaid,
            expected_settlement: expectedSettlement,
            actual_settlement: actualSettlement,
            return_charge: returnChargeAmt,
            net_settlement: netSettlement,
            difference: difference,
            customer_difference: customerDifference,
            reconciliation_status: reconStatus
        };
    });

    // Log status breakdown
    const statusCounts = results.reduce((acc, r) => {
        acc[r.item_status] = (acc[r.item_status] || 0) + 1;
        return acc;
    }, {});
    console.log('Status breakdown:', statusCounts);

    console.log(`Processed ${results.length} reconciliation results`);

    // 7. Save results to Supabase
    await supabaseService.saveReconciliationResults(results);

    return { count: results.length, statusCounts };
}

export async function getSummary() {
    return await supabaseService.getReconciliationSummary();
}

export async function getReconciliationTable(page, pageSize, statusFilter) {
    return await supabaseService.getReconciliationResults(page, pageSize, statusFilter);
}
