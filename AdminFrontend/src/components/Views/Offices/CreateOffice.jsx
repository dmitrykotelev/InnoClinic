import React, { useState, useMemo } from 'react';
import { CancelDialog } from '../CancelDialog';

const API_BASE_OFFICES = 'http://gateway.inno-clinic.com/api-offices/Offices';
const API_BASE_PHOTOS = 'http://gateway.inno-clinic.com/api-photos/Photo'; 

export const CreateOffice = ({ onBack, onSuccess }) => {
    const initialForm = {
        photo: null,
        city: '',
        street: '',
        houseNumber: '',
        officeNumber: '',
        phone: '+', 
        isActive: true
    };

    const [form, setForm] = useState(initialForm);
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        
        if (type === 'radio') {
            val = value === 'true';
        }

        if (name === 'phone' && type !== 'file' && !val.startsWith('+')) {
            val = '+' + val.replace(/\+/g, '');
        }

        setForm(prev => ({ ...prev, [name]: val }));
        if (touched[name]) setErrors(prev => ({ ...prev, [name]: validateField(name, val) }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    };

    const isFormValid = useMemo(() => {
        const requiredFields = ['city', 'street', 'houseNumber', 'phone'];
        const hasEmptyRequired = requiredFields.some(field => form[field] === '' || form[field] === '+');
        const hasErrors = Object.values(errors).some(err => err !== '');
        return !hasEmptyRequired && !hasErrors;
    }, [form, errors]);

    const handleConfirm = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;
        setIsSubmitting(true);

        const officePart = form.officeNumber.trim() ? `, ${form.officeNumber.trim()}` : '';
        const fullAddress = `${form.city.trim()}, ${form.street.trim()}, ${form.houseNumber.trim()}${officePart}`;

        try {
            // ДОСТАЕМ ТОКЕН
            const token = localStorage.getItem('accessToken');
            let finalPhotoId = "00000000-0000-0000-0000-000000000000";

            if (form.photo) {
                const formData = new FormData();
                formData.append('file', form.photo);

                // ДОБАВЛЕН ТОКЕН (Content-Type браузер ставит сам)
                const photoRes = await fetch(`${API_BASE_PHOTOS}/UploadPhoto`, {
                    method: 'POST',
                    headers: {
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: formData
                });

                if (!photoRes.ok) {
                    throw new Error("Failed to upload photo to the server.");
                }

                const rawPhotoId = await photoRes.text();
                finalPhotoId = rawPhotoId.replace(/"/g, ''); 
            }

            const payload = {
                id: "00000000-0000-0000-0000-000000000000",
                photoId: finalPhotoId, 
                adress: fullAddress, 
                phoneNumber: form.phone,
                isActive: form.isActive,
                status: form.isActive ? 'Active' : 'Inactive'
            };

            // ДОБАВЛЕН ТОКЕН (POST-запрос к Offices)
            const res = await fetch(`${API_BASE_OFFICES}/Add`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || "Bad Request");
            }

            onSuccess(); 
        } catch (error) {
            console.error(error);
            alert("Error: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelClick = () => setShowCancelDialog(true);
    const confirmCancel = (confirm) => {
        setShowCancelDialog(false);
        if (confirm) onBack(); 
    };

    // Рендер компонента остается без изменений
    return (
        <div className="page-container">
            <div className="profile-page-header">
                <button className="btn-go-back" onClick={handleCancelClick}>
                    &larr; Back to Offices List
                </button>
                <h2>Create Office</h2>
            </div>

            <div className="profile-content">
                <form className="edit-profile-form" onSubmit={handleConfirm}>
                    <div className="form-group">
                        <label>Office Photo</label>
                        <input type="file" name="photo" accept="image/*" onChange={handleChange} />
                    </div>

                    <div className="profile-details-grid">
                        <div className="form-group">
                            <label>City *</label>
                            <input type="text" name="city" className={`form-control ${errors.city ? 'is-invalid' : ''}`} value={form.city} onChange={handleChange} onBlur={handleBlur} />
                            {errors.city && <span className="error-msg">{errors.city}</span>}
                        </div>

                        <div className="form-group">
                            <label>Street *</label>
                            <input type="text" name="street" className={`form-control ${errors.street ? 'is-invalid' : ''}`} value={form.street} onChange={handleChange} onBlur={handleBlur} />
                            {errors.street && <span className="error-msg">{errors.street}</span>}
                        </div>

                        <div className="form-group">
                            <label>House Number *</label>
                            <input type="text" name="houseNumber" className={`form-control ${errors.houseNumber ? 'is-invalid' : ''}`} value={form.houseNumber} onChange={handleChange} onBlur={handleBlur} />
                            {errors.houseNumber && <span className="error-msg">{errors.houseNumber}</span>}
                        </div>

                        <div className="form-group">
                            <label>Office Number</label>
                            <input type="text" name="officeNumber" className="form-control" value={form.officeNumber} onChange={handleChange} />
                        </div>

                        <div className="form-group">
                            <label>Registry Phone Number *</label>
                            <input type="text" name="phone" className={`form-control ${errors.phone ? 'is-invalid' : ''}`} value={form.phone} onChange={handleChange} onBlur={handleBlur} />
                            {errors.phone && <span className="error-msg">{errors.phone}</span>}
                        </div>

                        <div className="form-group">
                            <label>Status *</label>
                            <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#333' }}>
                                    <input type="radio" name="isActive" value="true" checked={form.isActive === true} onChange={handleChange} /> Active
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#333' }}>
                                    <input type="radio" name="isActive" value="false" checked={form.isActive === false} onChange={handleChange} /> Inactive
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="edit-actions-footer">
                        <button type="submit" className="btn-save" disabled={!isFormValid || isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Confirm'}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={handleCancelClick}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>

            {showCancelDialog && (
                <CancelDialog 
                    message="Do you really want to cancel? Entered data will not be saved."
                    onConfirm={() => confirmCancel(true)}
                    onCancel={() => confirmCancel(false)}
                />
            )}
        </div>
    );
};