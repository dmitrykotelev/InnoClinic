import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import '../../styles/ProfileCreation.css';

const PATIENT_API_URL = 'http://patients.inno-clinic.com/Profile/Patient'; 
const DOCUMENTS_API_URL = 'http://photos.inno-clinic.com/Photo'; 
const IDENTITY_API_URL = 'http://identity.inno-clinic.com/Profile'; 

const DUENDE_AUTHORITY_URL = 'http://identity.inno-clinic.com'; 

const parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

export const PatientProfileCreation = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [userId, setUserId] = useState(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    const [formData, setFormData] = useState({
        photo: null,
        firstName: '',
        lastName: '',
        middleName: '',
        phoneNumber: '+',
        dateOfBirth: '',
    });

    const [photoPreview, setPhotoPreview] = useState(null);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [showMatchModal, setShowMatchModal] = useState(false);
    const [matchedProfile, setMatchedProfile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const checkAuthAndProfile = async () => {
            const tokenFromUrl = searchParams.get('token');
            const tokenFromStorage = localStorage.getItem('accessToken');
            const token = tokenFromUrl || tokenFromStorage;

            if (!token) {
                navigate('/');
                return;
            }

            const decodedToken = parseJwt(token);
            const extractedUserId = decodedToken?.sub || decodedToken?.nameid || decodedToken?.Id;

            if (!extractedUserId) {
                localStorage.removeItem('accessToken');
                navigate('/');
                return;
            }

            if (tokenFromUrl) {
                localStorage.setItem('accessToken', tokenFromUrl);
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            try {
                const response = await fetch(`${PATIENT_API_URL}/GetByAccId?accountId=${encodeURIComponent(extractedUserId)}`, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                        navigate('/');
                        return;
                }
            } catch (error) {
                console.error("Failed to check existing profile:", error);
            }

            setUserId(extractedUserId);
            setIsLoadingAuth(false);
        };

        checkAuthAndProfile();
    }, [navigate, searchParams]);

    useEffect(() => {
        return () => {
            if (photoPreview) URL.revokeObjectURL(photoPreview);
        };
    }, [photoPreview]);

    const validateField = (name, value) => {
        let error = '';
        switch (name) {
            case 'firstName': if (!value.trim()) error = 'Please, enter the first name'; break;
            case 'lastName': if (!value.trim()) error = 'Please, enter the last name'; break;
            case 'phoneNumber':
                if (value === '+' || !value.trim()) { error = 'Please, enter the phone number'; } 
                else if (!/^\+[0-9]+$/.test(value)) { error = "You've entered an invalid phone number"; }
                break;
            case 'dateOfBirth': if (!value) error = 'Please, select the date'; break;
            default: break;
        }
        return error;
    };

    const validateFile = (file) => {
        if (!file) return '';
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            return 'Invalid format. Allowed: JPG, PNG, WEBP, PDF';
        }
        if (file.size > 5 * 1024 * 1024) { 
            return 'File is too large (max 5MB)';
        }
        return '';
    };

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        
        if (type === 'file') {
            const file = files[0];
            if (!file) {
                setFormData(prev => ({ ...prev, photo: null }));
                setPhotoPreview(null);
                return;
            }
            const fileError = validateFile(file);
            if (fileError) {
                setErrors(prev => ({ ...prev, photo: fileError }));
                setFormData(prev => ({ ...prev, photo: null }));
                setPhotoPreview(null);
            } else {
                setErrors(prev => ({ ...prev, photo: '' }));
                setFormData(prev => ({ ...prev, photo: file }));
                setPhotoPreview(URL.createObjectURL(file));
            }
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
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    };

    const isFormValid = () => {
        const requiredFields = ['firstName', 'lastName', 'phoneNumber', 'dateOfBirth'];
        const hasEmptyFields = requiredFields.some(field => field === 'phoneNumber' ? formData[field] === '+' : !formData[field]);
        const hasErrors = Object.values(errors).some(err => err !== '');
        return !hasEmptyFields && !hasErrors;
    };

    const refreshAuthToken = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            
            if (!refreshToken) {
                console.warn("Отсутствует refresh_token. Невозможно обновить сессию.");
                return;
            }

            const tokenEndpoint = `${DUENDE_AUTHORITY_URL}/connect/token`;

            const params = new URLSearchParams();
            params.append('grant_type', 'refresh_token');
            params.append('refresh_token', refreshToken);
            
            params.append('client_id', 'react_client'); 

            const response = await fetch(tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params
            });

            if (response.ok) {
                const data = await response.json();
                
                if (data.access_token) localStorage.setItem('accessToken', data.access_token);
                if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token);
                
                console.log("Токен успешно обновлен через Duende!");
            } else {
                const errorData = await response.json();
                console.warn("Не удалось обновить токен в Duende:", errorData);
            }
        } catch (error) {
            console.error("Ошибка при обращении к Duende:", error);
        }
    };

    const handlePhotoUpload = async () => {
        if (!formData.photo) return true; 

        const token = localStorage.getItem('accessToken');
        const uploadData = new FormData();
        uploadData.append('file', formData.photo);

        try {
            const uploadRes = await fetch(`${DOCUMENTS_API_URL}/UploadPhoto?AccountId=${encodeURIComponent(userId)}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: uploadData 
            });

            if (!uploadRes.ok) throw new Error('Failed to upload photo to MinIO');
            const photoId = await uploadRes.json();

            const setPhotoRes = await fetch(`${IDENTITY_API_URL}/UpdatePhoto?userId=${encodeURIComponent(userId)}&photoId=${encodeURIComponent(photoId)}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!setPhotoRes.ok) throw new Error('Failed to link photo to user account');
            return true;
        } catch (error) {
            console.error("Photo upload error:", error);
            alert("Произошла ошибка при загрузке фотографии.");
            return false;
        }
    };

    const handlePhoneUpdate = async () => {
        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(`${IDENTITY_API_URL}/UpdatePhoneNumber?userId=${encodeURIComponent(userId)}&phoneNumber=${encodeURIComponent(formData.phoneNumber)}`, {
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to update phone number in Identity");
            return true;
        } catch (error) {
            console.error("Phone update error:", error);
            alert("Произошла ошибка при сохранении номера телефона.");
            return false;
        }
    };

    const checkMatches = async (data) => {
        try {
            const checkData = {
                firstName: data.firstName, lastName: data.lastName, 
                middleName: data.middleName, dateOfBirth: data.dateOfBirth
            };
            const response = await fetch(`${PATIENT_API_URL}/FindAccount`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify(checkData)
            });

            if (response.ok) {
                const matchedProfile = await response.json();
                if (matchedProfile && (matchedProfile.id || matchedProfile.Id)) {
                    return matchedProfile; 
                }
            }
            return null;
        } catch (error) {
            console.error("Ошибка при поиске совпадений:", error);
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const photoUploaded = await handlePhotoUpload();
        if (!photoUploaded) {
            setIsSubmitting(false);
            return; 
        }

        const phoneUpdated = await handlePhoneUpdate();
        if (!phoneUpdated) {
            setIsSubmitting(false);
            return; 
        }

        const match = await checkMatches(formData);
        if (match) {
            setMatchedProfile(match);
            setShowMatchModal(true);
        } else {
            await createProfile();
        }
        setIsSubmitting(false);
    };

    const handleLinkProfile = async () => {
        try {
            const profileId = matchedProfile.id || matchedProfile.Id;
            const url = `${PATIENT_API_URL}/LinkAccount?profileId=${profileId}&accountId=${encodeURIComponent(userId)}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            if (response.ok) {
                setShowMatchModal(false);
                alert('Profile linked successfully!');
                
                await refreshAuthToken(); 
                window.location.href = '/';
            } else {
                alert('Failed to link profile. Please try again.');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred while linking the profile.');
        }
    };

    const handleCreateNew = async () => {
        setShowMatchModal(false);
        await createProfile();
    };

    const createProfile = async () => {
        try {
            const submitData = {
                firstName: formData.firstName, 
                lastName: formData.lastName, 
                middleName: formData.middleName, 
                dateOfBirth: formData.dateOfBirth, 
                IsLinkedToAccount: true,
                accountId: userId 
            };

            const response = await fetch(`${PATIENT_API_URL}/Add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify(submitData)
            });

            if (response.ok) {
                alert('Profile created successfully!');
                
                await refreshAuthToken(); 
                navigate('/');
            } else {
                alert(`Failed to create profile. Check console for details.`);
            }
        } catch (error) {
            console.error('Error creating profile:', error);
            alert('An error occurred while creating the profile.');
        }
    };

    if (isLoadingAuth) {
        return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
    }

    return (
        <div className="profile-creation-container">
            <h2>Create Personal Profile</h2>

            {userId && (
                <div style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
                    Email verified successfully!
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="profile-form">
                
                <div className="form-group">
                    <label>Photo</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px' }}>
                        
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%', 
                            border: '2px solid #ccc', overflow: 'hidden', 
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            backgroundColor: '#f5f5f5', flexShrink: 0
                        }}>
                            {photoPreview ? (
                                formData.photo?.type === 'application/pdf' ? (
                                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#666' }}>PDF</span>
                                ) : (
                                    <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                )
                            ) : (
                                <span style={{ fontSize: '12px', color: '#999' }}>No Photo</span>
                            )}
                        </div>

                        <div style={{ flexGrow: 1 }}>
                            <input 
                                type="file" 
                                name="photo" 
                                onChange={handleChange} 
                                accept="image/jpeg, image/png, image/webp, application/pdf" 
                                style={{ width: '100%' }}
                            />
                            {errors.photo && <span className="error-text" style={{ color: 'red', display: 'block', marginTop: '5px' }}>{errors.photo}</span>}
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label>First Name *</label>
                    <input 
                        type="text" 
                        name="firstName" 
                        value={formData.firstName} 
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
                        value={formData.lastName} 
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
                        value={formData.middleName} 
                        onChange={handleChange} 
                    />
                </div>

                <div className="form-group">
                    <label>Phone Number *</label>
                    <input 
                        type="tel" 
                        name="phoneNumber" 
                        value={formData.phoneNumber} 
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
                        value={formData.dateOfBirth} 
                        onChange={handleChange} 
                        onBlur={handleBlur}
                        className={errors.dateOfBirth ? 'input-error' : ''}
                    />
                    {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
                </div>

                <button 
                    type="submit" 
                    className="confirm-btn" 
                    disabled={!isFormValid() || isSubmitting}
                >
                    {isSubmitting ? 'Processing...' : 'Confirm'}
                </button>
            </form>

            {showMatchModal && matchedProfile && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Match Found</h3>
                        <p>A similar profile has been found, you might have already visited one of our clinics?</p>
                        
                        <div className="matched-profile-info" style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px', margin: '15px 0' }}>
                            <p><strong>Name:</strong> {matchedProfile.firstName} {matchedProfile.middleName} {matchedProfile.lastName}</p>
                            <p><strong>DOB:</strong> {matchedProfile.dateOfBirth ? matchedProfile.dateOfBirth.split('T')[0] : 'N/A'}</p>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-yes" onClick={handleLinkProfile} disabled={isSubmitting}>Yes, it’s me</button>
                            <button className="btn-no" onClick={handleCreateNew} disabled={isSubmitting}>No, it’s not me</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};