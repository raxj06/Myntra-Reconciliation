const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * API client for Myntra Reconciliation Backend
 */

// ============ UPLOAD APIs ============

export async function uploadOrderCSV(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/upload/order`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
    }

    return response.json();
}

export async function uploadCancelCSV(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/upload/cancel`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
    }

    return response.json();
}

export async function uploadReturnCSV(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/upload/return`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
    }

    return response.json();
}

export async function uploadReturnChargeCSV(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/upload/return-charge`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
    }

    return response.json();
}

export async function uploadPaymentCSV(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/upload/payment`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
    }

    return response.json();
}

export async function getUploadStatus() {
    const response = await fetch(`${API_BASE}/upload/status`);

    if (!response.ok) {
        throw new Error('Failed to fetch upload status');
    }

    return response.json();
}

// ============ RECONCILIATION APIs ============

export async function runReconciliation(period = null) {
    const response = await fetch(`${API_BASE}/reconcile`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ period })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Reconciliation failed');
    }

    return response.json();
}

export async function getSummary(period = null) {
    let url = `${API_BASE}/summary`;
    if (period) {
        url += `?period=${encodeURIComponent(period)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('Failed to fetch summary');
    }

    return response.json();
}

export async function getReconciliationTable(page = 1, pageSize = 50, status = null, period = null) {
    let url = `${API_BASE}/reconciliation-table?page=${page}&pageSize=${pageSize}`;
    if (status) {
        url += `&status=${encodeURIComponent(status)}`;
    }
    if (period) {
        url += `&period=${encodeURIComponent(period)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('Failed to fetch reconciliation table');
    }

    return response.json();
}

export async function getAvailablePeriods() {
    const response = await fetch(`${API_BASE}/periods`);

    if (!response.ok) {
        throw new Error('Failed to fetch periods');
    }

    return response.json();
}

export async function exportExcel(period = null) {
    let url = `${API_BASE}/export/excel`;
    if (period) {
        url += `?period=${encodeURIComponent(period)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('Failed to export Excel');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `myntra_reconciliation_${period || new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
}

export const clearAllData = async () => {
    const response = await fetch(`${API_BASE}/clear`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clear data');
    }
    return await response.json();
};

export const clearStaging = async () => {
    const response = await fetch(`${API_BASE}/clear-staging`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clear staging data');
    }
    return await response.json();
};
