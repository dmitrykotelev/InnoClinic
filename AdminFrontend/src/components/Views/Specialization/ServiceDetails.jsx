import React, { useState, useMemo } from 'react';
import { CancelDialog } from '../CancelDialog';

const API_BASE_SERVICES = 'http://gateway.inno-clinic.com/api-services';

export const ServiceDetails = ({ service, categories, categoriesMap, onBack, onServiceUpdated, onServiceDeleted }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [editForm, setEditForm] = useState({});
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});

    const isServiceActive = service.isActive === true || service.status === true || service.status === 'Active';
    const price = service.price !== undefined ? `$${service.price}` : 'Not Set';
    const categoryName = categoriesMap[service.serviceCategoryId] || 'Unknown Category';

    const handleEditClick = () => {
        setEditForm({
            name: service.name || '',
            price: service.price || '',
            categoryId: service.serviceCategoryId || '',
            isActive: isServiceActive
        });
        setTouched({});
        setErrors({});
        setIsEditing(true);
    };

    const validateField = (name, value) => {
        let error = '';
        switch (name) {
            case 'name':
                if (!value.trim()) error = 'Please, enter the name';
                break;
            case 'price':
                if (value === '') error = 'Please, enter the price';
                else if (isNaN(value) || Number(value) <= 0) error = "You've entered an invalid price";
                break;
            case 'categoryId':
                if (!value) error = 'Please, choose the service category';
                break;
            default:
                break;
        }
        return error;
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        let val = value;
        if (type === 'radio') val = value === 'true';

        setEditForm(prev => ({ ...prev, [name]: val }));
        if (touched[name]) setErrors(prev => ({ ...prev, [name]: validateField(name, val) }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    };

    const isFormValid = useMemo(() => {
        const requiredFields = ['name', 'price', 'categoryId'];
        const hasEmptyRequired = requiredFields.some(field => editForm[field] === '');
        const hasErrors = Object.values(errors).some(err => err !== '');
        return !hasEmptyRequired && !hasErrors;
    }, [editForm, errors]);

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;
        setIsSaving(true);

        const updatePayload = {
            id: service.id,
            name: editForm.name,
            price: Number(editForm.price),
            serviceCategoryId: Number(editForm.categoryId),
            specializationId: service.specializationId,
            isActive: editForm.isActive,
            status: editForm.isActive ? 'Active' : 'Inactive'
        };

        try {
            // ДОБАВЛЕН ТОКЕН
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${API_BASE_SERVICES}/Services/Update`, { 
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(updatePayload)
            });

            if (!res.ok) throw new Error("Failed to update service");

            onServiceUpdated(); 
            setIsEditing(false);
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteService = async () => {
        setIsDeleting(true);
        try {
            // ДОБАВЛЕН ТОКЕН
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${API_BASE_SERVICES}/Services/${service.id}`, { 
                method: 'DELETE',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });

            if (!res.ok) throw new Error("Failed to delete service");

            onServiceDeleted(); 
        } catch (err) {
            alert("Error deleting service: " + err.message);
            setIsDeleting(false);
        }
    };

    const handleCancelClick = () => setShowCancelDialog(true);
    const confirmCancel = (confirm) => {
        setShowCancelDialog(false);
        if (confirm) setIsEditing(false); 
    };

    return (
        <div className="page-container sm">
            <div className="modal-header mb-4">
                <button className="btn btn-text" onClick={onBack}>
                    &larr; Back to Specialization
                </button>
                <h2 style={{ margin: 0 }}>{isEditing ? 'Edit Service' : 'Service Details'}</h2>
            </div>

            {!isEditing ? (
                <div>
                    <div className="data-card grid-1-to-2 mb-4">
                        <div><span className="doctor-info-label">Service Name:</span><br/><b style={{ fontSize: '16px' }}>{service.name}</b></div>
                        <div><span className="doctor-info-label">Price:</span><br/><b style={{ fontSize: '16px' }}>{price}</b></div>
                        <div><span className="doctor-info-label">Service Category:</span><br/><b style={{ fontSize: '16px' }}>{categoryName}</b></div>
                        <div>
                            <span className="doctor-info-label">Status:</span>
                            <div className="flex-row mt-2">
                                <label className="flex-row" style={{ margin: 0, cursor: 'default' }}>
                                    <input type="radio" checked={isServiceActive} readOnly /> Active
                                </label>
                                <label className="flex-row" style={{ margin: 0, cursor: 'default' }}>
                                    <input type="radio" checked={!isServiceActive} readOnly /> Inactive
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex-end">
                        <button className="btn btn-primary" onClick={handleEditClick}>✏️ Edit Service</button>
                        <button className="btn btn-primary" style={{ backgroundColor: 'var(--error-color)' }} onClick={() => setShowDeleteDialog(true)}>🗑️ Delete</button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSaveChanges}>
                    <div className="form-group">
                        <label>Service Name *</label>
                        <input type="text" name="name" className={`form-control ${errors.name ? 'is-invalid' : ''}`} value={editForm.name} onChange={handleChange} onBlur={handleBlur} />
                        {errors.name && <span className="error-msg">{errors.name}</span>}
                    </div>

                    <div className="grid-1-to-2">
                        <div className="form-group">
                            <label>Price *</label>
                            <input type="number" step="0.01" name="price" className={`form-control ${errors.price ? 'is-invalid' : ''}`} value={editForm.price} onChange={handleChange} onBlur={handleBlur} />
                            {errors.price && <span className="error-msg">{errors.price}</span>}
                        </div>

                        <div className="form-group">
                            <label>Service Category *</label>
                            <select name="categoryId" className={`form-control ${errors.categoryId ? 'is-invalid' : ''}`} value={editForm.categoryId} onChange={handleChange} onBlur={handleBlur}>
                                <option value="">Select category...</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            {errors.categoryId && <span className="error-msg">{errors.categoryId}</span>}
                        </div>
                    </div>

                    <div className="form-group">
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

                    <div className="modal-footer mt-4">
                        <button type="button" className="btn btn-secondary" onClick={handleCancelClick}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={!isFormValid || isSaving}>
                            {isSaving ? 'Saving...' : 'Save changes'}
                        </button>
                    </div>
                </form>
            )}

            {showCancelDialog && (
                <CancelDialog message="Do you really want to cancel? Changes will not be saved." onConfirm={() => confirmCancel(true)} onCancel={() => confirmCancel(false)} />
            )}

            {showDeleteDialog && (
                <div className="modal-overlay top-tier">
                    <div className="modal-card sm">
                        <h3 className="mb-3">Delete Service</h3>
                        <p className="mb-4">Are you sure you want to delete this service? This action cannot be undone.</p>
                        <div className="flex-row" style={{ justifyContent: 'center' }}>
                            <button className="btn btn-primary" style={{ backgroundColor: 'var(--error-color)' }} onClick={handleDeleteService} disabled={isDeleting}>
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