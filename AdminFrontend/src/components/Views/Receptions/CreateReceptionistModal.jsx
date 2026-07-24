import React, { useState, useMemo } from 'react';
import { CancelDialog } from '../CancelDialog';

const API_BASE_IDENTITY = 'https://gateway.inno-clinic.com/api-identity/Profile/Receptionist';
const API_BASE_PHOTOS = 'https://gateway.inno-clinic.com/api-photos/Photo';

export const CreateReceptionistModal = ({ isOpen, onClose, onSuccess, offices }) => {
    const initialForm = {
        photo: null,
        firstName: '',
        lastName: '',
        middleName: '',
        email: '',
        officeId: ''
    };

    const [form, setForm] = useState(initialForm);
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isFormValid = useMemo(() => {
        const requiredFields = ['firstName', 'lastName', 'email', 'officeId'];
        const hasEmptyRequired = requiredFields.some(field => !form[field] || form[field].toString().trim() === '');
        const hasErrors = Object.values(errors).some(err => err !== '');
        return !hasEmptyRequired && !hasErrors;
    }, [form, errors]);
    
    if (!isOpen) return null;

    const validateField = (name, value) => {
        let error = '';
        switch (name) {
            case 'firstName': 
                if (!value.trim()) error = "Please, enter the first name";
                break;
            case 'lastName': 
                if (!value.trim()) error = "Please, enter the last name";
                break;
            case 'email': 
                if (!value.trim()) {
                    error = "Please, enter the email";
                } else if (!value.includes('@')) {
                    error = "You've entered an invalid email";
                }
                break;
            case 'officeId': 
                if (!value) error = "Please, choose the office";
                break;
            default:
                break;
        }
        return error;
    };

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        const val = type === 'file' ? files[0] : value;

        setForm(prev => ({ ...prev, [name]: val }));
        if (touched[name]) {
            setErrors(prev => ({ ...prev, [name]: validateField(name, val) }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    };

    const handleConfirm = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;
        setIsSubmitting(true);

        try {
            // ДОБАВЛЕН ТОКЕН
            const token = localStorage.getItem('accessToken');
            const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};
            let finalPhotoId = "00000000-0000-0000-0000-000000000000";

            if (form.photo) {
                const formData = new FormData();
                formData.append('file', form.photo);

                // Загрузка фото с токеном
                const photoRes = await fetch(`${API_BASE_PHOTOS}/UploadPhoto`, {
                    method: 'POST',
                    headers: { ...authHeader },
                    body: formData
                });

                if (!photoRes.ok) throw new Error("Failed to upload photo.");
                const rawPhotoId = await photoRes.text();
                finalPhotoId = rawPhotoId.replace(/"/g, ''); 
            }

            const payload = {
                email: form.email,
                photoId: finalPhotoId,
                profile: {
                    accountId: "", 
                    firstName: form.firstName,
                    lastName: form.lastName,
                    middleName: form.middleName,
                    officeId: form.officeId
                }
            };

            // Регистрация с токеном
            const res = await fetch(`${API_BASE_IDENTITY}/Registrate`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                console.error("ОТВЕТ ОТ БЭКЕНДА (ОШИБКИ ВАЛИДАЦИИ):", errData);

                let isEmailError = false;
                let errorMessage = "Registration failed due to invalid data.";

                const backendErrors = errData.errors || errData.Errors;

                if (backendErrors) {
                    if (Array.isArray(backendErrors)) {
                        isEmailError = backendErrors.some(e => typeof e === 'string' && (e.toLowerCase().includes('email') || e.toLowerCase().includes('already taken')));
                        errorMessage = backendErrors.join(" | ");
                    } else if (typeof backendErrors === 'object') {
                        const allMessages = Object.values(backendErrors).flat();
                        isEmailError = allMessages.some(e => typeof e === 'string' && (e.toLowerCase().includes('email') || e.toLowerCase().includes('already taken')));
                        errorMessage = allMessages.join(" | ");
                    }
                }

                if (isEmailError) {
                    setErrors(prev => ({ ...prev, email: "User with this email already exists" }));
                    setTouched(prev => ({ ...prev, email: true }));
                    throw new Error("User with this email already exists");
                }

                throw new Error(errorMessage);
            }

            setForm(initialForm);
            setTouched({});
            setErrors({});
            onSuccess(); 
        } catch (error) {
            console.error(error);
            if (error.message !== "User with this email already exists") {
                alert("Registration Error: " + error.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelClick = (e) => {
        e.preventDefault();
        setShowCancelDialog(true);
    };

    const confirmCancel = (confirm) => {
        setShowCancelDialog(false);
        if (confirm) {
            setForm(initialForm);
            setTouched({});
            setErrors({});
            onClose(); 
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card md">
                <div className="modal-header">
                    <h2>Create Receptionist</h2>
                    <button className="btn-close" onClick={handleCancelClick}>&times;</button>
                </div>

                <div className="modal-body">
                    <form id="createRecForm" onSubmit={handleConfirm}>
                        <div className="form-group mb-3">
                            <label>Photo</label>
                            <input type="file" name="photo" className="form-control" accept="image/*" onChange={handleChange} />
                        </div>

                        <div className="grid-1-to-2">
                            <div className="form-group">
                                <label>First Name *</label>
                                <input type="text" name="firstName" className={`form-control ${errors.firstName ? 'is-invalid' : ''}`} value={form.firstName} onChange={handleChange} onBlur={handleBlur} />
                                {errors.firstName && <span className="error-msg">{errors.firstName}</span>}
                            </div>

                            <div className="form-group">
                                <label>Last Name *</label>
                                <input type="text" name="lastName" className={`form-control ${errors.lastName ? 'is-invalid' : ''}`} value={form.lastName} onChange={handleChange} onBlur={handleBlur} />
                                {errors.lastName && <span className="error-msg">{errors.lastName}</span>}
                            </div>

                            <div className="form-group">
                                <label>Middle Name</label>
                                <input type="text" name="middleName" className="form-control" value={form.middleName} onChange={handleChange} />
                            </div>

                            <div className="form-group">
                                <label>E-mail *</label>
                                <input type="email" name="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} value={form.email} onChange={handleChange} onBlur={handleBlur} />
                                {errors.email && <span className="error-msg">{errors.email}</span>}
                            </div>

                            <div className="form-group">
                                <label>Office *</label>
                                <select 
                                    name="officeId" 
                                    className={`form-control ${errors.officeId ? 'is-invalid' : ''}`} 
                                    value={form.officeId} 
                                    onChange={handleChange} 
                                    onBlur={handleBlur}
                                >
                                    <option value="">Select office...</option>
                                    {offices.map(off => (
                                        <option key={off.id ?? off.Id} value={off.id ?? off.Id}>
                                            {off.adress ?? off.address ?? off.Adress}
                                        </option>
                                    ))}
                                </select>
                                {errors.officeId && <span className="error-msg">{errors.officeId}</span>}
                            </div>
                        </div>
                    </form>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={handleCancelClick}>Cancel</button>
                    <button type="submit" form="createRecForm" className="btn btn-primary" disabled={!isFormValid || isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Confirm'}
                    </button>
                </div>
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