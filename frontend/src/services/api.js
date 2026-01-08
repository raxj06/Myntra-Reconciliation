const API_BASE = 'http://localhost:3001/api';

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

export async function runReconciliation() {
    const response = await fetch(`${API_BASE}/reconcile`, {
        method: 'POST'
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Reconciliation failed');
    }

    return response.json();
}

export async function getSummary() {
    const response = await fetch(`${API_BASE}/summary`);

    if (!response.ok) {
        throw new Error('Failed to fetch summary');
    }

    return response.json();
}

export async function getReconciliationTable(page = 1, pageSize = 50, status = null) {
    let url = `${API_BASE}/reconciliation-table?page=${page}&pageSize=${pageSize}`;
    if (status) {
        url += `&status=${encodeURIComponent(status)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('Failed to fetch reconciliation table');
    }

    return response.json();
}

export async function exportExcel() {
    const response = await fetch(`${API_BASE}/export/excel`);

    if (!response.ok) {
        throw new Error('Failed to export Excel');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myntra_reconciliation_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

export async function clearAllData() {
    const response = await fetch(`${API_BASE}/clear`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        throw new Error('Failed to clear data');
    }

    return response.json();
}
