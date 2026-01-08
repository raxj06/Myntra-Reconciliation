import { useState, useEffect, useCallback } from 'react';
import FileUpload from '../components/FileUpload';
import SummaryCards from '../components/SummaryCards';
import ReconciliationTable from '../components/ReconciliationTable';
import * as api from '../services/api';

/**
 * Main Dashboard Page - Myntra Reconciliation V2
 */
function Dashboard() {
    // Upload states
    const [uploadCounts, setUploadCounts] = useState({
        orders: 0,
        cancellations: 0,
        returns: 0,
        return_charges: 0,
        payments: 0
    });
    const [uploading, setUploading] = useState({
        orders: false,
        cancel: false,
        returns: false,
        returnCharge: false,
        payment: false
    });

    // Reconciliation states
    const [summary, setSummary] = useState({
        totalOrders: 0,
        delivered: 0,
        cancelled: 0,
        returned: 0,
        inTransit: 0,
        totalCustomerPaid: 0,
        totalSettled: 0,
        totalDifference: 0
    });

    // Filter state - shared between cards and table
    const [statusFilter, setStatusFilter] = useState('All');

    // Refresh trigger for table
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // UI states
    const [reconciling, setReconciling] = useState(false);
    const [toasts, setToasts] = useState([]);

    // Toast helper
    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    // Load initial data
    const loadData = useCallback(async () => {
        try {
            const [status, summaryData] = await Promise.all([
                api.getUploadStatus(),
                api.getSummary()
            ]);
            setUploadCounts(status);
            setSummary(summaryData);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Upload handlers
    const handleOrderUpload = async (file) => {
        setUploading(prev => ({ ...prev, orders: true }));
        try {
            const result = await api.uploadOrderCSV(file);
            showToast(`${result.count} orders uploaded`);
            await loadData();
        } catch (error) {
            showToast(error.message, 'error');
        }
        setUploading(prev => ({ ...prev, orders: false }));
    };

    const handleCancelUpload = async (file) => {
        setUploading(prev => ({ ...prev, cancel: true }));
        try {
            const result = await api.uploadCancelCSV(file);
            showToast(`${result.count} cancellations uploaded`);
            await loadData();
        } catch (error) {
            showToast(error.message, 'error');
        }
        setUploading(prev => ({ ...prev, cancel: false }));
    };

    const handleReturnUpload = async (file) => {
        setUploading(prev => ({ ...prev, returns: true }));
        try {
            const result = await api.uploadReturnCSV(file);
            showToast(`${result.count} returns uploaded`);
            await loadData();
        } catch (error) {
            showToast(error.message, 'error');
        }
        setUploading(prev => ({ ...prev, returns: false }));
    };

    const handleReturnChargeUpload = async (file) => {
        setUploading(prev => ({ ...prev, returnCharge: true }));
        try {
            const result = await api.uploadReturnChargeCSV(file);
            showToast(`${result.count} return charges uploaded`);
            await loadData();
        } catch (error) {
            showToast(error.message, 'error');
        }
        setUploading(prev => ({ ...prev, returnCharge: false }));
    };

    const handlePaymentUpload = async (file) => {
        setUploading(prev => ({ ...prev, payment: true }));
        try {
            const result = await api.uploadPaymentCSV(file);
            showToast(`${result.count} payments uploaded`);
            await loadData();
        } catch (error) {
            showToast(error.message, 'error');
        }
        setUploading(prev => ({ ...prev, payment: false }));
    };

    // Reconciliation handler
    const handleReconcile = async () => {
        setReconciling(true);
        try {
            const result = await api.runReconciliation();
            showToast(`Reconciliation complete! ${result.count} items processed.`);
            await loadData();
            setRefreshTrigger(prev => prev + 1); // Trigger table refresh
        } catch (error) {
            showToast(error.message, 'error');
        }
        setReconciling(false);
    };

    // Export handler
    const handleExport = async () => {
        try {
            await api.exportExcel();
            showToast('Excel report downloaded!');
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    // Clear handler
    const handleClear = async () => {
        if (!confirm('Are you sure you want to clear all data?')) return;

        try {
            await api.clearAllData();
            showToast('All data cleared');
            await loadData();
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    // Filter change handler from cards
    const handleFilterChange = (filter) => {
        setStatusFilter(filter);
    };

    const hasData = uploadCounts.orders > 0;
    const hasResults = summary.totalOrders > 0;

    return (
        <div className="app-container">
            <div className="dashboard">
                {/* Header */}
                <header className="header">
                    <h1>
                        <img src="/logo.png" alt="Myntra" className="logo-img" />
                        Myntra Reconciliation
                    </h1>
                    <div className="header-actions">
                        <button
                            className="btn btn-primary"
                            onClick={handleReconcile}
                            disabled={!hasData || reconciling}
                        >
                            {reconciling ? '⏳ Processing...' : '🔄 Run Reconciliation'}
                        </button>
                        <button
                            className="btn btn-success"
                            onClick={handleExport}
                            disabled={!hasResults}
                        >
                            📥 Export Excel
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={handleClear}
                            disabled={!hasData}
                        >
                            🗑️ Clear
                        </button>
                    </div>
                </header>

                {/* Upload Section */}
                <section className="upload-section">
                    <div className="card-title">Upload CSV Files</div>
                    <div className="upload-grid">
                        <FileUpload
                            title="Order CSV"
                            description="ORDER.csv"
                            icon="📦"
                            onUpload={handleOrderUpload}
                            uploadedCount={uploadCounts.orders}
                            loading={uploading.orders}
                        />
                        <FileUpload
                            title="Cancel CSV"
                            description="CANCEL.csv"
                            icon="❌"
                            onUpload={handleCancelUpload}
                            uploadedCount={uploadCounts.cancellations}
                            loading={uploading.cancel}
                        />
                        <FileUpload
                            title="Return CSV"
                            description="RETURN.csv"
                            icon="↩️"
                            onUpload={handleReturnUpload}
                            uploadedCount={uploadCounts.returns}
                            loading={uploading.returns}
                        />
                        <FileUpload
                            title="Return Charge CSV"
                            description="RETURN CHRGE.csv"
                            icon="💰"
                            onUpload={handleReturnChargeUpload}
                            uploadedCount={uploadCounts.return_charges}
                            loading={uploading.returnCharge}
                        />
                        <FileUpload
                            title="Payment CSV"
                            description="PAYMENT.csv"
                            icon="💳"
                            onUpload={handlePaymentUpload}
                            uploadedCount={uploadCounts.payments}
                            loading={uploading.payment}
                        />
                    </div>
                </section>

                {/* Summary Cards - Clickable to filter */}
                <SummaryCards
                    summary={summary}
                    activeFilter={statusFilter}
                    onFilterChange={handleFilterChange}
                />

                {/* Reconciliation Table */}
                <ReconciliationTable
                    statusFilter={statusFilter}
                    refreshTrigger={refreshTrigger}
                />

                {/* Toast Notifications */}
                <div className="toast-container">
                    {toasts.map(toast => (
                        <div key={toast.id} className={`toast ${toast.type}`}>
                            {toast.type === 'success' ? '✓' : '✕'} {toast.message}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
