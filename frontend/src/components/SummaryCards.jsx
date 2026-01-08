import React from 'react';

const SummaryCards = ({ summary, activeFilter, onFilterChange }) => {
    if (!summary) return null;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value || 0);
    };

    const handleCardClick = (filter) => {
        if (onFilterChange) {
            // Toggle off if clicking same filter, otherwise set new filter
            onFilterChange(activeFilter === filter ? 'All' : filter);
        }
    };

    const getCardClass = (filter, type) => {
        let cls = `summary-card ${type} clickable`;
        if (activeFilter === filter) cls += ' active';
        return cls;
    };

    return (
        <div className="summary-section">
            {/* Order Status Grid */}
            <div className="card-title">Order Status (Click to Filter)</div>
            <div className="summary-grid">
                <div
                    className={getCardClass('All', '')}
                    onClick={() => handleCardClick('All')}
                >
                    <div className="label">📊 Total Orders</div>
                    <div className="value">{summary.totalOrders || 0}</div>
                </div>
                <div
                    className={getCardClass('Delivered', 'delivered')}
                    onClick={() => handleCardClick('Delivered')}
                >
                    <div className="label">✅ Delivered</div>
                    <div className="value">{summary.delivered || 0}</div>
                </div>
                <div
                    className={getCardClass('Cancelled', 'cancelled')}
                    onClick={() => handleCardClick('Cancelled')}
                >
                    <div className="label">❌ Cancelled</div>
                    <div className="value">{summary.cancelled || 0}</div>
                </div>
                <div
                    className={getCardClass('Returned', 'returned')}
                    onClick={() => handleCardClick('Returned')}
                >
                    <div className="label">🔄 Returned</div>
                    <div className="value">{summary.returned || 0}</div>
                </div>
                <div
                    className={getCardClass('RTO', 'rto')}
                    onClick={() => handleCardClick('RTO')}
                >
                    <div className="label">📦 RTO</div>
                    <div className="value">{summary.rto || 0}</div>
                </div>
                <div
                    className={getCardClass('In Transit', 'transit')}
                    onClick={() => handleCardClick('In Transit')}
                >
                    <div className="label">🚚 In Transit</div>
                    <div className="value">{summary.inTransit || 0}</div>
                </div>
                <div
                    className={getCardClass('Miscellaneous', 'miscellaneous')}
                    onClick={() => handleCardClick('Miscellaneous')}
                >
                    <div className="label">⚠️ Miscellaneous</div>
                    <div className="value">{summary.miscellaneous || 0}</div>
                </div>
            </div>

            {/* Payment Summary */}
            <div className="card-title" style={{ marginTop: '1.5rem' }}>Payment Summary</div>
            <div className="payment-summary-grid">
                <div className="payment-card">
                    <div className="label">Customer Paid</div>
                    <div className="value">{formatCurrency(summary.totalCustomerPaid)}</div>
                </div>
                <div className="payment-card">
                    <div className="label">Total Settled</div>
                    <div className="value">{formatCurrency(summary.totalSettled)}</div>
                </div>
                <div className="payment-card difference-card">
                    <div className="label">Difference</div>
                    <div className="value">{formatCurrency(summary.totalDifference)}</div>
                </div>
            </div>
        </div>
    );
};

export default SummaryCards;
