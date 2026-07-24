import React, { useState, useEffect, useMemo, useCallback } from 'react';
import '../../../styles/Global.css';

const API_BASE_URL = 'https://gateway.inno-clinic.com/api-profiles';
const DOCUMENTS_API_URL = 'https://gateway.inno-clinic.com/api-photos'; 
const IDENTITY_API_URL = 'https://gateway.inno-clinic.com/api-identity'; 
const API_BASE_APPOINTMENTS = 'https://gateway.inno-clinic.com/api-appointments/Appointments';
const API_BASE_DOCTORS = 'https://gateway.inno-clinic.com/api-profiles/Profile/Doctor';
const API_BASE_SERVICES = 'https://gateway.inno-clinic.com/api-services/Services/GetAll';

// ==========================================
// 1. КОМПОНЕНТ ЛИЧНЫХ ДАННЫХ
// ==========================================
const PatientPersonalInfo = ({ profileData }) => {
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [profileData?.photoUrl]);

    if (!profileData) return null;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
                {profileData.photoUrl && !imgError ? (
                    <img 
                        src={profileData.photoUrl} 
                        alt="Patient" 
                        className="avatar lg" 
                        onError={() => setImgError(true)} 
                    />
                ) : (
                    <div className="avatar lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', color: 'var(--text-muted)' }}>
                        Нет фото
                    </div>
                )}
            </div>

            <div className="grid-1-to-2">
                <div className="data-card">
                    <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>First Name</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)' }}>{profileData.firstName || '—'}</div>
                </div>
                <div className="data-card">
                    <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Last Name</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)' }}>{profileData.lastName || '—'}</div>
                </div>
                <div className="data-card">
                    <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Middle Name</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)' }}>{profileData.middleName || '—'}</div>
                </div>
                <div className="data-card">
                    <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Phone Number</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)' }}>{profileData.phoneNumber || '—'}</div>
                </div>
                <div className="data-card">
                    <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Date of Birth</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                        {profileData.dateOfBirth ? profileData.dateOfBirth.split('T')[0] : '—'}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 2. КОМПОНЕНТ ИСТОРИИ ПРИЕМОВ
// ==========================================
const PatientAppointments = ({ patientId, onViewResult }) => {
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
                // ДОБАВЛЕН ТОКЕН
                const res = await fetch(`${API_BASE_APPOINTMENTS}/GetAllByPatient/${patientId}`, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json', ...authHeader }
                });

                if (res.ok) {
                    const data = await res.json();
                    const sortedData = data.sort((a, b) => new Date(b.date || b.Date) - new Date(a.date || a.Date));
                    
                    const newServicesMap = { ...servicesMap };
                    try {
                        // ДОБАВЛЕН ТОКЕН
                        const servicesRes = await fetch(API_BASE_SERVICES, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', ...authHeader },
                            body: JSON.stringify([]) 
                        });
                        if (servicesRes.ok) {
                            const servicesList = await servicesRes.json();
                            servicesList.forEach(s => { newServicesMap[s.id || s.Id] = s.name || s.serviceName; });
                            setServicesMap(newServicesMap);
                        }
                    } catch (srvErr) { console.error("Failed to load services map:", srvErr); }

                    const uniqueDoctorIds = [...new Set(sortedData.map(app => app.doctorId || app.DoctorId).filter(Boolean))];
                    const newDoctorsMap = { ...doctorsMap };

                    await Promise.all(uniqueDoctorIds.map(async (docId) => {
                        if (newDoctorsMap[docId]) return; 
                        try {
                            // ДОБАВЛЕН ТОКЕН
                            const docRes = await fetch(`${API_BASE_DOCTORS}/${docId}`, {
                                headers: { 'Accept': 'application/json', ...authHeader }
                            });
                            if (docRes.ok) {
                                const docData = await docRes.json();
                                newDoctorsMap[docId] = `${docData.lastName || ''} ${docData.firstName || ''} ${docData.middleName || ''}`.trim();
                            }
                        } catch (e) { console.warn(`Failed to load doctor info for ID: ${docId}`, e); }
                    }));
                    
                    setDoctorsMap(newDoctorsMap);
                    setAppointments(sortedData);

                } else if (res.status === 404) {
                    setAppointments([]);
                } else {
                    throw new Error("Failed to fetch appointments");
                }
            } catch (err) {
                console.error("Appointments fetch error:", err);
            } finally {
                setIsAppointmentsLoading(false);
            }
        };

        fetchAppointmentsAndDetails();
    }, [patientId]);

    if (isAppointmentsLoading) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Загрузка истории приемов и данных персонала...</div>;
    }

    if (appointments.length === 0) {
        return (
            <div className="empty-appointments" style={{ padding: '40px', textAlign: 'center', color: '#666', border: '1px dashed #ccc', borderRadius: '8px' }}>
                <p>У этого пациента пока нет истории приемов.</p>
            </div>
        );
    }

    return (
        <div className="table-responsive">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Date & Time</th>
                        <th>Service Name</th>
                        <th>Doctor Name</th>
                        <th style={{ textAlign: 'center' }}>Status</th>
                        <th style={{ textAlign: 'center' }}>Results</th>
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
                                    <span className={`badge ${isApproved ? 'badge-success' : 'badge-error'}`}>
                                        {isApproved ? 'Approved' : 'Not approved'}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <button 
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => {
                                            if (onViewResult) onViewResult(app.id || app.Id);
                                            else alert("Связь с функцией просмотра потеряна. Проверьте App.jsx");
                                        }}
                                    >
                                        📄 View
                                    </button>
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
// 3. ГЛАВНЫЙ КОНТЕЙНЕР ПРОФИЛЯ ПАЦИЕНТА
// ==========================================
export const PatientProfile = ({ patientId, onBack, onViewResult }) => {
    const [activeTab, setActiveTab] = useState('personal');
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadProfile = async () => {
            if (!patientId) {
                setError("Patient ID is missing");
                setIsLoading(false);
                return;
            }

            const token = localStorage.getItem('accessToken');
            const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

            try {
                // 1. Получаем профиль пациента с токеном
                const profileResponse = await fetch(`${API_BASE_URL}/Profile/Patient/${encodeURIComponent(patientId)}`, {
                    headers: { 'Accept': 'application/json', ...authHeader }
                });

                if (!profileResponse.ok) throw new Error("Failed to load patient profile");
                const data = await profileResponse.json();

                // 2. Достаем Identity ID
                const targetAccountId = data.accountId || data.AccountId || data.userId || data.UserId;

                // 3. Делаем запросы за фото и телефоном
                if (targetAccountId) {
                    
                    // --- Запрос телефона с токеном ---
                    try {
                        const phoneRes = await fetch(`${IDENTITY_API_URL}/Profile/GetPhoneNumber?userId=${encodeURIComponent(targetAccountId)}`, {
                            headers: { ...authHeader }
                        });
                        if (phoneRes.ok) {
                            const rawPhone = await phoneRes.text();
                            data.phoneNumber = rawPhone.replace(/^"|"$/g, ''); 
                        } else {
                            data.phoneNumber = 'Не указан';
                        }
                    } catch (phoneErr) { data.phoneNumber = 'Не указан'; }

                    // --- Запрос ID фотографии с токеном ---
                    let fetchedPhotoId = null;
                    try {
                        const photoIdResponse = await fetch(`${IDENTITY_API_URL}/Profile/GetPhotoId?userId=${encodeURIComponent(targetAccountId)}`, {
                            headers: { 'Accept': 'application/json', ...authHeader }
                        });
                        if (photoIdResponse.ok) {
                            const rawPhotoId = await photoIdResponse.text();
                            fetchedPhotoId = rawPhotoId.replace(/^"|"$/g, ''); 
                        }
                    } catch (photoIdErr) {}

                    // --- Запрос самой фотографии по ее ID с токеном ---
                    if (fetchedPhotoId && fetchedPhotoId !== "0" && fetchedPhotoId !== "null" && fetchedPhotoId !== "") {
                        try {
                            const photoRes = await fetch(`${DOCUMENTS_API_URL}/Photo/GetPhoto/${encodeURIComponent(fetchedPhotoId)}`, {
                                headers: { ...authHeader }
                            });
                            if (photoRes.ok) {
                                const rawUrl = await photoRes.text();
                                data.photoUrl = rawUrl.replace(/^"|"$/g, ''); 
                            } else {
                                data.photoUrl = null;
                            }
                        } catch (pErr) { data.photoUrl = null; }
                    } else {
                        data.photoUrl = null;
                    }

                } else {
                    console.warn("Внимание: Бэкенд не вернул AccountId для этого пациента!");
                    data.phoneNumber = 'Не указан';
                    data.photoUrl = null;
                }

                setProfileData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, [patientId]);

    if (isLoading) return <div className="page-container"><div className="profile-loader" style={{ padding: '40px', textAlign: 'center' }}>Загрузка данных пациента...</div></div>;
    if (error) return <div className="page-container"><div className="profile-error-state" style={{ padding: '40px', textAlign: 'center' }}><h3 style={{ color: 'red' }}>{error}</h3><button className="btn-go-back" onClick={onBack} style={{ marginTop: '20px' }}>Вернуться назад</button></div></div>;

    return (
        <div className="page-container">
            <header className="profile-page-header">
                <button className="btn-go-back" onClick={onBack}>← Back to Schedule</button>
                <h2>Patient Profile</h2>
            </header>

            <div className="profile-tabs">
                <button className={`profile-tab-btn ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>
                    Personal information
                </button>
                <button className={`profile-tab-btn ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>
                    Appointment history
                </button>
            </div>

            <div className="profile-content">
                {activeTab === 'personal' && (
                    <PatientPersonalInfo profileData={profileData} />
                )}

                {activeTab === 'appointments' && (
                    <div className="appointments-tab">
                        <PatientAppointments patientId={patientId} onViewResult={onViewResult} />
                    </div>
                )}
            </div>
        </div>
    );
};