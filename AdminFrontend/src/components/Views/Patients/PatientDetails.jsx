import React, { useState, useMemo } from 'react';
import { CancelDialog } from '../CancelDialog';

const API_BASE_PROFILES = 'https://gateway.inno-clinic.com/api-profiles/Profile/Patient';
const API_BASE_PHOTOS = 'https://gateway.inno-clinic.com/api-photos/Photo';
const API_BASE_IDENTITY = 'https://gateway.inno-clinic.com/api-identity/Profile';

export const PatientDetails = ({ patient, onBack, onUpdated }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [activeTab, setActiveTab] = useState('personal'); 

    const [form, setForm] = useState({});
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const accountId = patient.accountId ?? patient.AccountId;
    const isOffline = !accountId;

    const formatDateForView = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toISOString().split('T')[0];
    };

    const handleEditClick = () => {
        setForm({
            firstName: patient.firstName || '',
            lastName: patient.lastName || '',
            middleName: patient.middleName || '',
            dateOfBirth: formatDateForInput(patient.dateOfBirth),
            phoneNumber: isOffline ? '' : (patient.phoneNumber && patient.phoneNumber !== 'N/A' ? patient.phoneNumber : '+'),
            photo: null 
        });
        setTouched({});
        setErrors({});
        setIsEditing(true);
    };

    const validateField = (name, value) => {
        let error = '';
        switch (name) {
            case 'firstName':
                if (!value.trim()) error = "Please, enter the first name";
                break;
            case 'lastName':
                if (!value.trim()) error = "Please, enter the last name";
                break;
            case 'phoneNumber':
                if (!isOffline && (value === '+' || !value.trim())) error = "Please, enter the phone number";
                break;
            case 'dateOfBirth':
                if (!value) {
                    error = "Please, choose date of birth";
                } else {
                    const selectedDate = new Date(value);
                    if (selectedDate > new Date()) error = "Date of birth cannot be in the future";
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

        if (name === 'phoneNumber' && type !== 'file' && !val.startsWith('+')) {
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
        const requiredFields = ['firstName', 'lastName', 'dateOfBirth'];
        if (!isOffline) requiredFields.push('phoneNumber'); 

        const hasEmptyRequired = requiredFields.some(field => !form[field] || form[field] === '+');
        const hasErrors = Object.values(errors).some(err => err !== '');
        return !hasEmptyRequired && !hasErrors;
    }, [form, errors, isOffline]);

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;
        setIsSaving(true);

        try {
            // ИЗВЛЕКАЕМ ТОКЕН ОДИН РАЗ
            const token = localStorage.getItem('accessToken');
            const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

            if (!isOffline) {
                // ДОБАВЛЕН ТОКЕН (Загрузка фото)
                if (form.photo) {
                    const formData = new FormData();
                    formData.append('file', form.photo);

                    const photoRes = await fetch(`${API_BASE_PHOTOS}/UploadPhoto`, { 
                        method: 'POST', 
                        headers: { ...authHeader },
                        body: formData 
                    });
                    
                    if (photoRes.ok) {
                        const rawPhotoId = await photoRes.text();
                        const finalPhotoId = rawPhotoId.replace(/"/g, ''); 
                        
                        // ДОБАВЛЕН ТОКЕН (Обновление фото в Identity)
                        await fetch(`${API_BASE_IDENTITY}/UpdatePhoto?userId=${accountId}&photoId=${finalPhotoId}`, { 
                            method: 'POST',
                            headers: { ...authHeader }
                        });
                    }
                }

                // ДОБАВЛЕН ТОКЕН (Обновление телефона в Identity)
                if (form.phoneNumber !== patient.phoneNumber) {
                    const phoneUrl = `${API_BASE_IDENTITY}/UpdatePhoneNumber?userId=${accountId}&phoneNumber=${encodeURIComponent(form.phoneNumber)}`;
                    await fetch(phoneUrl, { 
                        method: 'POST',
                        headers: { ...authHeader }
                    });
                }
            }

            const payload = {
                id: patient.id ?? patient.Id,
                accountId: accountId || null,
                firstName: form.firstName,
                lastName: form.lastName,
                middleName: form.middleName,
                isLinkedToAccount: patient.isLinkedToAccount ?? patient.IsLinkedToAccount,
                dateOfBirth: new Date(form.dateOfBirth).toISOString() 
            };

            // ДОБАВЛЕН ТОКЕН (Обновление данных профиля)
            const profileRes = await fetch(`${API_BASE_PROFILES}/Update`, {
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify(payload)
            });

            if (!profileRes.ok) {
                const errorText = await profileRes.text();
                throw new Error(`Failed to update profile: ${errorText}`);
            }

            setIsEditing(false);
            onUpdated(); 

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

    // Рендер компонента остается без изменений...
    return (
        <div className="page-container">
            <div className="flex-between mb-4">
                <div className="flex-row">
                    <button className="btn btn-text" onClick={onBack}>
                        &larr; Back to Patients List
                    </button>
                    <h2 style={{ margin: 0 }}>{isEditing ? 'Edit Patient Profile' : 'Patient Profile'}</h2>
                    {isOffline && <span className="badge badge-warning">Offline Patient</span>}
                </div>
            </div>

            <div className="tabs-bar">
                <button 
                    className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
                    onClick={() => setActiveTab('personal')}
                >
                    Personal Information
                </button>
            </div>

            <div>
                {!isEditing ? (
                    activeTab === 'personal' && (
                        <>
                            {!isOffline && (
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
                                    {patient.photoUrl ? (
                                        <img src={patient.photoUrl} alt="Patient" className="avatar lg" />
                                    ) : (
                                        <div className="avatar lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', color: 'var(--text-muted)' }}>No Photo</div>
                                    )}
                                </div>
                            )}

                            <div className="grid-1-to-2 mb-4">
                                <div className="data-card">
                                    <span className="doctor-info-label">First Name</span>
                                    <div className="doctor-info-value" style={{ textAlign: 'left', maxWidth: 'none', fontSize: '18px' }}>{patient.firstName || 'N/A'}</div>
                                </div>
                                <div className="data-card">
                                    <span className="doctor-info-label">Last Name</span>
                                    <div className="doctor-info-value" style={{ textAlign: 'left', maxWidth: 'none', fontSize: '18px' }}>{patient.lastName || 'N/A'}</div>
                                </div>
                                <div className="data-card">
                                    <span className="doctor-info-label">Middle Name</span>
                                    <div className="doctor-info-value" style={{ textAlign: 'left', maxWidth: 'none', fontSize: '18px' }}>{patient.middleName || 'N/A'}</div>
                                </div>
                                <div className="data-card">
                                    <span className="doctor-info-label">Date of Birth</span>
                                    <div className="doctor-info-value" style={{ textAlign: 'left', maxWidth: 'none', fontSize: '18px' }}>{formatDateForView(patient.dateOfBirth)}</div>
                                </div>
                                {!isOffline && (
                                    <div className="data-card">
                                        <span className="doctor-info-label">Phone Number</span>
                                        <div className="doctor-info-value" style={{ textAlign: 'left', maxWidth: 'none', fontSize: '18px' }}>{patient.phoneNumber || 'N/A'}</div>
                                    </div>
                                )}
                            </div>

                            <div className="flex-end">
                                <button className="btn btn-primary" onClick={handleEditClick}>
                                    ✏️ Edit
                                </button>
                            </div>
                        </>
                    )
                ) : (
                    <form onSubmit={handleSaveChanges}>
                        {!isOffline && (
                            <div className="form-group">
                                <label>Photo</label>
                                <input type="file" name="photo" className="form-control" accept="image/*" onChange={handleChange} />
                            </div>
                        )}

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

                            {!isOffline && (
                                <div className="form-group">
                                    <label>Phone Number *</label>
                                    <input type="text" name="phoneNumber" className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`} value={form.phoneNumber} onChange={handleChange} onBlur={handleBlur} />
                                    {errors.phoneNumber && <span className="error-msg">{errors.phoneNumber}</span>}
                                </div>
                            )}
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
        </div>
    );
};