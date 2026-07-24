import React, { useState, useMemo } from 'react';
import { CancelDialog } from '../CancelDialog';
import '../../../styles/Global.css'; 

const API_BASE_PROFILES = 'https://gateway.inno-clinic.com/api-profiles/Profile/Reception';
const API_BASE_PHOTOS = 'https://gateway.inno-clinic.com/api-photos/Photo';
const API_BASE_IDENTITY = 'https://gateway.inno-clinic.com/api-identity/Profile';

export const ReceptionistDetails = ({ receptionist, officesMap, officesArray, onBack, onUpdated }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    
    const [form, setForm] = useState({});
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const officeAddress = officesMap[receptionist.officeId] || 'No Office Assigned';

    const handleEditClick = () => {
        setForm({
            firstName: receptionist.firstName || '',
            lastName: receptionist.lastName || '',
            middleName: receptionist.middleName || '',
            officeId: receptionist.officeId || '',
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

    const isFormValid = useMemo(() => {
        const requiredFields = ['firstName', 'lastName', 'officeId'];
        const hasEmptyRequired = requiredFields.some(field => !form[field] || form[field].toString().trim() === '');
        const hasErrors = Object.values(errors).some(err => err !== '');
        return !hasEmptyRequired && !hasErrors;
    }, [form, errors]);

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;
        setIsSaving(true);

        try {
            // ДОБАВЛЕН ТОКЕН
            const token = localStorage.getItem('accessToken');
            const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};
            const accountId = receptionist.accountId ?? receptionist.AccountId;

            if (form.photo) {
                const formData = new FormData();
                formData.append('file', form.photo);

                // Загрузка фото с токеном
                const photoRes = await fetch(`${API_BASE_PHOTOS}/UploadPhoto`, { 
                    method: 'POST', 
                    headers: { ...authHeader },
                    body: formData 
                });
                
                if (!photoRes.ok) throw new Error("Failed to upload new photo to storage");

                const rawPhotoId = await photoRes.text();
                const finalPhotoId = rawPhotoId.replace(/"/g, ''); 

                if (accountId) {
                    // Обновление фото с токеном
                    const updatePhotoRes = await fetch(`${API_BASE_IDENTITY}/UpdatePhoto?userId=${accountId}&photoId=${finalPhotoId}`, {
                        method: 'POST',
                        headers: { ...authHeader }
                    });
                    
                    if (!updatePhotoRes.ok) {
                        throw new Error("Failed to link the new photo to the account");
                    }
                }
            }

            const payload = {
                id: receptionist.id ?? receptionist.Id,
                accountId: accountId,
                firstName: form.firstName,
                lastName: form.lastName,
                middleName: form.middleName,
                officeId: form.officeId
            };

            // Обновление профиля с токеном
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
                throw new Error(`Failed to update profile data: ${errorText}`);
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

    return (
        <div className="page-container">
            <div className="flex-between mb-4">
                <div className="flex-row">
                    <button className="btn btn-text" onClick={onBack}>
                        &larr; Back to Receptionists List
                    </button>
                    <h2 style={{ margin: 0 }}>{isEditing ? 'Edit Profile' : 'Personal Information'}</h2>
                </div>
            </div>

            <div>
                {!isEditing ? (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
                            {receptionist.photoUrl ? (
                                <img src={receptionist.photoUrl} alt="Receptionist" className="avatar lg" />
                            ) : (
                                <div className="avatar lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', color: 'var(--text-muted)' }}>
                                    No Photo
                                </div>
                            )}
                        </div>

                        <div className="grid-1-to-2 mb-4">
                            <div className="data-card">
                                <span className="doctor-info-label">First Name</span>
                                <div className="doctor-info-value" style={{ textAlign: 'left', maxWidth: 'none', fontSize: '18px' }}>{receptionist.firstName || 'N/A'}</div>
                            </div>
                            <div className="data-card">
                                <span className="doctor-info-label">Last Name</span>
                                <div className="doctor-info-value" style={{ textAlign: 'left', maxWidth: 'none', fontSize: '18px' }}>{receptionist.lastName || 'N/A'}</div>
                            </div>
                            <div className="data-card">
                                <span className="doctor-info-label">Middle Name</span>
                                <div className="doctor-info-value" style={{ textAlign: 'left', maxWidth: 'none', fontSize: '18px' }}>{receptionist.middleName || 'N/A'}</div>
                            </div>
                            <div className="data-card">
                                <span className="doctor-info-label">Office</span>
                                <div className="doctor-info-value" style={{ textAlign: 'left', maxWidth: 'none', fontSize: '18px' }}>{officeAddress}</div>
                            </div>
                        </div>

                        <div className="flex-end">
                            <button className="btn btn-primary" onClick={handleEditClick}>
                                ✏️ Edit
                            </button>
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleSaveChanges}>
                        <div className="form-group mb-3">
                            <label>Photo</label>
                            <input type="file" name="photo" className="form-control" accept="image/*" onChange={handleChange} />
                            {receptionist.photoUrl && !form.photo && (
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '5px' }}>Leave empty to keep current photo.</small>
                            )}
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
                                <label>Office *</label>
                                <select 
                                    name="officeId" 
                                    className={`form-control ${errors.officeId ? 'is-invalid' : ''}`} 
                                    value={form.officeId} 
                                    onChange={handleChange} 
                                    onBlur={handleBlur}
                                >
                                    <option value="">Select office...</option>
                                    {officesArray.map(off => (
                                        <option key={off.id ?? off.Id} value={off.id ?? off.Id}>
                                            {off.adress ?? off.address ?? off.Adress}
                                        </option>
                                    ))}
                                </select>
                                {errors.officeId && <span className="error-msg">{errors.officeId}</span>}
                            </div>
                        </div>

                        <div className="modal-footer mt-4">
                            <button type="button" className="btn btn-secondary" onClick={handleCancelClick}>
                                Cancel
                            </button>
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