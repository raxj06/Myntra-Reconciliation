import React, { useState, useEffect } from 'react';
import { getReconciliationTable } from '../services/api';

const ReconciliationTable = ({ statusFilter = 'All', refreshTrigger = 0 }) => {
    const [data, setData] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [showAll, setShowAll] = useState(false);
    const [loading, setLoading] = useState(false);

    // Reset to page 1 when filter changes
    useEffect(() => {
        setPage(1);
    }, [statusFilter]);

    useEffect(() => {
        fetchData();
    }, [page, pageSize, statusFilter, refreshTrigger]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // If showAll is true, request with very large page size
            const size = showAll ? 10000 : pageSize;
            const result = await getReconciliationTable(1, size, statusFilter);
            setData(result.data || []);
            setTotalCount(result.count || 0);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleShowAll = () => {
        setShowAll(true);
        setPageSize(10000);
    };

    const handleShowPaginated = () => {
        setShowAll(false);
        setPageSize(25);
        setPage(1);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(value || 0);
    };

    const getStatusBadge = (status) => {
        const badges = {
            'Delivered': 'badge badge-delivered',
            'Cancelled': 'badge badge-cancelled',
            'Returned': 'badge badge-returned',
            'RTO': 'badge badge-rto',
            'In Transit': 'badge badge-transit',
            'Miscellaneous': 'badge badge-misc'
        };
        return badges[status] || 'badge';
    };

    const getReconBadge = (status) => {
        const badges = {
            'Matched': 'badge badge-matched',
            'Under Settled': 'badge badge-under',
            'Over Settled': 'badge badge-over',
            'Pending': 'badge badge-pending'
        };
        return badges[status] || 'badge';
    };

    const getDiffClass = (diff) => {
        if (diff > 0) return 'diff-positive';
        if (diff < 0) return 'diff-negative';
        return 'diff-zero';
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    if (loading && data.length === 0) {
        return (
            <div className="table-section">
                <div className="loading">
                    <div className="spinner"></div>
                    Loading reconciliation data...
                </div>
            </div>
        );
    }

    if (!loading && data.length === 0) {
        return (
            <div className="table-section">
                <div className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    <p>No reconciliation data yet. Upload CSV files and run reconciliation to see results.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="table-section">
            <div className="table-header">
                <h3>
                    {statusFilter !== 'All' ? `${statusFilter} Orders` : 'All Orders'}
                    {(totalCount > 0 || data.length > 0) && (
                        <span className="count-badge">{totalCount || data.length}</span>
                    )}
                </h3>
                <div className="table-controls">
                    <span className="page-info">
                        {showAll
                            ? `Showing all ${data.length} records`
                            : `Showing ${data.length} of ${totalCount || data.length}`
                        }
                    </span>
                    {!showAll ? (
                        <button className="btn-show-all" onClick={handleShowAll}>
                            📋 Show All
                        </button>
                    ) : (
                        <button className="btn-show-all" onClick={handleShowPaginated}>
                            📄 Paginate
                        </button>
                    )}
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Order Line ID</th>
                            <th>Order ID</th>
                            <th>SKU</th>
                            <th>Status</th>
                            <th>Customer Paid</th>
                            <th>Actual Settlement</th>
                            <th>Return Charge</th>
                            <th>Net Settlement</th>
                            <th>Difference</th>
                            <th>Customer Diff</th>
                            <th>Reconciliation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={row.order_line_id || index}>
                                <td className="order-id">{row.order_line_id}</td>
                                <td className="order-id">{row.order_release_id || '-'}</td>
                                <td>{row.sku_code || '-'}</td>
                                <td>
                                    <span className={getStatusBadge(row.item_status)}>
                                        {row.item_status}
                                    </span>
                                    {row.misc_type && (
                                        <span className={`misc-tag misc-${row.misc_type.toLowerCase()}`}>
                                            {row.misc_type}
                                        </span>
                                    )}
                                </td>
                                <td>{formatCurrency(row.customer_paid_amount)}</td>
                                <td>{formatCurrency(row.actual_settlement)}</td>
                                <td>{formatCurrency(row.return_charge)}</td>
                                <td>{formatCurrency(row.net_settlement)}</td>
                                <td className={getDiffClass(row.difference)}>
                                    {formatCurrency(row.difference)}
                                </td>
                                <td className={getDiffClass(row.customer_difference)}>
                                    {formatCurrency(row.customer_difference)}
                                </td>
                                <td>
                                    <span className={getReconBadge(row.reconciliation_status)}>
                                        {row.reconciliation_status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Simple pagination - only show when not showing all */}
            {!showAll && totalPages > 1 && (
                <div className="pagination-simple">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        ◀ Previous
                    </button>
                    <span className="page-current">Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                    >
                        Next ▶
                    </button>
                </div>
            )}
        </div>
    );
};

export default ReconciliationTable;
