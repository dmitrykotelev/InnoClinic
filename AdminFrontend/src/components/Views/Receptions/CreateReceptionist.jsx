import React, { useState, useMemo } from 'react';
import { CancelDialog } from './CancelDialog'; 

const API_BASE_IDENTITY = 'https://gateway.inno-clinic.com/api-identity/Profile/Receptionist';
const API_BASE_PHOTOS = 'https://gateway.inno-clinic.com/api-photos/Photo'; // Обновлено на Gateway URL

export const CreateReceptionist = ({ onBack, onSuccess, offices }) => {
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

    // Валидация полей по Acceptance Criteria
    const validateField = (name, value) => {
        let error = '';
        switch (name) {
            case 'firstName': // F-2
                if (!value.trim()) error = "Please, enter the first name";
                break;
            case 'lastName': // F-3
                if (!value.trim()) error = "Please, enter the last name";
                break;
            case 'email': // F-5
                if (!value.trim()) {
                    error = "Please, enter the email";
                } else if (!value.includes('@')) {
                    error = "You've entered an invalid email";
                }
                break;
            case 'officeId': // F-6
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

    // AC-3: Блокировка кнопки
    const isFormValid = useMemo(() => {
        const requiredFields = ['firstName', 'lastName', 'email', 'officeId'];
        const hasEmptyRequired = requiredFields.some(field => !form[field] || form[field] === '');
        const hasErrors = Object.values(errors).some(err => err !== '');
        return !hasEmptyRequired && !hasErrors;
    }, [form, errors]);

    // AC-4: Отправка формы
    const handleConfirm = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;
        setIsSubmitting(true);

        try {
            // ДОСТАЕМ ТОКЕН ОДИН РАЗ ДЛЯ ОБОИХ ЗАПРОСОВ
            const token = localStorage.getItem('accessToken');
            const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};
            let finalPhotoId = "00000000-0000-0000-0000-000000000000";

            // 1. Загрузка фото (если есть)
            if (form.photo) {
                const formData = new FormData();
                formData.append('file', form.photo);

                // ДОБАВЛЕН ТОКЕН (Content-Type браузер ставит сам для FormData)
                const photoRes = await fetch(`${API_BASE_PHOTOS}/UploadPhoto`, {
                    method: 'POST',
                    headers: { ...authHeader },
                    body: formData
                });

                if (!photoRes.ok) throw new Error("Failed to upload photo.");
                const rawPhotoId = await photoRes.text();
                finalPhotoId = rawPhotoId.replace(/"/g, ''); 
            }

            // 2. Сборка DTO (RegisterReceptionist request)
            const payload = {
                email: form.email,
                photoId: finalPhotoId,
                profile: {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    middleName: form.middleName,
                    officeId: form.officeId
                }
            };

            // ДОБАВЛЕН ТОКЕН ДЛЯ РЕГИСТРАЦИИ
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
                
                // Обработка F-5 (Given the email exist in the system)
                if (errData.errors && errData.errors.some(e => e.toLowerCase().includes('email') || e.toLowerCase().includes('already taken'))) {
                    setErrors(prev => ({ ...prev, email: "User with this email already exists" }));
                    setTouched(prev => ({ ...prev, email: true }));
                    throw new Error("User with this email already exists");
                }

                throw new Error("Registration failed.");
            }

            onSuccess(); // AC-9: Успешно создали, возвращаемся назад
        } catch (error) {
            console.error(error);
            if (error.message !== "User with this email already exists") {
                alert("Error: " + error.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // AC-6 - AC-10: Диалог отмены
    const handleCancelClick = () => setShowCancelDialog(true);
    const confirmCancel = (confirm) => {
        setShowCancelDialog(false);
        if (confirm) onBack(); 
    };

    return (
        <div className="page-container sm">
            <div className="modal-header mb-4">
                <button className="btn btn-text" onClick={handleCancelClick}>
                    &larr; Back to Receptionists List
                </button>
                <h2>Create Receptionist</h2>
            </div>

            <form onSubmit={handleConfirm}>
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
                        <select name="officeId" className={`form-control ${errors.officeId ? 'is-invalid' : ''}`} value={form.officeId} onChange={handleChange} onBlur={handleBlur}>
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

                <div className="modal-footer mt-4">
                    <button type="button" className="btn btn-secondary" onClick={handleCancelClick}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={!isFormValid || isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Confirm'}
                    </button>
                </div>
            </form>

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