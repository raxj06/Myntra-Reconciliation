import { useRef, useState } from 'react';

/**
 * File Upload Card Component
 * Drag-and-drop enabled CSV upload with custom styled button
 */
function FileUpload({ label, count, icon, onUpload, loading, accept }) {
    const [dragover, setDragover] = useState(false);
    const inputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragover(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragover(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragover(false);

        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) {
            onUpload(file);
        }
    };

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onUpload(file);
            e.target.value = ''; // Reset for re-upload
        }
    };

    const getCardClass = () => {
        let cls = 'upload-card';
        if (dragover) cls += ' dragover';
        if (loading) cls += ' uploading';
        if (count > 0) cls += ' success';
        return cls;
    };

    // Determine icon based on label if not provided
    const getIcon = () => {
        if (icon) return icon;
        if (label.includes('Order')) return '📦';
        if (label.includes('Cancel')) return '❌';
        if (label.includes('Return Charge')) return '💰';
        if (label.includes('Return')) return '↩️';
        if (label.includes('Payment')) return '💳';
        return '📄';
    };

    return (
        <div
            className={getCardClass()}
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="upload-icon">{getIcon()}</div>
            <h4>{label}</h4>
            <p className="file-name">{label.toUpperCase().replace(' CSV', '.csv')}</p>

            {loading ? (
                <div className="upload-status uploading-text">
                    <span className="spinner-small"></span> Uploading...
                </div>
            ) : count > 0 ? (
                <div className="upload-success-count">
                    <span className="checkmark">✓</span>
                    <span className="count-number">{count}</span>
                </div>
            ) : (
                <div className="upload-hint">
                    Drop file or click to browse
                </div>
            )}

            {/* Hidden file input */}
            <input
                ref={inputRef}
                type="file"
                accept=".csv"
                onChange={handleChange}
                style={{ display: 'none' }}
            />
        </div>
    );
}

export default FileUpload;
