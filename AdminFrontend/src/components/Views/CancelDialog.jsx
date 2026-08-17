import React from 'react';

export const CancelDialog = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="modal-overlay dialog-overlay">
            <div className="modal-card sm">
                <p style={{ color: '#333', marginBottom: '24px', fontSize: '16px' }}>
                    {message}
                </p>
                <div className="dialog-actions">
                    <button className="btn btn-primary" onClick={onConfirm}>Yes</button>
                    <button className="btn btn-secondary" onClick={onCancel}>No</button>
                </div>
            </div>
        </div>
    );
};