import React, { useState, useMemo } from 'react';

export const PatientsList = ({ patients, onBack, onSelectPatient, onCreatePatient, onDeletePatient }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const filteredPatients = useMemo(() => {
        if (!searchTerm.trim()) return patients;
        const lowerSearch = searchTerm.toLowerCase();
        return patients.filter(p => {
            const fullName = `${p.firstName || ''} ${p.lastName || ''} ${p.middleName || ''}`.toLowerCase();
            return fullName.includes(lowerSearch);
        });
    }, [patients, searchTerm]);

    const handleDeleteClick = (e, id) => {
        e.stopPropagation();
        setDeletingId(id);
    };

    const confirmDelete = () => {
        if (deletingId) {
            onDeletePatient(deletingId);
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
                    <h2 style={{ margin: 0 }}>Patients</h2>
                </div>
            </div>

            <div className="flex-between mb-4">
                <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
                    <input 
                        type="text" 
                        className="form-control" 
                        style={{ borderRadius: '20px' }}
                        placeholder="🔍 Search by full name..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} 
                    />
                    
                    {isSearchFocused && searchTerm.trim() && (
                        <ul className="combo-dropdown" style={{ top: '110%' }}>
                            {filteredPatients.length > 0 ? filteredPatients.map(p => (
                                <li 
                                    key={p.id ?? p.Id} 
                                    onClick={() => onSelectPatient(p)}
                                >
                                    {p.firstName} {p.lastName} {p.middleName}
                                </li>
                            )) : (
                                <li style={{ color: 'var(--text-muted)' }}>No patients found</li>
                            )}
                        </ul>
                    )}
                </div>

                <button className="btn btn-primary" onClick={onCreatePatient}>
                    ➕ Create patient
                </button>
            </div>

            <div>
                {patients.length === 0 ? (
                    <div className="empty-state">No patients found.</div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Full Name</th>
                                    <th>Phone Number</th>
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPatients.map(p => {
                                    const fullName = `${p.firstName || ''} ${p.lastName || ''} ${p.middleName || ''}`.trim() || 'No Name';
                                    const phone = p.phoneNumber || 'N/A';
                                    
                                    return (
                                        <tr key={p.id ?? p.Id} style={{ cursor: 'pointer' }} onClick={() => onSelectPatient(p)}>
                                            <td style={{ fontWeight: '500' }}>{fullName}</td>
                                            <td>{phone}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button 
                                                    className="btn btn-secondary btn-sm" 
                                                    onClick={(e) => handleDeleteClick(e, p.id ?? p.Id)}
                                                >
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

            {/* Диалог удаления */}
            {deletingId && (
                <div className="modal-overlay top-tier">
                    <div className="modal-card sm">
                        <h3 className="mb-3">Delete Patient</h3>
                        <p className="mb-4">Are you sure you want to delete this patient?</p>
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