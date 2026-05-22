import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/PatientProfile.css';

const API_BASE_URL = 'http://patients.inno-clinic.com';
const DOCUMENTS_API_URL = 'http://photos.inno-clinic.com'; 
const IDENTITY_API_URL = 'http://identity.inno-clinic.com'; 

const parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

export const PatientProfile = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('personal');
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);

    const todayStr = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const loadProfile = async () => {
            const token = localStorage.getItem('accessToken');

            if (!token) {
                navigate('/');
                return;
            }
            
            const decoded = parseJwt(token);
            const accountId = decoded?.sub;

            if (!accountId) {
                setIsLoading(false);
                return;
            }

            try {
                const profileResponse = await fetch(`${API_BASE_URL}/Profile/Patient/GetByAccId?accountId=${encodeURIComponent(accountId)}`, {
                    headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
                });

                if (profileResponse.ok) {
                    const data = await profileResponse.json();

                    try {
                        const phoneRes = await fetch(`${IDENTITY_API_URL}/Profile/GetPhoneNumber?userId=${encodeURIComponent(accountId)}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (phoneRes.ok) {
                            const rawPhone = await phoneRes.text();
                            data.phoneNumber = rawPhone.replace(/^"|"$/g, ''); 
                        }
                    } catch (phoneErr) {
                        console.error(phoneErr);
                        data.phoneNumber = '+'; 
                    }

                    let fetchedPhotoId = null;
                    try {
                        const photoIdResponse = await fetch(`${IDENTITY_API_URL}/Profile/GetPhotoId?userId=${encodeURIComponent(accountId)}`, {
                            headers: { 
                                'Accept': 'application/json',
                                'Authorization': `Bearer ${token}` 
                            }
                        });
                        
                        if (photoIdResponse.ok) {
                            const rawPhotoId = await photoIdResponse.text();
                            fetchedPhotoId = rawPhotoId.replace(/^"|"$/g, ''); 
                            console.log(fetchedPhotoId);
                        }
                    } catch (photoIdErr) {
                        console.error(photoIdErr);
                    }

                    if (fetchedPhotoId && fetchedPhotoId !== "0" && fetchedPhotoId !== "null") {
                        try {
                            const photoRes = await fetch(`${DOCUMENTS_API_URL}/Photo/GetPhoto/${encodeURIComponent(fetchedPhotoId)}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (photoRes.ok) {
                                const rawUrl = await photoRes.text();
                                data.photoUrl = rawUrl.replace(/^"|"$/g, ''); 
                            }
                        } catch (pErr) {
                            console.error(pErr);
                        }
                    } else {
                        data.photoUrl = null;
                    }

                    setProfileData(data);
                }
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, [navigate]);

    const handleEditClick = () => {
        setFormData({
            ...profileData,
            dateOfBirth: profileData.dateOfBirth ? profileData.dateOfBirth.split('T')[0] : '',
            phoneNumber: profileData.phoneNumber || '+',
            photo: null 
        });
        setErrors({});
        setTouched({});
        setIsEditing(true);
    };

    const validateField = (name, value) => {
        let errMsg = '';
        switch (name) {
            case 'firstName': if (!value.trim()) errMsg = 'Please, enter the first name'; break;
            case 'lastName': if (!value.trim()) errMsg = 'Please, enter the last name'; break;
            case 'phoneNumber':
                if (!value || value === '+') { errMsg = 'Please, enter the phone number'; } 
                else if (!/^\+[0-9]+$/.test(value)) { errMsg = "You've entered an invalid phone number"; }
                break;
            case 'dateOfBirth':
                if (!value) { errMsg = 'Please, select the date'; } 
                else if (value > todayStr) { errMsg = 'Date cannot be in the future'; }
                break;
            default: break;
        }
        return errMsg;
    };

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        
        if (type === 'file') {
            const file = files[0];
            if (!file) {
                setFormData(prev => ({ ...prev, photo: null }));
                return;
            }
            setFormData(prev => ({ ...prev, photo: file }));
            return;
        }

        let newValue = value;
        if (name === 'phoneNumber') {
            if (!newValue.startsWith('+')) { newValue = '+' + newValue.replace(/\D/g, ''); } 
            else { newValue = '+' + newValue.slice(1).replace(/\D/g, ''); }
        }

        setFormData(prev => ({ ...prev, [name]: newValue }));
        if (touched[name]) { setErrors(prev => ({ ...prev, [name]: validateField(name, newValue) })); }
    };

    const handleBlur = (e) => {
        const { name, value, type } = e.target;
        if (type === 'file') return;
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    };

    const isFormValid = () => {
        const requiredFields = ['firstName', 'lastName', 'phoneNumber', 'dateOfBirth'];
        const hasEmptyFields = requiredFields.some(field => field === 'phoneNumber' ? formData[field] === '+' : !formData[field]);
        const hasErrors = Object.values(errors).some(err => err !== '');
        return !hasEmptyFields && !hasErrors;
    };

    const handleSave = async () => {
        if (!isFormValid()) return;

        setIsSaving(true);
        const token = localStorage.getItem('accessToken');
        const decoded = parseJwt(token);
        const accountId = decoded?.sub || decoded?.nameid;

        let uploadedPhotoId = null;

        if (formData.photo instanceof File) {
            try {
                const uploadData = new FormData();
                uploadData.append('file', formData.photo);

                const uploadRes = await fetch(`${DOCUMENTS_API_URL}/Photo/UploadPhoto?AccountId=${encodeURIComponent(accountId)}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: uploadData
                });

                const setPhotoRes = await fetch(`${IDENTITY_API_URL}/Profile/UpdatePhoto?userId=${encodeURIComponent(accountId)}&photoId=${encodeURIComponent(uploadedPhotoId)}`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!setPhotoRes.ok) throw new Error('Failed to link photo to user');
                
            } catch (error) {
                console.error("Photo upload error:", error);
            }
        }

        try {
            const phoneRes = await fetch(`${IDENTITY_API_URL}/Profile/UpdatePhoneNumber?userId=${encodeURIComponent(accountId)}&phoneNumber=${encodeURIComponent(formData.phoneNumber)}`, {
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!phoneRes.ok) throw new Error('Failed to update phone in Identity');
        } catch (error) {
            console.error("Phone update error:", error);
        }

        try {
            const dataToSubmit = { ...formData };
            delete dataToSubmit.photo; 
            delete dataToSubmit.phoneNumber; 

            const response = await fetch(`${API_BASE_URL}/Profile/Patient/Update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataToSubmit)
            });

            if (response.ok) {
                let newPhotoUrl = profileData.photoUrl;

                if (uploadedPhotoId) {
                    try {
                        const photoRes = await fetch(`${DOCUMENTS_API_URL}/Photo/GetPhoto/${encodeURIComponent(uploadedPhotoId)}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (photoRes.ok) {
                            const rawUrl = await photoRes.text();
                            newPhotoUrl = rawUrl.replace(/^"|"$/g, '');
                        }
                    } catch (e) { console.error("Failed to fetch new photo URL", e); }
                }

                setProfileData({ ...dataToSubmit, phoneNumber: formData.phoneNumber, photoUrl: newPhotoUrl });
                setIsEditing(false);
            } else {
            }
        } catch (err) {
            console.error("Update error:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelClick = () => {
        setShowCancelDialog(true);
    };

    const confirmCancel = () => {
        setShowCancelDialog(false);
        setIsEditing(false);
    };

    const abortCancel = () => {
        setShowCancelDialog(false);
    };

    if (isLoading) {
        return (
            <div className="profile-page-container">
                <div className="profile-loader">Загрузка данных профиля...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="profile-page-container">
                <div className="profile-error-state">
                    <h3>{error}</h3>
                    <button className="btn-back-home" onClick={() => navigate('/')}>Вернуться на главную</button>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page-container">
            <header className="profile-page-header">
                <button className="btn-go-back" onClick={() => navigate('/')} disabled={isEditing}>
                    ← Назад
                </button>
                <h2>My Profile</h2>
            </header>

            <div className="profile-tabs">
                <button
                    className={`profile-tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
                    onClick={() => !isEditing && setActiveTab('personal')}
                    disabled={isEditing}
                >
                    Personal information
                </button>
                <button
                    className={`profile-tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
                    onClick={() => !isEditing && setActiveTab('appointments')}
                    disabled={isEditing}
                >
                    Appointment results
                </button>
            </div>

            <div className="profile-content">
                {activeTab === 'personal' && profileData && (
                    <div className="personal-info-tab">
                        
                        {!isEditing ? (
                            <>
                                <div className="profile-photo-section">
                                    {profileData.photoUrl ? (
                                        <img 
                                            src={profileData.photoUrl} 
                                            alt="Patient" 
                                            className="profile-photo-large" 
                                            onError={(e) => {
                                                e.target.onerror = null; 
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerHTML = '<div class="profile-photo-placeholder">Фото недоступно</div>';
                                            }}
                                        />
                                    ) : (
                                        <div className="profile-photo-placeholder">Нет фото</div>
                                    )}
                                </div>

                                <div className="profile-details-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">First Name</span>
                                        <span className="detail-value">{profileData.firstName || '—'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Last Name</span>
                                        <span className="detail-value">{profileData.lastName || '—'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Middle Name</span>
                                        <span className="detail-value">{profileData.middleName || '—'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Phone Number</span>
                                        <span className="detail-value">{profileData.phoneNumber || '—'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Date of Birth</span>
                                        <span className="detail-value">
                                            {profileData.dateOfBirth ? profileData.dateOfBirth.split('T')[0] : '—'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="profile-actions">
                                    <button className="btn-edit-profile" onClick={handleEditClick}>Edit</button>
                                </div>
                            </>
                        ) : (
                            <div className="edit-profile-form">
                                <div className="form-group">
                                    <label>Photo (optional)</label>
                                    <input 
                                        type="file" 
                                        name="photo" 
                                        accept="image/jpeg, image/png, image/webp, application/pdf" 
                                        onChange={handleChange}
                                    />
                                    {formData.photo && <span style={{fontSize:'12px', color:'#2e7d32', marginTop:'5px'}}>Файл выбран: {formData.photo.name}</span>}
                                </div>

                                <div className="form-group">
                                    <label>First Name *</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName || ''}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={errors.firstName ? 'input-error' : ''}
                                    />
                                    {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                                </div>

                                <div className="form-group">
                                    <label>Last Name *</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName || ''}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={errors.lastName ? 'input-error' : ''}
                                    />
                                    {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                                </div>

                                <div className="form-group">
                                    <label>Middle Name</label>
                                    <input
                                        type="text"
                                        name="middleName"
                                        value={formData.middleName || ''}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Phone Number *</label>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber || ''}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={errors.phoneNumber ? 'input-error' : ''}
                                    />
                                    {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
                                </div>

                                <div className="form-group">
                                    <label>Date of Birth *</label>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth || ''}
                                        max={todayStr} 
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={errors.dateOfBirth ? 'input-error' : ''}
                                    />
                                    {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
                                </div>

                                <div className="edit-actions-footer">
                                    <button 
                                        className="btn-save" 
                                        onClick={handleSave} 
                                        disabled={!isFormValid() || isSaving}
                                    >
                                        {isSaving ? 'Saving...' : 'Save changes'}
                                    </button>
                                    <button 
                                        className="btn-cancel" 
                                        onClick={handleCancelClick}
                                        disabled={isSaving}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'appointments' && (
                    <div className="appointments-tab">
                        <div className="empty-appointments">
                            <p>No results.</p>
                        </div>
                    </div>
                )}
            </div>

            {showCancelDialog && (
                <div className="modal-overlay">
                    <div className="modal-content cancel-dialog">
                        <h3>Do you really want to cancel?</h3>
                        <p>Changes will not be saved.</p>
                        <div className="modal-footer">
                            <button className="btn-yes" onClick={confirmCancel}>Yes</button>
                            <button className="btn-no" onClick={abortCancel}>No</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};