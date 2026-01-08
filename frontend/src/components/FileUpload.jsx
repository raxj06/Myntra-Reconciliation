import { useRef, useState } from 'react';

/**
 * File Upload Card Component
 * Drag-and-drop enabled CSV upload with custom styled button
 */
function FileUpload({ title, description, icon, onUpload, uploadedCount, loading }) {
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
        if (uploadedCount > 0) cls += ' success';
        return cls;
    };

    return (
        <div
            className={getCardClass()}
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="upload-icon">{icon}</div>
            <h4>{title}</h4>
            <p>{description}</p>

            {loading ? (
                <div className="upload-status uploading-text">
                    <span className="spinner-small"></span> Uploading...
                </div>
            ) : uploadedCount > 0 ? (
                <div className="upload-count">✓ {uploadedCount}</div>
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
