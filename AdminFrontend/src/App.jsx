import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom'; 
import Authorization from "./components/Authorization/Authorization.jsx";

import { DoctorsModule } from "./components/Views/Doctors/DoctorsModel.jsx"; 
import { createAppointment } from './components/Views/Appointments/AppoitmentApi.js';

import { DoctorDashboard } from "./components/Dashboards/DoctorDashboard.jsx";
import { ReceptionistDashboard } from "./components/Dashboards/ReceptonistDashboard.jsx";
import { DoctorProfile } from "./components/Profile/Doctor/DoctorProfile.jsx";
import { MedicalResultView } from './components/Views/MedicalResults/MedicalResultView.jsx'; 
import { PatientProfile } from "./components/Profile/Patient/PatientProfile.jsx"; 

import { SpecializationsModule } from './components/Views/Specialization/SpecializationsModule.jsx';
import './styles/Global.css';
import { OfficesModule } from './components/Views/Offices/OfficesModule.jsx';
import { ReceptionistsModule } from './components/Views/Receptions/ReceptionistsModule.jsx';
import { PatientsModule } from './components/Views/Patients/PatientsModule.jsx';
import { AppointmentsModule } from './components/Views/Appointments/AppointmentsModule.jsx';

const API_BASE_URL = 'https://gateway.inno-clinic.com/api-identity';
const PROFILES_API_URL = 'https://gateway.inno-clinic.com/api-profiles';

const parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        
        const pad = base64.length % 4;
        if (pad) {
            if (pad === 1) throw new Error('Invalid Base64 length');
            base64 += new Array(5 - pad).join('=');
        }

        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Ошибка при парсинге токена", e);
        return null;
    }
};

const MainApp = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [activePatientId, setActivePatientId] = useState(null);
    const [currentView, setCurrentView] = useState(location.state?.targetView || 'main');
    const [forceAuthOpen, setForceAuthOpen] = useState(false);
    const [activeAppointmentId, setActiveAppointmentId] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [userRole, setUserRole] = useState(null);
    
    const [isChecking, setIsChecking] = useState(true); 
    const [accessError, setAccessError] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        if (location.state?.targetView) {
            setCurrentView(location.state.targetView);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);
        
    useEffect(() => {
        checkSession();
    }, []);

    useEffect(() => {
        if (!isChecking && !isLoggedIn && !accessError) {
            setForceAuthOpen(true);
        }
    }, [isChecking, isLoggedIn, accessError]);

    const handleSaveAppointment = async (appointmentData) => {
        const token = localStorage.getItem('accessToken');
        const userId = currentUser?.sub || currentUser?.nameid || currentUser?.name;

        try {
            await createAppointment(appointmentData, token, userId);
            setSuccessMessage("Прием успешно создан!");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error) {
            console.error(error.message);
            alert("Error creating appointment. Please try again.");
        }
    };

    const checkSession = async (newToken = null) => {
        setIsChecking(true);
        setAccessError(null);
        setSuccessMessage("");

        const token = newToken || localStorage.getItem('accessToken');

        if (!token || token === "undefined" || token === "null") {
            clearSessionState();
            setIsChecking(false);
            return;
        }

        try {
            const decodedToken = parseJwt(token);
            if (!decodedToken) throw new Error("Неверный формат токена авторизации");

            const tokenRole = decodedToken.role || decodedToken.Role || decodedToken["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
            const activeRole = Array.isArray(tokenRole) ? tokenRole[0] : tokenRole;

            let profileEndpoint = "";
            if (activeRole === "doctor") {
                profileEndpoint = `${PROFILES_API_URL}/DoctorAuthorize/me`;
            } else if (activeRole === "receptionist") {
                profileEndpoint = `${PROFILES_API_URL}/ReceptionAuthorize/me`;
            } else {
                throw new Error(`У вас нет доступа к панели администратора. Ваша роль: ${activeRole || 'не найдена'}`);
            }

            const userInfoRes = await fetch(`${API_BASE_URL}/connect/userinfo`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!userInfoRes.ok) throw new Error(`Ошибка проверки токена: ${userInfoRes.status}`);
            const userInfo = await userInfoRes.json();

            const profileRes = await fetch(profileEndpoint, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (profileRes.ok) {
                const profile = await profileRes.json();
                setCurrentUser(userInfo);
                setProfileData(profile);
                setUserRole(activeRole || profile.role); 
                setIsLoggedIn(true);
                localStorage.setItem('accessToken', token); 

                setSuccessMessage("Вы успешно авторизованы!");
                setTimeout(() => setSuccessMessage(""), 3000);
            } else {
                const errorData = await profileRes.json().catch(() => ({}));
                throw new Error(errorData.message || "Ваш профиль сотрудника не найден в базе данных.");
            }
        } catch (error) {
            console.error("Ошибка сессии:", error);
            setAccessError(error.message); 
            clearSessionState();
        } finally {
            setIsChecking(false);
        }
    };

    const clearSessionState = () => {
        localStorage.removeItem('accessToken'); 
        setIsLoggedIn(false);
        setCurrentUser(null);
        setProfileData(null);
        setUserRole(null);
    };

    const handleLoginSuccess = (token) => {
        console.log("Токен получен от формы:", token);
        if (token && token !== "undefined") {
            checkSession(token);
        } else {
            setAccessError("Форма авторизации не вернула токен.");
        }
        setForceAuthOpen(false); 
    };

    const handleAuthClose = () => {
        if (isLoggedIn) setForceAuthOpen(false);
    };

    const handleDoctorNavigation = (route, params) => {
        if (route === 'profile') {
            setCurrentView('doctorProfile');
        } else if (route === 'patientProfile') {
            setActivePatientId(params.patientId);
            setCurrentView('patientProfile');
        } else if (route === 'medicalResult') {
            setActiveAppointmentId(params.appointmentId);
            setCurrentView('medicalResult');
        }
    };

    if (isChecking) {
        return <div className="app-container"><div style={{padding: '20px', color: 'white'}}>Загрузка сессии...</div></div>;
    }

    if (accessError) {
        return (
            <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div style={{ backgroundColor: '#1e1e1e', padding: '40px', borderRadius: '12px', textAlign: 'center', border: '1px solid #ff4d4f' }}>
                    <h2 style={{ color: '#ff4d4f', marginBottom: '20px' }}>В Доступе Отказано</h2>
                    <p style={{ color: '#fff', marginBottom: '30px' }}>{accessError}</p>
                    <button 
                        className="btn-action" 
                        onClick={() => {
                            clearSessionState();
                            setAccessError(null);
                            setForceAuthOpen(true);
                        }} 
                        style={{ backgroundColor: '#ff4d4f', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer' }}
                    >
                        Сменить аккаунт (Sign in)
                    </button>
                </div>
            </div>
        );
    } 

    const authComponent = (
        <Authorization 
            apiBaseUrl={API_BASE_URL} 
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
            onLoginSuccess={handleLoginSuccess}
            onLogout={() => {
                clearSessionState();
                setForceAuthOpen(true);
            }}
            forceOpen={forceAuthOpen} 
            onClose={handleAuthClose} 
            unclosable={!isLoggedIn} 
        />
    );

    return (
        <div className="app-container">
            {successMessage && (
                <div style={{ backgroundColor: '#4caf50', color: 'white', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                    {successMessage}
                </div>
            )}

            <div className="top-right-panel">
                <div className="auth-wrapper">
                    {authComponent}
                </div>
            </div>
            
            <main className="main-content" style={{ padding: '20px' }}>
                {currentView === 'doctors' && <DoctorsModule onBack={() => setCurrentView('main')} userRole={userRole} />}
                {currentView === 'specializations' && <SpecializationsModule onBack={() => setCurrentView('main')} />}
                {currentView === 'offices' && <OfficesModule onBack={() => setCurrentView('main')} />}
                {currentView === 'receptionists' && <ReceptionistsModule onBack={() => setCurrentView('main')} />}
                {currentView === 'appointments' && <AppointmentsModule onBack={() => setCurrentView('main')} />}
                {currentView === 'patients' && <PatientsModule onBack={() => setCurrentView('main')} />}
                {currentView === 'medicalResult' && (
                    <MedicalResultView 
                        appointmentId={activeAppointmentId} 
                        currentDoctorId={profileData?.accountId || profileData?.profile?.id} 
                        onBack={() => setCurrentView('main')} 
                    />
                )}
                {currentView === 'patientProfile' && (
                    <PatientProfile 
                        patientId={activePatientId} 
                        onBack={() => setCurrentView('main')} 
                        onViewResult={(appId) => {
                            setActiveAppointmentId(appId);
                            setCurrentView('medicalResult');
                        }}
                    />
                )}

                {currentView === 'doctorProfile' && (
                    <DoctorProfile 
                        doctorId={
                            profileData?.accountId || 
                            profileData?.profile?.id || 
                            profileData?.id || 
                            profileData?.Id 
                        } 
                        userRole={userRole}
                        onBack={() => setCurrentView('main')} 
                    />
                )}

                {currentView === 'main' && isLoggedIn && profileData && (
                    <div>
                        <h1>Добро пожаловать, {profileData.firstName}!</h1>
                        <p style={{ color: 'gray', marginBottom: '20px' }}>Ваша роль: {userRole}</p>
                        <hr style={{ borderColor: '#333', margin: '20px 0' }}/>

                        {userRole === 'doctor' && (
                            <DoctorDashboard 
                                profileData={profileData} 
                                onNavigate={handleDoctorNavigation} 
                            />
                        )}
                        
                        {userRole === 'receptionist' && (
                            <ReceptionistDashboard 
                                setCurrentView={setCurrentView}
                                isLoggedIn={isLoggedIn}
                                handleSaveAppointment={handleSaveAppointment}
                                setForceAuthOpen={setForceAuthOpen}
                            />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

// ==========================================
// ФУНКЦИИ-ОБЕРТКИ ДЛЯ ИЗВЛЕЧЕНИЯ ID ИЗ URL
// ==========================================
const DoctorRouteWrapper = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    return <DoctorProfile doctorId={id} userRole="Receptionist" onBack={() => navigate('/')} />;
};

const PatientRouteWrapper = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    return <PatientProfile patientId={id} onBack={() => navigate('/')} />;
};

// Главный компонент экспорта
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MainApp />} />
                <Route path="/doctor/:id" element={<DoctorRouteWrapper />} />
                <Route path="/patient/:id" element={<PatientRouteWrapper />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;