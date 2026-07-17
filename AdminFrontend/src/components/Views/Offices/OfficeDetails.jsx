import React, { useState, useMemo } from 'react';
import { CancelDialog } from '../CancelDialog';

const API_BASE_OFFICES = 'http://gateway.inno-clinic.com/api-offices/Offices';
const API_BASE_PHOTOS = 'http://gateway.inno-clinic.com/api-photos/Photo';

export const OfficeDetails = ({ office, onBack, onOfficeUpdated, onOfficeDeleted }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [editForm, setEditForm] = useState({});
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const isActive = office.isActive === true || office.status === 'Active' || office.status === true;
    const address = office.adress ?? office.address ?? office.Adress ?? '';
    const phone = office.phoneNumber ?? office.registryPhoneNumber ?? office.registryPhone ?? 'N/A';

    const handleEditClick = () => {
        const parts = address.split(',').map(s => s.trim());
        
        setEditForm({
            city: parts[0] || '',
            street: parts[1] || '',
            houseNumber: parts[2] || '',
            officeNumber: parts[3] || '',
            phone: phone === 'N/A' ? '+' : phone,
            isActive: isActive,
            photo: null 
        });
        
        setTouched({});
        setErrors({});
        setIsEditing(true);
    };

    const validateField = (name, value) => {
        let error = '';
        switch (name) {
            case 'city':
                if (!value.trim()) error = "Please, enter the office’s city";
                break;
            case 'street':
                if (!value.trim()) error = "Please, enter the office’s street";
                break;
            case 'houseNumber':
                if (!value.trim()) error = "Please, enter the office’s house number";
                break;
            case 'phone':
                if (value === '+' || !value.trim()) {
                    error = "Please, enter the phone number";
                } else if (!/^\+[0-9]+$/.test(value)) {
                    error = "You've entered an invalid phone number";
                }
                break;
            default:
                break;
        }
        return error;
    };

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        let val = type === 'file' ? files[0] : value;
        if (type === 'radio') val = value === 'true';

        if (name === 'phone' && type !== 'file' && !val.startsWith('+')) {
            val = '+' + val.replace(/\+/g, '');
        }

        setEditForm(prev => ({ ...prev, [name]: val }));
        if (touched[name]) setErrors(prev => ({ ...prev, [name]: validateField(name, val) }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    };

    const isFormValid = useMemo(() => {
        const requiredFields = ['city', 'street', 'houseNumber', 'phone'];
        const hasEmptyRequired = requiredFields.some(field => editForm[field] === '' || editForm[field] === '+');
        const hasErrors = Object.values(errors).some(err => err !== '');
        return !hasEmptyRequired && !hasErrors;
    }, [editForm, errors]);

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;
        setIsSaving(true);

        const officePart = editForm.officeNumber.trim() ? `, ${editForm.officeNumber.trim()}` : '';
        const fullAddress = `${editForm.city.trim()}, ${editForm.street.trim()}, ${editForm.houseNumber.trim()}${officePart}`;

        try {
            // ДОСТАЕМ ТОКЕН
            const token = localStorage.getItem('accessToken');
            let finalPhotoId = office.photoId ?? office.PhotoId ?? "00000000-0000-0000-0000-000000000000";

            if (editForm.photo) {
                const formData = new FormData();
                formData.append('file', editForm.photo);

                // ДОБАВЛЕН ТОКЕН ДЛЯ ЗАГРУЗКИ ФОТО
                const photoRes = await fetch(`${API_BASE_PHOTOS}/UploadPhoto`, { 
                    method: 'POST', 
                    headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                    body: formData 
                });
                
                if (!photoRes.ok) throw new Error("Failed to upload new photo");

                const rawPhotoId = await photoRes.text();
                finalPhotoId = rawPhotoId.replace(/"/g, ''); 
            }

            const payload = {
                id: office.id ?? office.Id, 
                photoId: finalPhotoId, 
                adress: fullAddress, 
                phoneNumber: editForm.phone,
                isActive: editForm.isActive,
                status: editForm.isActive ? 'Active' : 'Inactive'
            };

            // ДОБАВЛЕН ТОКЕН (Обновление Офиса)
            const res = await fetch(`${API_BASE_OFFICES}/Update`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || "Failed to update office");
            }

            onOfficeUpdated(); 
            setIsEditing(false);
        } catch (err) {
            console.error(err);
            alert("Error: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelClick = () => setShowCancelDialog(true);
    const confirmCancel = (confirm) => {
        setShowCancelDialog(false);
        if (confirm) setIsEditing(false); 
    };

    const handleDeleteOffice = async () => {
        setIsDeleting(true);
        try {
            // ДОБАВЛЕН ТОКЕН (Удаление Офиса)
            const token = localStorage.getItem('accessToken');
            const officeId = office.id ?? office.Id;
            
            const res = await fetch(`${API_BASE_OFFICES}/${officeId}`, { 
                method: 'DELETE',
                headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
            });
            
            if (!res.ok) throw new Error("Failed to delete office");
            onOfficeDeleted(); 
        } catch (err) {
            alert("Error deleting office: " + err.message);
            setIsDeleting(false);
        }
    };

    // Рендер компонента остается без изменений
    return (
        <div className="page-container">
            <div className="flex-between mb-4">
                <div className="flex-row">
                    <button className="btn btn-text" onClick={onBack}>
                        &larr; Back to Offices List
                    </button>
                    <h2 style={{ margin: 0 }}>{isEditing ? 'Edit Office' : 'Office Information'}</h2>
                </div>
            </div>

            <div>
                {!isEditing ? (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
                            {office.photoUrl ? (
                                <img src={office.photoUrl} alt="Office" className="avatar lg" style={{ borderRadius: 'var(--radius-xl)' }} />
                            ) : (
                                <div className="avatar lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', color: 'var(--text-muted)' }}>No Photo</div>
                            )}
                        </div>

                        <div className="grid-1-to-2 mb-4">
                            <div className="data-card">
                                <span className="doctor-info-label">Office Address</span>
                                <div className="doctor-info-value" style={{ textAlign: 'left', maxWidth: 'none', fontSize: '18px' }}>{address || 'N/A'}</div>
                            </div>
                            <div className="data-card">
                                <span className="doctor-info-label">Registry Phone Number</span>
                                <div className="doctor-info-value" style={{ textAlign: 'left', maxWidth: 'none', fontSize: '18px' }}>{phone}</div>
                            </div>
                            <div className="data-card">
                                <span className="doctor-info-label">Status</span>
                                <div className="flex-row mt-2">
                                    <label className="flex-row" style={{ gap: '5px', margin: 0, cursor: 'default' }}>
                                        <input type="radio" checked={isActive} readOnly /> Active
                                    </label>
                                    <label className="flex-row" style={{ gap: '5px', margin: 0, cursor: 'default' }}>
                                        <input type="radio" checked={!isActive} readOnly /> Inactive
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex-end">
                            <button className="btn btn-primary" onClick={handleEditClick}>✏️ Edit Office</button>
                            <button className="btn btn-primary" style={{ backgroundColor: 'var(--error-color)' }} onClick={() => setShowDeleteDialog(true)}>🗑️ Delete</button>
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleSaveChanges}>
                        <div className="form-group">
                            <label>Office Photo</label>
                            <input type="file" name="photo" className="form-control" accept="image/*" onChange={handleChange} />
                            {office.photoUrl && !editForm.photo && (
                                <small style={{ color: 'var(--text-muted)', marginTop: '5px' }}>Leave empty to keep current photo.</small>
                            )}
                        </div>

                        <div className="grid-1-to-2">
                            <div className="form-group">
                                <label>City *</label>
                                <input type="text" name="city" className={`form-control ${errors.city ? 'is-invalid' : ''}`} value={editForm.city} onChange={handleChange} onBlur={handleBlur} />
                                {errors.city && <span className="error-msg">{errors.city}</span>}
                            </div>
                            <div className="form-group">
                                <label>Street *</label>
                                <input type="text" name="street" className={`form-control ${errors.street ? 'is-invalid' : ''}`} value={editForm.street} onChange={handleChange} onBlur={handleBlur} />
                                {errors.street && <span className="error-msg">{errors.street}</span>}
                            </div>
                            <div className="form-group">
                                <label>House Number *</label>
                                <input type="text" name="houseNumber" className={`form-control ${errors.houseNumber ? 'is-invalid' : ''}`} value={editForm.houseNumber} onChange={handleChange} onBlur={handleBlur} />
                                {errors.houseNumber && <span className="error-msg">{errors.houseNumber}</span>}
                            </div>
                            <div className="form-group">
                                <label>Office Number</label>
                                <input type="text" name="officeNumber" className="form-control" value={editForm.officeNumber} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Registry Phone Number *</label>
                                <input type="text" name="phone" className={`form-control ${errors.phone ? 'is-invalid' : ''}`} value={editForm.phone} onChange={handleChange} onBlur={handleBlur} />
                                {errors.phone && <span className="error-msg">{errors.phone}</span>}
                            </div>
                            <div className="form-group">
                                <label>Status *</label>
                                <div className="flex-row mt-2">
                                    <label className="flex-row" style={{ gap: '5px', margin: 0 }}>
                                        <input type="radio" name="isActive" value="true" checked={editForm.isActive === true} onChange={handleChange} /> Active
                                    </label>
                                    <label className="flex-row" style={{ gap: '5px', margin: 0 }}>
                                        <input type="radio" name="isActive" value="false" checked={editForm.isActive === false} onChange={handleChange} /> Inactive
                                    </label>
                                </div>
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
            </div>

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
                        <h3 className="mb-3">Delete Office</h3>
                        <p className="mb-4">Are you sure you want to delete this office? This action cannot be undone.</p>
                        <div className="flex-row" style={{ justifyContent: 'center' }}>
                            <button className="btn btn-primary" style={{ backgroundColor: 'var(--error-color)' }} onClick={handleDeleteOffice} disabled={isDeleting}>
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