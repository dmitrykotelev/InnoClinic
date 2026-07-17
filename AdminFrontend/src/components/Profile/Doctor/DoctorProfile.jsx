import React, { useState, useEffect, useMemo, useCallback } from 'react';
import '../../../styles/Global.css';

const DOCTOR_API_URL = 'http://gateway.inno-clinic.com/api-profiles/Profile/Doctor'; 
const SPECIALIZATIONS_API_URL = 'http://gateway.inno-clinic.com/api-services/Specializations'; 
const OFFICES_API_URL = 'http://gateway.inno-clinic.com/api-offices/Offices'; 
const AUTH_API_URL = 'http://gateway.inno-clinic.com/api-identity/Profile'; 
const PHOTOS_API_URL = 'http://gateway.inno-clinic.com/api-photos/Photo'; 

// Функция для безопасного декодирования JWT-токена на клиенте
const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

export const DoctorProfile = ({ doctorId, userRole, onBack }) => {
    // Если смотрит доктор - редактирование запрещено
    const isEditForbidden = false;

    const [doctor, setDoctor] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [specializationsList, setSpecializationsList] = useState([]);
    const [officesList, setOfficesList] = useState([]);

    const [isEditing, setIsEditing] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [editForm, setEditForm] = useState({});
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});

    const statuses = ["At work", "On vacation", "Sick Day", "Sick Leave", "Self-isolation", "Leave without pay", "Inactive"];
    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();

    const fetchDoctorData = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

            let requestUrl = '';

            // РАЗДЕЛЕНИЕ ЛОГИКИ ЗАПРОСА
            if (doctorId && doctorId !== 'me') {
                // Если doctorId содержит дефисы (значит это длинный GUID AccountId)
                if (String(doctorId).includes('-')) {
                    requestUrl = `${DOCTOR_API_URL}/GetByAccId/${doctorId}`;
                } else {
                    // Иначе это обычный числовой ID доктора (например, 1006)
                    requestUrl = `${DOCTOR_API_URL}/${doctorId}`;
                }
            } else {
                // Вариант Б: Смотрим свой профиль — достаем AccountId (sub) из токена
                if (!token) throw new Error('Сессия истекла. Пожалуйста, войдите заново.');
                
                const decodedToken = parseJwt(token);
                const accId = decodedToken?.sub; // В claim 'sub' хранится Id аккаунта
                
                if (!accId) throw new Error('Не удалось определить ID аккаунта из токена.');
                
                requestUrl = `${DOCTOR_API_URL}/GetByAccId/${accId}`;
            }

            const doctorResponse = await fetch(requestUrl, { headers: authHeader });
            if (!doctorResponse.ok) throw new Error('Doctor not found');
            const doctorData = await doctorResponse.json();

            // Дальнейший сбор связанных данных (специализации, офисы, фото)...
            try {
                const specResponse = await fetch(`${SPECIALIZATIONS_API_URL}/${doctorData.specializationId}`, { headers: authHeader });
                if (specResponse.ok) {
                    const specData = await specResponse.json();
                    doctorData.specializationName = specData.name || specData.specializationName; 
                } else {
                    doctorData.specializationName = `Unknown`;
                }
            } catch (specErr) { doctorData.specializationName = `Unknown`; }

            try {
                const officeResponse = await fetch(`${OFFICES_API_URL}/${doctorData.officeId}`, { headers: authHeader });
                if (officeResponse.ok) {
                    const officeData = await officeResponse.json();
                    doctorData.officeName = officeData.adress || `Office ${doctorData.officeId}`;
                } else {
                    doctorData.officeName = `Unknown`;
                }
            } catch (officeErr) { doctorData.officeName = `Unknown`; }

            try {
                const targetUserId = doctorData.accountId || doctorData.id; 
                const photoIdResponse = await fetch(`${AUTH_API_URL}/GetPhotoId?userId=${targetUserId}`, { headers: authHeader });
                if (photoIdResponse.ok) {
                    const photoId = await photoIdResponse.text();
                    if (photoId && photoId.trim() !== "null" && photoId.trim() !== "") {
                        const photoUrlResponse = await fetch(`${PHOTOS_API_URL}/GetPhoto/${photoId.replace(/"/g, '')}`, { headers: authHeader });
                        if (photoUrlResponse.ok) {
                            const rawUrl = await photoUrlResponse.text();
                            doctorData.photoUrl = rawUrl.replace(/^"|"$/g, ''); 
                            doctorData.photoId = photoId.replace(/"/g, ''); 
                        }
                    } else { doctorData.photoUrl = null; }
                }
            } catch (photoErr) { doctorData.photoUrl = null; }

            setDoctor(doctorData);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [doctorId]);

    useEffect(() => {
        // КОРРЕКТИРОВКА СТАРТОВОГО ВАРНИНГА
        const token = localStorage.getItem('accessToken');
        if (!doctorId && !token) {
            setError("Doctor ID is missing and no active session found.");
            setIsLoading(false);
            return;
        }
        fetchDoctorData();
    }, [doctorId, fetchDoctorData]);

    useEffect(() => {
        if (isEditForbidden) return; 

        const fetchDropdownData = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

                const [officesRes, specsRes] = await Promise.all([
                    fetch(`${OFFICES_API_URL}/GetAll`, { headers: authHeader }),
                    fetch(`${SPECIALIZATIONS_API_URL}/GetAll`, { headers: authHeader })
                ]);
                if (officesRes.ok) setOfficesList(await officesRes.json());
                if (specsRes.ok) setSpecializationsList(await specsRes.json());
            } catch (error) {
                console.error("Ошибка при загрузке справочников:", error);
            }
        };
        fetchDropdownData();
    }, [isEditForbidden]);

    const handleEditClick = () => {
        if (isEditForbidden) return; 
        setEditForm({
            photo: null,
            firstName: doctor.firstName || '',
            lastName: doctor.lastName || '',
            middleName: doctor.middleName || '',
            dateOfBirth: doctor.dateOfBirth ? new Date(doctor.dateOfBirth).toISOString().split('T')[0] : '',
            specialization: doctor.specializationName || '',
            office: doctor.officeName || '',
            careerStartYear: doctor.careerStartYear ? new Date(doctor.careerStartYear).getFullYear() : '',
            status: typeof doctor.status === 'boolean' ? (doctor.status ? 'At work' : 'Inactive') : (doctor.status || 'At work')
        });
        setTouched({});
        setErrors({});
        setIsEditing(true);
    };

    const validateField = (name, value) => {
        let error = '';
        switch (name) {
            case 'firstName':
                if (!value.trim()) error = 'Please, enter the first name';
                break;
            case 'lastName':
                if (!value.trim()) error = 'Please, enter the last name';
                break;
            case 'dateOfBirth':
                if (!value) error = 'Please, select the date';
                else if (value > today) error = 'Date cannot be in the future';
                break;
            case 'specialization':
                if (!value.trim()) error = 'Please, choose the specialisation';
                else if (!specializationsList.some(s => (s.name ?? s.Name ?? s.specializationName) === value)) {
                    error = 'Invalid specialization name';
                }
                break;
            case 'office':
                if (!value) error = 'Please, choose the office';
                break;
            case 'careerStartYear':
                if (!value) error = 'Please, select the year';
                else if (value > currentYear) error = 'Year cannot be in the future';
                break;
            default:
                break;
        }
        return error;
    };

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        const val = type === 'file' ? files[0] : value;
        setEditForm(prev => ({ ...prev, [name]: val }));
        
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
        const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'specialization', 'office', 'careerStartYear'];
        const hasEmptyRequired = requiredFields.some(field => !editForm[field]);
        const hasErrors = Object.values(errors).some(err => err !== '');
        return !hasEmptyRequired && !hasErrors;
    }, [editForm, errors]);

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        if (!isFormValid || isEditForbidden) return;
        setIsSaving(true);

        try {
            const targetUserId = doctor.accountId || doctor.id;
            const token = localStorage.getItem('accessToken');
            const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

            if (editForm.photo) {
                const photoData = new FormData();
                photoData.append('file', editForm.photo); 

                const uploadResponse = await fetch(`${PHOTOS_API_URL}/UploadPhoto?AccountId=${targetUserId}`, {
                    method: 'POST',
                    headers: { ...authHeader },
                    body: photoData,
                });

                if (uploadResponse.ok) {
                    let rawId = await uploadResponse.text();
                    const newPhotoId = rawId.replace(/"/g, ''); 
                    
                    const updatePhotoRes = await fetch(`${AUTH_API_URL}/UpdatePhoto?userId=${targetUserId}&photoId=${newPhotoId}`, {
                        method: 'POST',
                        headers: { 
                            'Content-Length': '0',
                            ...authHeader
                        }
                    });

                    if (!updatePhotoRes.ok) {
                        console.error("Файл загружен, но не удалось привязать его к аккаунту Identity.");
                    }
                }
            }

            const selectedOffice = officesList.find(o => (o.adress ?? o.Adress) === editForm.office);
            const officeId = selectedOffice ? (selectedOffice.id ?? selectedOffice.Id) : doctor.officeId;

            const selectedSpec = specializationsList.find(s => (s.name ?? s.Name ?? s.specializationName) === editForm.specialization);
            const specId = selectedSpec ? (selectedSpec.id ?? selectedSpec.Id) : doctor.specializationId;

            const dateOfBirthIso = new Date(editForm.dateOfBirth).toISOString();
            const careerStartIso = new Date(`${editForm.careerStartYear}-01-01`).toISOString();

            const updatePayload = {
                id: doctor.id,
                firstName: editForm.firstName,
                lastName: editForm.lastName,
                middleName: editForm.middleName || null,
                dateOfBirth: dateOfBirthIso,
                accountId: doctor.accountId,
                specializationId: specId,
                officeId: officeId,
                careerStartYear: careerStartIso,
                status: editForm.status === 'At work'
            };

            const updateResponse = await fetch(`${DOCTOR_API_URL}/Update`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...authHeader 
                },
                body: JSON.stringify(updatePayload)
            });

            if (!updateResponse.ok) throw new Error("Failed to update profile data");

            await fetchDoctorData(); 
            setIsEditing(false);

        } catch (error) {
            console.error("Ошибка при сохранении:", error);
            alert("Error updating profile: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelClick = () => setShowCancelDialog(true);
    const confirmCancel = (confirm) => {
        setShowCancelDialog(false);
        if (confirm) setIsEditing(false); 
    };

    if (isLoading) return <div className="page-container"><div className="empty-state">Loading...</div></div>;
    if (error) return <div className="page-container sm"><div className="empty-state"><h3 style={{color: 'var(--error-color)'}}>{error}</h3><button className="btn btn-secondary mt-3" onClick={onBack}>Go Back</button></div></div>;
    if (!doctor) return <div className="page-container"><div className="empty-state">Data is missing</div></div>;

    const formattedDOB = doctor.dateOfBirth ? new Date(doctor.dateOfBirth).toLocaleDateString() : 'N/A';
    const careerStartYear = doctor.careerStartYear ? new Date(doctor.careerStartYear).getFullYear() : 'N/A';
    const displayStatus = typeof doctor.status === 'boolean' 
        ? (doctor.status ? 'At work' : 'Inactive') 
        : (doctor.status || 'Unknown');

    return (
        <div className="page-container">
            {/* Рендеринг JSX формы остался без изменений */}
            <div className="flex-between mb-4">
                <div className="flex-row">
                    <button className="btn btn-text" onClick={onBack}>&larr; Back</button>
                    <h2 style={{ margin: 0 }}>Doctor Profile</h2>
                </div>
                {!isEditForbidden && !isEditing && (
                    <button className="btn btn-primary" onClick={handleEditClick}>
                        ✏️ Edit Profile
                    </button>
                )}
            </div>

            {!isEditing ? (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
                        {doctor.photoUrl ? (
                            <img src={doctor.photoUrl} alt="Doctor" className="avatar lg" />
                        ) : (
                            <div className="avatar lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', color: 'var(--text-muted)' }}>No Photo</div>
                        )}
                    </div>

                    <div className="grid-1-to-2">
                        <div className="data-card">
                            <span className="doctor-info-label">First Name</span>
                            <div className="doctor-info-value" style={{ textAlign: 'left', maxWidth: 'none', fontSize: '18px' }}>{doctor.firstName}</div>
                        </div>
                        <div className="data-card">
                            <span className="doctor-info-label">Last Name</span>
                            <div className="doctor-info-value" style={{ textAlign: 'left', maxWidth: 'none', fontSize: '18px' }}>{doctor.lastName}</div>
                        </div>
                        <div className="data-card">
                            <span className="doctor-info-label">Middle Name</span>
                            <div className="doctor-info-value" style={{ textAlign: 'left', maxWidth: 'none', fontSize: '18px' }}>{doctor.middleName || '—'}</div>
                        </div>
                        <div className="data-card">
                            <span className="doctor-info-label">Date of Birth</span>
                            <div className="doctor-info-value" style={{ textAlign: 'left', maxWidth: 'none', fontSize: '18px' }}>{formattedDOB}</div>
                        </div>
                        <div className="data-card">
                            <span className="doctor-info-label">Specialization</span>
                            <div className="doctor-info-value" style={{ textAlign: 'left', maxWidth: 'none', fontSize: '18px' }}>{doctor.specializationName}</div>
                        </div>
                        <div className="data-card">
                            <span className="doctor-info-label">Office</span>
                            <div className="doctor-info-value" style={{ textAlign: 'left', maxWidth: 'none', fontSize: '18px' }}>{doctor.officeName}</div>
                        </div>
                        <div className="data-card">
                            <span className="doctor-info-label">Career Start Year</span>
                            <div className="doctor-info-value" style={{ textAlign: 'left', maxWidth: 'none', fontSize: '18px' }}>{careerStartYear}</div>
                        </div>
                        <div className="data-card">
                            <span className="doctor-info-label">Status</span>
                            <div className="doctor-info-value" style={{ textAlign: 'left', maxWidth: 'none', fontSize: '18px' }}>
                                <span className={`badge ${displayStatus === 'At work' ? 'badge-success' : 'badge-error'}`}>{displayStatus}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSaveChanges}>
                    <div className="form-group mb-4">
                        <label>Update Photo</label>
                        <input type="file" name="photo" className="form-control" accept="image/*" onChange={handleChange} />
                    </div>

                    <div className="grid-1-to-2">
                        <div className="form-group">
                            <label>First Name *</label>
                            <input type="text" className={`form-control ${errors.firstName ? 'is-invalid' : ''}`} name="firstName" value={editForm.firstName} onChange={handleChange} onBlur={handleBlur} />
                            {errors.firstName && <span className="error-msg">{errors.firstName}</span>}
                        </div>

                        <div className="form-group">
                            <label>Last Name *</label>
                            <input type="text" className={`form-control ${errors.lastName ? 'is-invalid' : ''}`} name="lastName" value={editForm.lastName} onChange={handleChange} onBlur={handleBlur} />
                            {errors.lastName && <span className="error-msg">{errors.lastName}</span>}
                        </div>

                        <div className="form-group">
                            <label>Middle Name</label>
                            <input type="text" className="form-control" name="middleName" value={editForm.middleName} onChange={handleChange} />
                        </div>

                        <div className="form-group">
                            <label>Date of Birth *</label>
                            <input type="date" className={`form-control ${errors.dateOfBirth ? 'is-invalid' : ''}`} name="dateOfBirth" max={today} value={editForm.dateOfBirth} onChange={handleChange} onBlur={handleBlur} />
                            {errors.dateOfBirth && <span className="error-msg">{errors.dateOfBirth}</span>}
                        </div>

                        <div className="form-group">
                            <label>Specialization *</label>
                            <input list="specs-list" className={`form-control ${errors.specialization ? 'is-invalid' : ''}`} name="specialization" value={editForm.specialization} onChange={handleChange} onBlur={handleBlur} placeholder="Start typing..." />
                            <datalist id="specs-list">
                                {specializationsList.map(spec => (
                                    <option key={spec.id ?? spec.Id} value={spec.name ?? spec.Name ?? spec.specializationName} />
                                ))}
                            </datalist>
                            {errors.specialization && <span className="error-msg">{errors.specialization}</span>}
                        </div>

                        <div className="form-group">
                            <label>Office *</label>
                            <select className={`form-control ${errors.office ? 'is-invalid' : ''}`} name="office" value={editForm.office} onChange={handleChange} onBlur={handleBlur}>
                                <option value="">Select an office...</option>
                                {officesList.map(o => {
                                    const officeAddress = o.adress ?? o.Adress;
                                    return (
                                        <option key={o.id ?? o.Id} value={officeAddress}>
                                            {officeAddress}
                                        </option>
                                    );
                                })}
                            </select>
                            {errors.office && <span className="error-msg">{errors.office}</span>}
                        </div>

                        <div className="form-group">
                            <label>Career Start Year *</label>
                            <input type="number" className={`form-control ${errors.careerStartYear ? 'is-invalid' : ''}`} name="careerStartYear" min="1950" max={currentYear} value={editForm.careerStartYear} onChange={handleChange} onBlur={handleBlur} />
                            {errors.careerStartYear && <span className="error-msg">{errors.careerStartYear}</span>}
                        </div>

                        <div className="form-group">
                            <label>Status *</label>
                            <select className="form-control" name="status" value={editForm.status} onChange={handleChange}>
                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="modal-footer mt-4">
                        <button type="button" className="btn btn-secondary" onClick={handleCancelClick}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={!isFormValid || isSaving}>
                            {isSaving ? 'Saving...' : 'Save changes'}
                        </button>
                    </div>
                </form>
            )}

            {showCancelDialog && (
                <div className="modal-overlay top-tier">
                    <div className="modal-card sm">
                        <h3 className="mb-3">Cancel Edit?</h3>
                        <p className="mb-4">Do you really want to cancel? Changes will not be saved.</p>
                        <div className="flex-row" style={{justifyContent: 'center'}}>
                            <button className="btn btn-primary" onClick={() => confirmCancel(true)}>Yes</button>
                            <button className="btn btn-secondary" onClick={() => confirmCancel(false)}>No</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};