import React, { useState, useEffect, useCallback } from 'react';
import { CreateServiceModal } from './CreateServiceModal';
import { CancelDialog } from '../CancelDialog';

const API_BASE_SERVICES = 'http://gateway.inno-clinic.com/api-services';

export const SpecializationDetails = ({ spec, categories, categoriesMap, onBack, onSelectService, onSpecUpdated, onSpecDeleted }) => {
    const [specServices, setSpecServices] = useState([]);
    const [isLoadingServices, setIsLoadingServices] = useState(false);
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', isActive: true });
    const [touched, setTouched] = useState({});

    const fetchServicesBySpec = useCallback(async () => {
        if (!spec) return;
        setIsLoadingServices(true);
        try {
            // ДОБАВЛЕН ТОКЕН ДЛЯ GET ЗАПРОСА
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${API_BASE_SERVICES}/Services/GetBySpec/${spec.id ?? spec.Id}`, {
                headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
            });
            if (res.ok) setSpecServices(await res.json());
            else setSpecServices([]);
        } catch (err) { setSpecServices([]); } 
        finally { setIsLoadingServices(false); }
    }, [spec]);

    useEffect(() => {
        fetchServicesBySpec();
    }, [fetchServicesBySpec]);

    const handleEditClick = () => {
        setEditForm({
            name: spec.name ?? spec.Name ?? '',
            isActive: spec.isActive === true || spec.isActiove === true
        });
        setTouched({});
        setIsEditing(true);
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        let val = value;
        if (type === 'radio') val = value === 'true';
        setEditForm(prev => ({ ...prev, [name]: val }));
        setTouched(prev => ({ ...prev, [name]: true }));
    };

    const isNameError = touched.name && !editForm.name.trim();
    const isSaveDisabled = !editForm.name.trim() || specServices.length === 0 || isSaving;

    const handleSaveChanges = async () => {
        if (isSaveDisabled) return;
        setIsSaving(true);
        try {
            // ДОБАВЛЕН ТОКЕН
            const token = localStorage.getItem('accessToken');
            const payload = {
                id: spec.id ?? spec.Id,
                name: editForm.name,
                isActive: editForm.isActive,
                isActiove: editForm.isActive
            };

            const res = await fetch(`${API_BASE_SERVICES}/Specializations/Update`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to update specialization");
            
            onSpecUpdated(); 
            setIsEditing(false);
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSpec = async () => {
        setIsDeleting(true);
        try {
            // ДОБАВЛЕН ТОКЕН
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${API_BASE_SERVICES}/Specializations/${spec.id ?? spec.Id}`, { 
                method: 'DELETE',
                headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
            });

            if (!res.ok) throw new Error("Failed to delete specialization");

            onSpecDeleted(); 
        } catch (err) {
            alert("Error deleting specialization: " + err.message);
            setIsDeleting(false);
        }
    };

    const handleCancelClick = () => setShowCancelDialog(true);
    const confirmCancel = (confirm) => {
        setShowCancelDialog(false);
        if (confirm) setIsEditing(false);
    };

    const isSpecActive = spec.isActive === true || spec.isActiove === true;

    return (
        <div className="page-container">
            <div className="flex-between mb-4">
                <div className="flex-row">
                    <button className="btn btn-text" onClick={onBack}>
                        &larr; Back to Specializations List
                    </button>
                    <h2 style={{ margin: 0 }}>{isEditing ? 'Edit Specialization' : (spec.name ?? spec.Name)}</h2>
                </div>
            </div>

            <div>
                {!isEditing ? (
                    <div className="data-card flex-between mb-4">
                        <div>
                            <span className="doctor-info-label mb-3" style={{ display: 'block' }}>Status</span>
                            <div className="flex-row">
                                <label className="flex-row" style={{ margin: 0, cursor: 'default' }}>
                                    <input type="radio" checked={isSpecActive} readOnly /> Active
                                </label>
                                <label className="flex-row" style={{ margin: 0, cursor: 'default' }}>
                                    <input type="radio" checked={!isSpecActive} readOnly /> Inactive
                                </label>
                            </div>
                        </div>
                        <div className="flex-end">
                            <button className="btn btn-primary" onClick={handleEditClick}>✏️ Edit</button>
                            <button className="btn btn-primary" style={{ backgroundColor: 'var(--error-color)' }} onClick={() => setShowDeleteDialog(true)}>🗑️ Delete</button>
                        </div>
                    </div>
                ) : (
                    <div className="data-card mb-4">
                        <div className="form-group">
                            <label>Specialization Name *</label>
                            <input type="text" name="name" className={`form-control ${isNameError ? 'is-invalid' : ''}`} value={editForm.name} onChange={handleChange} onBlur={(e) => setTouched(prev => ({ ...prev, name: true }))} />
                            {isNameError && <span className="error-msg">Please, enter the name</span>}
                        </div>
                        <div className="form-group mb-4">
                            <label>Status *</label>
                            <div className="flex-row mt-2">
                                <label className="flex-row" style={{ margin: 0 }}>
                                    <input type="radio" name="isActive" value="true" checked={editForm.isActive === true} onChange={handleChange} /> Active
                                </label>
                                <label className="flex-row" style={{ margin: 0 }}>
                                    <input type="radio" name="isActive" value="false" checked={editForm.isActive === false} onChange={handleChange} /> Inactive
                                </label>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={handleCancelClick}>Cancel</button>
                            <button className="btn btn-primary" disabled={isSaveDisabled} onClick={handleSaveChanges}>
                                {isSaving ? 'Saving...' : 'Save changes'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex-between mb-4 mt-4">
                    <h3>Related Services</h3>
                    <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)} style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}>
                        ➕ Add service
                    </button>
                </div>

                {isLoadingServices ? (
                    <div className="empty-state">Loading services...</div>
                ) : specServices.length === 0 ? (
                    <div className="empty-state">No services found for this specialization.</div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Service Name</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {specServices.map(service => {
                                    const isServiceActive = service.isActive === true || service.status === true || service.status === 'Active';
                                    const price = service.price !== undefined ? `$${service.price}` : 'Not Set';

                                    return (
                                        <tr key={service.id} style={{ cursor: 'pointer' }} onClick={() => onSelectService(service)}>
                                            <td style={{ fontWeight: '500' }}>{service.name}</td>
                                            <td style={{ color: 'var(--text-muted)' }}>{categoriesMap[service.serviceCategoryId]}</td>
                                            <td>{price}</td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <div className="flex-row">
                                                    <label className="flex-row" style={{ margin: 0, cursor: 'default' }}>
                                                        <input type="radio" checked={isServiceActive} readOnly /> Active
                                                    </label>
                                                    <label className="flex-row" style={{ margin: 0, cursor: 'default' }}>
                                                        <input type="radio" checked={!isServiceActive} readOnly /> Inactive
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

            <CreateServiceModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchServicesBySpec} 
                specializationId={spec.id ?? spec.Id}
                categories={categories}
            />

            {showCancelDialog && (
                <CancelDialog 
                    message="Do you really want to cancel? Changes will not be saved."
                    onConfirm={() => confirmCancel(true)}
                    onCancel={() => confirmCancel(false)}
                />
            )}

            {showDeleteDialog && (
                <div className="modal-overlay top-tier">
                    <div className="modal-card sm">
                        <h3 className="mb-3">Delete Specialization</h3>
                        <p className="mb-4">Are you sure you want to delete this specialization? All linked services might be affected. This action cannot be undone.</p>
                        <div className="flex-row" style={{ justifyContent: 'center' }}>
                            <button className="btn btn-primary" style={{ backgroundColor: 'var(--error-color)' }} onClick={handleDeleteSpec} disabled={isDeleting}>
                                {isDeleting ? 'Deleting...' : 'Yes, delete'}
                            </button>
                            <button className="btn btn-secondary" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};