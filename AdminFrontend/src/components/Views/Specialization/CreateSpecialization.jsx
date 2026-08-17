import React, { useState } from 'react';
import { CreateServiceModal } from './CreateServiceModal';
import { CancelDialog } from '../CancelDialog';

const API_BASE_SERVICES = 'https://gateway.inno-clinic.com/api-services';

export const CreateSpecialization = ({ categories, categoriesMap, onBack, onSuccess }) => {
    const [form, setForm] = useState({ name: '', isActive: true });
    const [localServices, setLocalServices] = useState([]); 
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});
    
    const [isCreateServiceOpen, setIsCreateServiceOpen] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateField = (name, value) => {
        if (name === 'name' && !value.trim()) return 'Please, enter the name';
        return '';
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

    const isConfirmDisabled = !form.name.trim() || localServices.length === 0 || errors.name;

    const handleAddLocalService = (servicePayload) => {
        setLocalServices(prev => [...prev, { ...servicePayload, localId: Date.now() }]);
    };

    const handleConfirm = async () => {
        if (isConfirmDisabled) return;
        setIsSubmitting(true);

        try {
            // ДОБАВЛЕН ТОКЕН (извлекаем один раз перед циклами)
            const token = localStorage.getItem('accessToken');
            const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

            // 1. Создаем специализацию
            const specRes = await fetch(`${API_BASE_SERVICES}/Specializations/Add`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({ name: form.name, isActive: form.isActive, isActiove: form.isActive })
            });

            if (!specRes.ok) throw new Error("Failed to create specialization");
            const newSpec = await specRes.json();
            const newSpecId = newSpec.id ?? newSpec.Id;

            // 2. Создаем все услуги, привязывая их к новой специализации
            for (let service of localServices) {
                await fetch(`${API_BASE_SERVICES}/Services/Add`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        ...authHeader
                    },
                    body: JSON.stringify({ ...service, specializationId: newSpecId })
                });
            }

            onSuccess(); 
        } catch (error) {
            console.error("Error creating specialization:", error);
            alert("Error: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="page-container">
            <div className="profile-page-header">
                <button className="btn-go-back" onClick={() => setShowCancelDialog(true)}>
                    &larr; Back to Specializations List
                </button>
                <h2>Create Specialization</h2>
            </div>

            <div className="profile-content">
                <div className="form-group" style={{ marginBottom: '25px' }}>
                    <label>Specialization Name *</label>
                    <input type="text" name="name" className={`form-control ${errors.name ? 'is-invalid' : ''}`} value={form.name} onChange={handleChange} onBlur={handleBlur} />
                    {errors.name && <span className="error-msg">{errors.name}</span>}
                </div>

                <div className="form-group" style={{ marginBottom: '25px' }}>
                    <label>Status *</label>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input type="radio" name="isActive" value="true" checked={form.isActive === true} onChange={handleChange} /> Active
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input type="radio" name="isActive" value="false" checked={form.isActive === false} onChange={handleChange} /> Inactive
                        </label>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px' }}>
                    <h3>Services Table</h3>
                    <button className="btn-confirm" onClick={() => setIsCreateServiceOpen(true)} style={{ backgroundColor: '#28a745' }}>
                        ➕ Add service
                    </button>
                </div>

                {localServices.length === 0 ? (
                    <div className="empty-appointments">Table is empty. Add at least 1 service to proceed.</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>
                                <th style={{ padding: '12px' }}>Service Name</th>
                                <th style={{ padding: '12px' }}>Category</th>
                                <th style={{ padding: '12px' }}>Price</th>
                                <th style={{ padding: '12px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {localServices.map(service => (
                                <tr key={service.localId} style={{ borderBottom: '1px solid #dee2e6' }}>
                                    <td style={{ padding: '12px' }}>{service.name}</td>
                                    <td style={{ padding: '12px', color: '#666' }}>{categoriesMap[service.serviceCategoryId]}</td>
                                    <td style={{ padding: '12px' }}>${service.price}</td>
                                    <td style={{ padding: '12px' }}>{service.isActive ? 'Active' : 'Inactive'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <div className="edit-actions-footer" style={{ marginTop: '40px' }}>
                    <button className="btn-confirm" disabled={isConfirmDisabled || isSubmitting} onClick={handleConfirm}>
                        {isSubmitting ? 'Saving...' : 'Confirm'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowCancelDialog(true)}>
                        Cancel
                    </button>
                </div>
            </div>

            <CreateServiceModal 
                isOpen={isCreateServiceOpen} 
                onClose={() => setIsCreateServiceOpen(false)}
                onSaveLocal={handleAddLocalService} 
                categories={categories}
            />

            {showCancelDialog && (
                <CancelDialog 
                    message="Do you really want to cancel? Entered data will not be saved."
                    onConfirm={onBack}
                    onCancel={() => setShowCancelDialog(false)}
                />
            )}
        </div>
    );
};