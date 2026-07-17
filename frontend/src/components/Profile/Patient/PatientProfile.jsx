import React, { useState, useEffect, useMemo } from 'react';
import '../../../styles/Global.css';
import { AppointmentModal } from '../../Appoitments/AppoitmentModal.jsx';
import { rescheduleAppointment } from '../../Appoitments/AppoitmentApi.js';

const API_BASE_URL = 'http://gateway.inno-clinic.com/api-profiles';
const DOCUMENTS_API_URL = 'http://gateway.inno-clinic.com/api-photos'; 
const IDENTITY_API_URL = 'http://gateway.inno-clinic.com/api-identity'; 
const API_BASE_APPOINTMENTS = 'http://gateway.inno-clinic.com/api-appointments/Appointments';
const API_BASE_DOCTORS = 'http://gateway.inno-clinic.com/api-profiles/Profile/Doctor';
const API_BASE_SERVICES = 'http://gateway.inno-clinic.com/api-services/Services/GetAll';

// ==========================================
// 1. КОМПОНЕНТ ИСТОРИИ ПРИЕМОВ 
// ==========================================
const PatientAppointments = ({ patientId, onViewResult, onReschedule, refreshTrigger }) => {
    const [appointments, setAppointments] = useState([]);
    const [isAppointmentsLoading, setIsAppointmentsLoading] = useState(false);
    const [doctorsMap, setDoctorsMap] = useState({});
    const [servicesMap, setServicesMap] = useState({});

    useEffect(() => {
        const fetchAppointmentsAndDetails = async () => {
            if (!patientId) return;
            setIsAppointmentsLoading(true);
            const token = localStorage.getItem('accessToken');
            const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

            try {
                const res = await fetch(`${API_BASE_APPOINTMENTS}/GetAllByPatient/${patientId}`, {
                    method: 'GET', headers: { 'Accept': 'application/json', ...authHeader }
                });

                if (res.ok) {
                    const data = await res.json();
                    const sortedData = data.sort((a, b) => new Date(b.date || b.Date) - new Date(a.date || a.Date));
                    
                    const newServicesMap = { ...servicesMap };
                    try {
                        const servicesRes = await fetch(API_BASE_SERVICES, {
                            method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify([]) 
                        });
                        if (servicesRes.ok) {
                            const servicesList = await servicesRes.json();
                            servicesList.forEach(s => { newServicesMap[s.id || s.Id] = s.name || s.serviceName; });
                            setServicesMap(newServicesMap);
                        }
                    } catch (srvErr) {}

                    const uniqueDoctorIds = [...new Set(sortedData.map(app => app.doctorId || app.DoctorId).filter(Boolean))];
                    const newDoctorsMap = { ...doctorsMap };

                    await Promise.all(uniqueDoctorIds.map(async (docId) => {
                        if (newDoctorsMap[docId]) return; 
                        try {
                            const docRes = await fetch(`${API_BASE_DOCTORS}/${docId}`, { headers: { 'Accept': 'application/json', ...authHeader } });
                            if (docRes.ok) {
                                const docData = await docRes.json();
                                newDoctorsMap[docId] = `${docData.lastName || ''} ${docData.firstName || ''}`.trim();
                            }
                        } catch (e) {}
                    }));
                    
                    setDoctorsMap(newDoctorsMap);
                    setAppointments(sortedData);
                } else if (res.status === 404) {
                    setAppointments([]);
                }
            } catch (err) {
            } finally {
                setIsAppointmentsLoading(false);
            }
        };

        fetchAppointmentsAndDetails();
    }, [patientId, refreshTrigger]);

    if (isAppointmentsLoading) return <div style={{ padding: '40px', textAlign: 'center' }}>Загрузка...</div>;
    if (appointments.length === 0) return <div className="empty-state">Нет истории приемов.</div>;

    return (
        <div className="table-responsive">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Date & Time</th>
                        <th>Service Name</th>
                        <th>Doctor Name</th>
                        <th style={{ textAlign: 'center' }}>Status</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {appointments.map(app => {
                        const isApproved = app.isApproved || app.IsApproved;
                        const serviceName = servicesMap[app.serviceId || app.ServiceId] || `Service #${app.serviceId || app.ServiceId}`;
                        const doctorName = doctorsMap[app.doctorId || app.DoctorId] || `Loading...`;

                        return (
                            <tr key={app.id || app.Id}>
                                <td>
                                    <div style={{ fontWeight: 'bold' }}>{app.date || app.Date}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{app.time || app.Time}</div>
                                </td>
                                <td>{serviceName}</td>
                                <td>{doctorName}</td>
                                <td style={{ textAlign: 'center' }}>
                                    <span className={`badge ${isApproved ? 'badge-success' : 'badge-warning'}`}>
                                        {isApproved ? 'Approved' : 'Pending'}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <div className="flex-row" style={{ justifyContent: 'center' }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => onViewResult(app.id || app.Id)}>📄 View</button>
                                        {!isApproved && (
                                            <button className="btn btn-secondary btn-sm" onClick={() => onReschedule(app)}>🔄 Reschedule</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// ==========================================
// 2. ГЛАВНЫЙ КОНТЕЙНЕР ПРОФИЛЯ ПАЦИЕНТА
// ==========================================
export const PatientProfile = ({ patientId, onBack, onViewResult }) => {
    const [activeTab, setActiveTab] = useState('personal');
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Стейты для редактирования
    const [isEditing, setIsEditing] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});

    // Стейты для переноса приема
    const [rescheduleData, setRescheduleData] = useState(null);
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    const loadProfile = async () => {
        setIsLoading(true);
        if (!patientId) {
            setError("Patient ID is missing");
            setIsLoading(false); return;
        }

        const token = localStorage.getItem('accessToken');
        const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

        try {
            const profileResponse = await fetch(`${API_BASE_URL}/Profile/Patient/GetByAccId?accountId=${encodeURIComponent(patientId)}`, {
                headers: { 'Accept': 'application/json', ...authHeader }
            });

            if (!profileResponse.ok) throw new Error("Patient profile not found");
            const data = await profileResponse.json();
            const targetAccountId = data.accountId || data.AccountId || data.userId || data.UserId;

            if (targetAccountId) {
                try {
                    const phoneRes = await fetch(`${IDENTITY_API_URL}/Profile/GetPhoneNumber?userId=${encodeURIComponent(targetAccountId)}`, { headers: { ...authHeader } });
                    data.phoneNumber = phoneRes.ok ? (await phoneRes.text()).replace(/^"|"$/g, '') : '';
                } catch (phoneErr) { data.phoneNumber = ''; }

                let fetchedPhotoId = null;
                try {
                    const photoIdResponse = await fetch(`${IDENTITY_API_URL}/Profile/GetPhotoId?userId=${encodeURIComponent(targetAccountId)}`, { headers: { 'Accept': 'application/json', ...authHeader } });
                    fetchedPhotoId = photoIdResponse.ok ? (await photoIdResponse.text()).replace(/^"|"$/g, '') : null;
                } catch (e) {}

                if (fetchedPhotoId && fetchedPhotoId !== "0" && fetchedPhotoId !== "null" && fetchedPhotoId !== "") {
                    try {
                        const photoRes = await fetch(`${DOCUMENTS_API_URL}/Photo/GetPhoto/${encodeURIComponent(fetchedPhotoId)}`, { headers: { ...authHeader } });
                        data.photoUrl = photoRes.ok ? (await photoRes.text()).replace(/^"|"$/g, '') : null;
                    } catch (e) { data.photoUrl = null; }
                } else { data.photoUrl = null; }
            }

            setProfileData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadProfile(); }, [patientId]);

    // ==========================================
    // ЛОГИКА РЕДАКТИРОВАНИЯ
    // ==========================================
    const handleEditClick = () => {
        setEditForm({
            photo: null,
            firstName: profileData.firstName || '',
            lastName: profileData.lastName || '',
            middleName: profileData.middleName || '',
            phoneNumber: profileData.phoneNumber ? (profileData.phoneNumber.startsWith('+') ? profileData.phoneNumber : `+${profileData.phoneNumber}`) : '+',
            dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : ''
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
            case 'phoneNumber':
                if (!value || value.trim() === '+') error = 'Please, enter the phone number';
                else if (!/^\+[0-9]+$/.test(value)) error = "You've entered an invalid phone number";
                break;
            case 'dateOfBirth':
                if (!value) error = 'Please, select the date';
                else if (value > today) error = 'Date cannot be in the future';
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
        
        if (touched[name]) setErrors(prev => ({ ...prev, [name]: validateField(name, val) }));
    };

    const handlePhoneChange = (e) => {
        let val = e.target.value;
        // F-5: Жестко фиксируем плюс в начале и убираем всё, кроме цифр после него
        if (!val.startsWith('+')) val = '+' + val.replace(/\+/g, '');
        const cleanVal = '+' + val.substring(1).replace(/[^0-9]/g, '');

        setEditForm(prev => ({ ...prev, phoneNumber: cleanVal }));
        if (touched.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: validateField('phoneNumber', cleanVal) }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    };

    // AC-3: Блокировка кнопки сохранения
    const isFormValid = useMemo(() => {
        const requiredFields = ['firstName', 'lastName', 'phoneNumber', 'dateOfBirth'];
        const hasEmptyRequired = requiredFields.some(field => !editForm[field] || editForm[field] === '+');
        const hasErrors = Object.values(errors).some(err => err !== '');
        return !hasEmptyRequired && !hasErrors;
    }, [editForm, errors]);

    // AC-4: Сохранение данных
    const handleSaveChanges = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;
        setIsSaving(true);

        try {
            const targetAccountId = profileData.accountId || profileData.AccountId || profileData.userId || profileData.UserId;
            const token = localStorage.getItem('accessToken');
            const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

            // 1. Сохраняем фото (если загружено новое)
            if (editForm.photo) {
                const photoData = new FormData();
                photoData.append('file', editForm.photo); 
                const uploadRes = await fetch(`${DOCUMENTS_API_URL}/UploadPhoto?AccountId=${targetAccountId}`, { method: 'POST', headers: { ...authHeader }, body: photoData });
                if (uploadRes.ok) {
                    const newPhotoId = (await uploadRes.text()).replace(/"/g, ''); 
                    await fetch(`${IDENTITY_API_URL}/Profile/UpdatePhoto?userId=${targetAccountId}&photoId=${newPhotoId}`, { method: 'POST', headers: { 'Content-Length': '0', ...authHeader }});
                }
            }

            // 2. Сохраняем номер телефона в Identity API
            if (editForm.phoneNumber !== profileData.phoneNumber) {
                const encodedPhone = encodeURIComponent(editForm.phoneNumber);
                await fetch(`${IDENTITY_API_URL}/Profile/UpdatePhoneNumber?userId=${targetAccountId}&phoneNumber=${encodedPhone}`, { method: 'POST', headers: { 'Content-Length': '0', ...authHeader }});
            }

            // 3. Сохраняем профиль пациента
            const updatePayload = {
                id: profileData.id || profileData.Id,
                firstName: editForm.firstName,
                lastName: editForm.lastName,
                middleName: editForm.middleName || null,
                dateOfBirth: new Date(editForm.dateOfBirth).toISOString(),
                accountId: targetAccountId,
                isLinkedToAccount: profileData.isLinkedToAccount || profileData.IsLinkedToAccount || true
            };

            const updateResponse = await fetch(`${API_BASE_URL}/Profile/Patient/Update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeader },
                body: JSON.stringify(updatePayload)
            });

            if (!updateResponse.ok) throw new Error("Failed to update profile data");

            await loadProfile(); // Перезагружаем свежие данные
            setIsEditing(false); // Возвращаемся в режим просмотра

        } catch (error) {
            alert("Error updating profile: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRescheduleSave = async (formData) => {
        try {
            await rescheduleAppointment(rescheduleData.id || rescheduleData.Id, formData);
            setIsRescheduleModalOpen(false);
            setRescheduleData(null);
            setRefreshTrigger(prev => !prev);
        } catch (err) { alert(err.message); }
    };

    if (isLoading) return <div className="page-container"><div className="empty-state">Загрузка данных пациента...</div></div>;
    if (error) return <div className="page-container"><div className="empty-state"><h3 style={{ color: 'red' }}>{error}</h3><button className="btn btn-secondary mt-3" onClick={onBack}>Вернуться назад</button></div></div>;

    return (
        <div className="page-container">
            <header className="profile-page-header flex-between mb-4">
                <div className="flex-row">
                    <button className="btn btn-text" onClick={onBack}>← Back to Main</button>
                    <h2 style={{margin: 0}}>Patient Profile</h2>
                </div>
                {/* AC-1: Кнопка Edit */}
                {!isEditing && activeTab === 'personal' && (
                    <button className="btn btn-primary" onClick={handleEditClick}>
                        ✏️ Edit Profile
                    </button>
                )}
            </header>

            {!isEditing && (
                <div className="tabs-bar">
                    <button className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>
                        Personal information
                    </button>
                    <button className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>
                        Appointment history
                    </button>
                </div>
            )}

            <div className="profile-content">
                {activeTab === 'personal' && !isEditing && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
                            {profileData.photoUrl ? (
                                <img src={profileData.photoUrl} alt="Patient" className="avatar lg" />
                            ) : (
                                <div className="avatar lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', color: 'var(--text-muted)' }}>No photo</div>
                            )}
                        </div>
                        <div className="grid-1-to-2">
                            <div className="data-card"><div className="doctor-info-label">First Name</div><div className="doctor-info-value" style={{textAlign: 'left', maxWidth: 'none', fontSize: '18px'}}>{profileData.firstName || '—'}</div></div>
                            <div className="data-card"><div className="doctor-info-label">Last Name</div><div className="doctor-info-value" style={{textAlign: 'left', maxWidth: 'none', fontSize: '18px'}}>{profileData.lastName || '—'}</div></div>
                            <div className="data-card"><div className="doctor-info-label">Middle Name</div><div className="doctor-info-value" style={{textAlign: 'left', maxWidth: 'none', fontSize: '18px'}}>{profileData.middleName || '—'}</div></div>
                            <div className="data-card"><div className="doctor-info-label">Phone Number</div><div className="doctor-info-value" style={{textAlign: 'left', maxWidth: 'none', fontSize: '18px'}}>{profileData.phoneNumber || '—'}</div></div>
                            <div className="data-card"><div className="doctor-info-label">Date of Birth</div><div className="doctor-info-value" style={{textAlign: 'left', maxWidth: 'none', fontSize: '18px'}}>{profileData.dateOfBirth ? profileData.dateOfBirth.split('T')[0] : '—'}</div></div>
                        </div>
                    </div>
                )}

                {/* ФОРМА РЕДАКТИРОВАНИЯ */}
                {activeTab === 'personal' && isEditing && (
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
                                <label>Phone Number *</label>
                                <input type="text" className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`} name="phoneNumber" value={editForm.phoneNumber} onChange={handlePhoneChange} onBlur={handleBlur} placeholder="+1234567890" />
                                {errors.phoneNumber && <span className="error-msg">{errors.phoneNumber}</span>}
                            </div>

                            <div className="form-group">
                                <label>Date of Birth *</label>
                                <input type="date" className={`form-control ${errors.dateOfBirth ? 'is-invalid' : ''}`} name="dateOfBirth" max={today} value={editForm.dateOfBirth} onChange={handleChange} onBlur={handleBlur} />
                                {errors.dateOfBirth && <span className="error-msg">{errors.dateOfBirth}</span>}
                            </div>
                        </div>

                        <div className="modal-footer mt-4">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowCancelDialog(true)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={!isFormValid || isSaving}>
                                {isSaving ? 'Saving...' : 'Save changes'}
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === 'appointments' && !isEditing && (
                    <div className="appointments-tab">
                        <PatientAppointments 
                            patientId={profileData.id || profileData.Id} 
                            onViewResult={onViewResult} 
                            refreshTrigger={refreshTrigger}
                            onReschedule={(appData) => {
                                setRescheduleData(appData);
                                setIsRescheduleModalOpen(true);
                            }}
                        />
                    </div>
                )}
            </div>

            {/* ДИАЛОГ ОТМЕНЫ РЕДАКТИРОВАНИЯ (AC-6, AC-7) */}
            {showCancelDialog && (
                <div className="modal-overlay top-tier">
                    <div className="modal-card sm">
                        <h3 className="mb-3">Cancel Edit?</h3>
                        <p className="mb-4">Do you really want to cancel? Changes will not be saved.</p>
                        <div className="flex-row" style={{justifyContent: 'center'}}>
                            <button className="btn btn-primary" onClick={() => { setShowCancelDialog(false); setIsEditing(false); }}>Yes</button>
                            <button className="btn btn-secondary" onClick={() => setShowCancelDialog(false)}>No</button>
                        </div>
                    </div>
                </div>
            )}

            <AppointmentModal 
                isOpen={isRescheduleModalOpen}
                onClose={() => { setIsRescheduleModalOpen(false); setRescheduleData(null); }}
                rescheduleData={rescheduleData}
                onSaveAppointment={handleRescheduleSave}
            />
        </div>
    );
};