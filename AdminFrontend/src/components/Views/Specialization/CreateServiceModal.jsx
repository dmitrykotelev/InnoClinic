import React, { useState, useMemo } from 'react';
import { CancelDialog } from '../CancelDialog';

const API_BASE_SERVICES = 'https://gateway.inno-clinic.com/api-services';

export const CreateServiceModal = ({ isOpen, onClose, onSuccess, onSaveLocal, specializationId, categories }) => {
    const initialForm = {
        name: '',
        price: '',
        categoryId: '',
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

        setForm(prev => ({ ...prev, [name]: val }));
        if (touched[name]) setErrors(prev => ({ ...prev, [name]: validateField(name, val) }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    };

    const isFormValid = useMemo(() => {
        const requiredFields = ['name', 'price', 'categoryId'];
        const hasEmptyRequired = requiredFields.some(field => form[field] === '');
        const hasErrors = Object.values(errors).some(err => err !== '');
        return !hasEmptyRequired && !hasErrors;
    }, [form, errors]);

    const handleSubmit = async () => {
        if (!isFormValid) return;
        setIsSubmitting(true);

        const payload = {
            name: form.name,
            price: Number(form.price),
            serviceCategoryId: Number(form.categoryId),
            specializationId: specializationId,
            isActive: form.isActive,
            status: form.isActive ? 'Active' : 'Inactive'
        };

        try {
            if (onSaveLocal) {
                onSaveLocal(payload);
                setForm(initialForm);
                setTouched({});
                onClose();
                setIsSubmitting(false);
                return;
            }

            // ДОБАВЛЕН ТОКЕН
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${API_BASE_SERVICES}/Services/Add`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to create service");

            onSuccess(); 
            setForm(initialForm);
            setTouched({});
            onClose();
        } catch (err) {
            console.error(err);
            alert("Error: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelClick = () => setShowCancelDialog(true);
    
    const confirmCancel = (confirm) => {
        setShowCancelDialog(false);
        if (confirm) {
            setForm(initialForm);
            setTouched({});
            onClose(); 
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-card md">
                <div className="modal-header">
                    <h2>Create Service</h2>
                    <button className="btn-close" onClick={handleCancelClick}>&times;</button>
                </div>
                
                <div className="modal-body">
                    <div className="form-group">
                        <label>Service Name *</label>
                        <input type="text" name="name" className={`form-control ${errors.name ? 'is-invalid' : ''}`} value={form.name} onChange={handleChange} onBlur={handleBlur} />
                        {errors.name && <span className="error-msg">{errors.name}</span>}
                    </div>

                    <div className="grid-1-to-2">
                        <div className="form-group">
                            <label>Price *</label>
                            <input type="number" step="0.01" name="price" className={`form-control ${errors.price ? 'is-invalid' : ''}`} value={form.price} onChange={handleChange} onBlur={handleBlur} />
                            {errors.price && <span className="error-msg">{errors.price}</span>}
                        </div>

                        <div className="form-group">
                            <label>Service Category *</label>
                            <select name="categoryId" className={`form-control ${errors.categoryId ? 'is-invalid' : ''}`} value={form.categoryId} onChange={handleChange} onBlur={handleBlur}>
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
                                <input type="radio" name="isActive" value="true" checked={form.isActive === true} onChange={handleChange} /> Active
                            </label>
                            <label className="flex-row" style={{ margin: 0 }}>
                                <input type="radio" name="isActive" value="false" checked={form.isActive === false} onChange={handleChange} /> Inactive
                            </label>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={handleCancelClick}>Cancel</button>
                    <button className="btn btn-primary" disabled={!isFormValid || isSubmitting} onClick={handleSubmit}>
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