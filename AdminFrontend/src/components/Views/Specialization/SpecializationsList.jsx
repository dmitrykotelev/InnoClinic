import React from 'react';
import "../../../styles/Global.css";

export const SpecializationsList = ({ specializations, onBack, onSelectSpec, onCreateSpec }) => {
    return (
        <div className="page-container">
            <div className="flex-between mb-4">
                <div className="flex-row">
                    <button className="btn btn-text" onClick={onBack}>
                        &larr; Назад
                    </button>
                    <h2 style={{ margin: 0 }}>Specializations</h2>
                </div>
                <button 
                    className="btn btn-primary" 
                    onClick={onCreateSpec}
                    style={{ backgroundColor: '#28a745' }} // Оставил зеленый цвет для кнопки создания, если нужен акцент
                >
                    ➕ Create specialization
                </button>
            </div>

            <div className="table-responsive">
                {specializations.length === 0 ? (
                    <div className="empty-state">No specializations found.</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Specialization Name</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {specializations.map(spec => {
                                const isActive = spec.isActive === true || spec.isActiove === true;
                                
                                return (
                                    <tr 
                                        key={spec.id ?? spec.Id} 
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => onSelectSpec(spec)}
                                    >
                                        <td style={{ fontWeight: '500' }}>
                                            {spec.name ?? spec.Name ?? spec.specializationName}
                                        </td>
                                        <td onClick={(e) => e.stopPropagation()}>
                                            <div className="flex-row">
                                                <label className="flex-row" style={{ margin: 0, cursor: 'default' }}>
                                                    <input type="radio" checked={isActive} readOnly /> Active
                                                </label>
                                                <label className="flex-row" style={{ margin: 0, cursor: 'default' }}>
                                                    <input type="radio" checked={!isActive} readOnly /> Inactive
                                                </label>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};