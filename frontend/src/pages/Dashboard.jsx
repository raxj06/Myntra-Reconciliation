import { useState, useEffect, useCallback } from 'react';
import FileUpload from '../components/FileUpload';
import SummaryCards from '../components/SummaryCards';
import ReconciliationTable from '../components/ReconciliationTable';

import Sidebar from '../components/Sidebar';
import SuccessModal from '../components/SuccessModal';
import * as api from '../services/api';

/**
 * Main Dashboard Page - Myntra Reconciliation V2
 */
function Dashboard() {
    // Period state
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [periodLabel, setPeriodLabel] = useState('All Periods');

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '' });

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
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Format period for display
    const formatPeriodLabel = (period) => {
        if (!period) return 'All Periods';
        const [year, month] = period.split('-');
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    };

    // Toast helper
    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    // Show Modal Helper
    const showSuccessModal = (title, message) => {
        setModalContent({ title, message });
        setModalOpen(true);
    };

    // Load initial data
    const loadData = useCallback(async () => {
        try {
            const [status, summaryData] = await Promise.all([
                api.getUploadStatus(),
                api.getSummary(selectedPeriod)
            ]);
            setUploadCounts(status);
            setSummary(summaryData);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }, [selectedPeriod]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle period change
    const handlePeriodChange = async (period) => {
        // If clicking same period, do nothing
        if (period === selectedPeriod) return;

        // Reset UI immediately to avoid confusion
        setSelectedPeriod(period);
        setPeriodLabel(formatPeriodLabel(period));

        // Clear staging files from previous session since we are switching context
        // This ensures the "Upload CSV" section is fresh for the new period
        try {
            await api.clearStaging();
            // Reset upload counts locally
            setUploadCounts({
                orders: 0,
                cancellations: 0,
                returns: 0,
                return_charges: 0,
                payments: 0
            });
        } catch (error) {
            console.error('Failed to clear staging:', error);
        }

        setRefreshTrigger(prev => prev + 1);
    };

    // Upload handlers
    const handleOrderUpload = async (file) => {
        setUploading(prev => ({ ...prev, orders: true }));
        try {
            const result = await api.uploadOrderCSV(file);
            showSuccessModal('Orders Uploaded!', `${result.count} orders successfully added.`);
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
            showSuccessModal('Cancellations Uploaded!', `${result.count} cancellations successfully added.`);
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
            showSuccessModal('Returns Uploaded!', `${result.count} returns successfully added.`);
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
            showSuccessModal('Return Charges Uploaded!', `${result.count} return charges successfully added.`);
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
            showSuccessModal('Payments Uploaded!', `${result.count} payments successfully added.`);
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
            // Use selected period or current month
            const period = selectedPeriod || new Date().toISOString().slice(0, 7);
            const result = await api.runReconciliation(period);
            showToast(`Reconciliation complete for ${formatPeriodLabel(period)}! ${result.count} items processed.`);
            setSelectedPeriod(period);
            setPeriodLabel(formatPeriodLabel(period));
            await loadData();
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            showToast(error.message, 'error');
        }
        setReconciling(false);
    };

    // Export handler
    const handleExport = async () => {
        try {
            await api.exportExcel(selectedPeriod);
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
        <div className="app-layout">
            {/* Sidebar RESTORED */}
            <Sidebar
                selectedPeriod={selectedPeriod}
                onPeriodChange={handlePeriodChange}
                onNewPeriod={handlePeriodChange}
            />

            <div className="app-container">
                <div className="dashboard">
                    {/* Header with Month Selector */}
                    <header className="header">
                        <div className="header-left">
                            <h1>
                                <img src="/logo.png" alt="Myntra" className="logo-img" />
                                Myntra Reconciliation
                            </h1>
                            <div className="period-selector">
                                <input
                                    type="month"
                                    className="date-input"
                                    value={selectedPeriod || ''} // Handle null value
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val) handlePeriodChange(val);
                                        else handlePeriodChange(null); // Handle clearing
                                    }}
                                />
                            </div>
                        </div>

                        <div className="header-actions">
                            <button
                                className="btn btn-primary"
                                onClick={handleReconcile}
                                disabled={!hasData || reconciling}
                            >
                                {reconciling ? '⏳ Processing...' : '🔄 Run Reconciliation'}
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={handleExport}
                                disabled={!hasResults}
                            >
                                📥 Export Excel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleClear}
                            >
                                🗑️ Clear
                            </button>
                        </div>
                    </header>

                    {/* Upload Section */}
                    <section className="upload-section">
                        <h2>📁 Upload CSV Files</h2>
                        <div className="upload-grid">
                            <FileUpload
                                label="Order CSV"
                                count={uploadCounts.orders}
                                onUpload={handleOrderUpload}
                                loading={uploading.orders}
                                accept=".csv"
                            />
                            <FileUpload
                                label="Cancel CSV"
                                count={uploadCounts.cancellations}
                                onUpload={handleCancelUpload}
                                loading={uploading.cancel}
                                accept=".csv"
                            />
                            <FileUpload
                                label="Return CSV"
                                count={uploadCounts.returns}
                                onUpload={handleReturnUpload}
                                loading={uploading.returns}
                                accept=".csv"
                            />
                            <FileUpload
                                label="Return Charge CSV"
                                count={uploadCounts.return_charges}
                                onUpload={handleReturnChargeUpload}
                                loading={uploading.returnCharge}
                                accept=".csv"
                            />
                            <FileUpload
                                label="Payment CSV"
                                count={uploadCounts.payments}
                                onUpload={handlePaymentUpload}
                                loading={uploading.payment}
                                accept=".csv"
                            />
                        </div>
                    </section>

                    {/* Summary Cards */}
                    <SummaryCards
                        summary={summary}
                        onFilterChange={handleFilterChange}
                        activeFilter={statusFilter}
                    />

                    {/* Reconciliation Table */}
                    <ReconciliationTable
                        statusFilter={statusFilter}
                        refreshTrigger={refreshTrigger}
                        period={selectedPeriod}
                    />

                    {/* Toast Notifications */}
                    <div className="toast-container">
                        {toasts.map(toast => (
                            <div key={toast.id} className={`toast toast-${toast.type}`}>
                                {toast.message}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
