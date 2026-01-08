import ExcelJS from 'exceljs';
import * as supabaseService from './supabaseService.js';

/**
 * Export reconciliation results to Excel
 */
export async function generateExcelReport() {
    // Fetch all reconciliation results
    const { data: results } = await supabaseService.getReconciliationResults(1, 10000);

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Myntra Reconciliation Platform';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Reconciliation Report', {
        properties: { tabColor: { argb: 'FF6B21A8' } }
    });

    // Define columns (V2 structure)
    worksheet.columns = [
        { header: 'Order Line ID', key: 'order_line_id', width: 20 },
        { header: 'Order Release ID', key: 'order_release_id', width: 20 },
        { header: 'SKU', key: 'sku_code', width: 15 },
        { header: 'Style Name', key: 'style_name', width: 25 },
        { header: 'Status', key: 'item_status', width: 12 },
        { header: 'Final Amount', key: 'final_amount', width: 14, style: { numFmt: '₹#,##0.00' } },
        { header: 'Customer Paid', key: 'customer_paid_amount', width: 15, style: { numFmt: '₹#,##0.00' } },
        { header: 'Expected Settlement', key: 'expected_settlement', width: 18, style: { numFmt: '₹#,##0.00' } },
        { header: 'Actual Settlement', key: 'actual_settlement', width: 16, style: { numFmt: '₹#,##0.00' } },
        { header: 'Return Charge', key: 'return_charge', width: 14, style: { numFmt: '₹#,##0.00' } },
        { header: 'Net Settlement', key: 'net_settlement', width: 14, style: { numFmt: '₹#,##0.00' } },
        { header: 'Difference', key: 'difference', width: 12, style: { numFmt: '₹#,##0.00' } },
        { header: 'Reconciliation Status', key: 'reconciliation_status', width: 18 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6B21A8' } // Purple
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows
    for (const result of results) {
        const row = worksheet.addRow(result);

        // Color code based on status
        const statusCell = row.getCell('reconciliation_status');
        switch (result.reconciliation_status) {
            case 'Matched':
                statusCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF10B981' } // Green
                };
                statusCell.font = { color: { argb: 'FFFFFFFF' } };
                break;
            case 'Under Settled':
                statusCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF59E0B' } // Amber
                };
                statusCell.font = { color: { argb: 'FFFFFFFF' } };
                break;
            case 'Over Settled':
                statusCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF6366F1' } // Indigo
                };
                statusCell.font = { color: { argb: 'FFFFFFFF' } };
                break;
            case 'Pending':
                statusCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF94A3B8' } // Gray
                };
                statusCell.font = { color: { argb: 'FFFFFFFF' } };
                break;
        }

        // Highlight differences
        const diffCell = row.getCell('difference');
        if (result.difference < 0) {
            diffCell.font = { color: { argb: 'FF6366F1' } }; // Purple for over
        } else if (result.difference > 0) {
            diffCell.font = { color: { argb: 'FFF59E0B' } }; // Amber for under
        }
    }

    // Add summary worksheet
    const summarySheet = workbook.addWorksheet('Summary', {
        properties: { tabColor: { argb: 'FF10B981' } }
    });

    const summary = await supabaseService.getReconciliationSummary();

    summarySheet.columns = [
        { header: 'Metric', key: 'metric', width: 25 },
        { header: 'Value', key: 'value', width: 20 }
    ];

    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF10B981' }
    };

    // Order Status Summary
    summarySheet.addRow({ metric: '--- ORDER STATUS ---', value: '' });
    summarySheet.addRow({ metric: 'Total Orders', value: summary.totalOrders });
    summarySheet.addRow({ metric: 'Delivered', value: summary.delivered });
    summarySheet.addRow({ metric: 'Cancelled', value: summary.cancelled });
    summarySheet.addRow({ metric: 'Returned', value: summary.returned });
    summarySheet.addRow({ metric: 'In Transit', value: summary.inTransit });

    // Payment Summary
    summarySheet.addRow({ metric: '', value: '' });
    summarySheet.addRow({ metric: '--- PAYMENT SUMMARY ---', value: '' });
    summarySheet.addRow({ metric: 'Total Customer Paid', value: `₹${summary.totalCustomerPaid?.toFixed(2) || 0}` });
    summarySheet.addRow({ metric: 'Total Settled', value: `₹${summary.totalSettled?.toFixed(2) || 0}` });
    summarySheet.addRow({ metric: 'Total Difference', value: `₹${summary.totalDifference?.toFixed(2) || 0}` });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return buffer;
}
