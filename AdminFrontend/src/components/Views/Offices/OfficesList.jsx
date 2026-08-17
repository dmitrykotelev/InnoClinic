import React from 'react';
import '../../../styles/Global.css';

export const OfficesList = ({ offices, onBack, onSelectOffice, onCreateOffice }) => {
    return (
        <div className="page-container">
            <div className="flex-between mb-4">
                <div className="flex-row">
                    <button className="btn btn-text" onClick={onBack}>
                        &larr; Назад
                    </button>
                    <h2 style={{ margin: 0 }}>Offices</h2>
                </div>
                <button className="btn btn-primary" onClick={onCreateOffice}>
                    ➕ Create office
                </button>
            </div>

            <div>
                {offices.length === 0 ? (
                    <div className="empty-state">No offices found.</div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Office Address</th>
                                    <th>Registry Phone Number</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {offices.map(office => {
                                    const isActive = office.isActive === true || office.status === 'Active' || office.status === true;
                                    const address = office.adress ?? office.address ?? office.Adress ?? 'N/A';
                                    const phone = office.registryPhoneNumber ?? office.phoneNumber ?? office.PhoneNumber ?? 'N/A';
                                    
                                    return (
                                        <tr key={office.id ?? office.Id} style={{ cursor: 'pointer' }} onClick={() => onSelectOffice(office)}>
                                            <td style={{ fontWeight: '500' }}>{address}</td>
                                            <td>{phone}</td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <div className="flex-row">
                                                    <label className="flex-row" style={{ gap: '5px', cursor: 'default', margin: 0 }}>
                                                        <input type="radio" checked={isActive} readOnly /> Active
                                                    </label>
                                                    <label className="flex-row" style={{ gap: '5px', cursor: 'default', margin: 0 }}>
                                                        <input type="radio" checked={!isActive} readOnly /> Inactive
                                                    </label>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};