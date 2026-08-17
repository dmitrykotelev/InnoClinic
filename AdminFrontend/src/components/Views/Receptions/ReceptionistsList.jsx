import React, { useState } from 'react';

export const ReceptionistsList = ({ receptionists, officesMap, onBack, onSelectReceptionist, onCreateReceptionist, onDeleteReceptionist }) => {
    const [deletingId, setDeletingId] = useState(null);

    const handleDeleteClick = (e, id) => {
        e.stopPropagation(); // Чтобы клик не открывал профиль
        setDeletingId(id);
    };

    const confirmDelete = () => {
        if (deletingId) {
            onDeleteReceptionist(deletingId);
            setDeletingId(null);
        }
    };

    return (
        <div className="page-container">
            <div className="flex-between mb-4">
                <div className="flex-row">
                    <button className="btn btn-text" onClick={onBack}>
                        &larr; Назад
                    </button>
                    <h2 style={{ margin: 0 }}>Receptionists</h2>
                </div>
                <button className="btn btn-primary" onClick={onCreateReceptionist} style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}>
                    ➕ Create receptionist
                </button>
            </div>

            <div>
                {receptionists.length === 0 ? (
                    <div className="empty-state">No receptionists found.</div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Full Name</th>
                                    <th>Office Address</th>
                                    <th style={{ textAlign: 'left' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {receptionists.map(rec => {
                                    const fullName = `${rec.firstName || ''} ${rec.lastName || ''} ${rec.middleName || ''}`.trim() || 'No Name';
                                    const officeAddress = officesMap[rec.officeId] || 'No Office Assigned';
                                    
                                    return (
                                        <tr key={rec.id ?? rec.Id} style={{ cursor: 'pointer' }} onClick={() => onSelectReceptionist(rec)}>
                                            <td style={{ fontWeight: '500' }}>{fullName}</td>
                                            <td style={{ color: 'var(--text-muted)' }}>{officeAddress}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className="btn btn-secondary btn-sm" onClick={(e) => handleDeleteClick(e, rec.id ?? rec.Id)}>
                                                    🗑️ Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {deletingId && (
                <div className="modal-overlay top-tier">
                    <div className="modal-card sm">
                        <h3 className="mb-3">Delete Receptionist</h3>
                        <p className="mb-4">Are you sure you want to delete this receptionist? This action cannot be undone.</p>
                        <div className="flex-row" style={{ justifyContent: 'center' }}>
                            <button className="btn btn-primary" style={{ backgroundColor: 'var(--error-color)' }} onClick={confirmDelete}>Yes, delete</button>
                            <button className="btn btn-secondary" onClick={() => setDeletingId(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};