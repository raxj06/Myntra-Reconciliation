import React from 'react';

const SuccessModal = ({ isOpen, onClose, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-icon">✅</div>
                <h3>{title}</h3>
                <p>{message}</p>
                <button className="btn btn-primary btn-full-width" onClick={onClose}>
                    Done
                </button>
            </div>
        </div>
    );
};

export default SuccessModal;
