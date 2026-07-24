import React, { useState, useMemo } from 'react';
import { CancelDialog } from '../CancelDialog'; 

// Укажите эндпоинт контроллера, который мы создали выше
const API_BASE_PROFILES = 'https://gateway.inno-clinic.com/api-profiles/Profile/Patient';

export const CreatePatientModal = ({ isOpen, onClose, onSuccess }) => {
    const initialForm = {
        firstName: '',
        lastName: '',
        middleName: '',
        dateOfBirth: ''
    };

    const [form, setForm] = useState(initialForm);
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isFormValid = useMemo(() => {
        const requiredFields = ['firstName', 'lastName', 'dateOfBirth'];
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
            case 'dateOfBirth': 
                if (!value) {
                    error = "Please, select the date";
                } else {
                    const selectedDate = new Date(value);
                    const today = new Date();
                    if (selectedDate > today) {
                        error = "Date of birth cannot be in the future";
                    }
                }
                break;
            default:
                break;
        }
        return error;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (touched[name]) {
            setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
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
            const payload = {
                firstName: form.firstName,
                lastName: form.lastName,
                middleName: form.middleName,
                dateOfBirth: new Date(form.dateOfBirth).toISOString(),
                isLinkedToAccount: false 
            };

            // ДОБАВЛЕН ТОКЕН (Создание пациента)
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${API_BASE_PROFILES}/Add`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                console.error("ОШИБКА ВАЛИДАЦИИ FLUENT VALIDATOR:", errData);
                throw new Error("Registration failed due to validation errors.");
            }

            setForm(initialForm);
            setTouched({});
            setErrors({});
            onSuccess(); 
        } catch (error) {
            alert("Error: " + error.message);
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
                    <h2>Create Patient</h2>
                    <button className="btn-close" onClick={handleCancelClick}>&times;</button>
                </div>

                <div className="modal-body">
                    <form id="createPatientForm" onSubmit={handleConfirm}>
                        <div className="form-group">
                            <label>First Name *</label>
                            <input 
                                type="text" 
                                name="firstName" 
                                className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                                value={form.firstName} 
                                onChange={handleChange} 
                                onBlur={handleBlur} 
                            />
                            {errors.firstName && <span className="error-msg">{errors.firstName}</span>}
                        </div>

                        <div className="form-group">
                            <label>Last Name *</label>
                            <input 
                                type="text" 
                                name="lastName" 
                                className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                                value={form.lastName} 
                                onChange={handleChange} 
                                onBlur={handleBlur} 
                            />
                            {errors.lastName && <span className="error-msg">{errors.lastName}</span>}
                        </div>

                        <div className="form-group">
                            <label>Middle Name</label>
                            <input 
                                type="text" 
                                name="middleName" 
                                className="form-control" 
                                value={form.middleName} 
                                onChange={handleChange} 
                            />
                        </div>

                        <div className="form-group">
                            <label>Date of Birth *</label>
                            <input 
                                type="date" 
                                name="dateOfBirth" 
                                className={`form-control ${errors.dateOfBirth ? 'is-invalid' : ''}`}
                                value={form.dateOfBirth} 
                                max={new Date().toISOString().split('T')[0]} 
                                onChange={handleChange} 
                                onBlur={handleBlur} 
                            />
                            {errors.dateOfBirth && <span className="error-msg">{errors.dateOfBirth}</span>}
                        </div>
                    </form>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={handleCancelClick}>Cancel</button>
                    <button type="submit" form="createPatientForm" className="btn btn-primary" disabled={!isFormValid || isSubmitting}>
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