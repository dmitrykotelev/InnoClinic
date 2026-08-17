import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import Authorization from "./components/Authorization/Authorization.jsx";

import { PatientDoctorsModule } from "./components/Views/Doctors/PatientDoctorsModule.jsx";

import { ServicesModule } from "./components/Views/Services/ServicesModule.jsx";
import { EntryView } from "./components/Views/EntryView.jsx";
import { PatientProfileCreation } from "./components/Profile/Patient/PatientProfileCreations.jsx";
import { PatientProfile } from './components/Profile/Patient/PatientProfile.jsx';
import { DoctorProfile } from './components/Profile/Doctor/DoctorProfile.jsx';
import { AppointmentModal } from './components/Appoitments/AppoitmentModal.jsx';
import { createAppointment } from './components/Appoitments/AppoitmentApi.js';

import { MedicalResultView } from './components/Views/MedicalResults/MedicalResultView.jsx';

import './styles/Doctors.css';
import './styles/App.css';

const API_BASE_URL = 'https://gateway.inno-clinic.com/api-identity';
const PROFILES_API_URL = 'https://gateway.inno-clinic.com/api-profiles';

const MainApp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [currentView, setCurrentView] = useState(location.state?.targetView || 'main');
    const [forceAuthOpen, setForceAuthOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [accessError, setAccessError] = useState(null);
    
    useEffect(() => {
        if (location.state?.targetView) {
            setCurrentView(location.state.targetView);
            window.history.replaceState({}, document.title)
        }
    }, [location.state]);
        
    useEffect(() => {
        checkSession();
    }, []);
    const handleSaveAppointment = async (appointmentData) => {
            const token = localStorage.getItem('accessToken');
            const userId = currentUser?.sub || currentUser?.nameid;

    const handleSaveAppointment = async (appointmentData) => {
        const token = localStorage.getItem('accessToken');
        const userId = currentUser?.sub || currentUser?.nameid;

        try {
            await createAppointment(appointmentData, token, userId);
            console.log("Appointment successfully saved to DB!");
        } catch (error) {
            console.error(error.message);
            alert("Error creating appointment. Please try again.");
        }
    };

    const checkSession = async (newToken = null) => {
        setAccessError(null);
        const token = newToken || localStorage.getItem('accessToken');
        console.log("App checking session. Token found:", !!token);

        if (!token || token === "undefined" || token === "null") {
            return clearSessionState();
        }

        try {
            const response = await fetch(`${API_BASE_URL}/connect/userinfo`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const userInfo = await response.json();
                
                const profileRes = await fetch(`${PROFILES_API_URL}/PatientAuthorize/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    
                    setCurrentUser({
                        ...userInfo,
                        firstName: profileData.firestName || profileData.firstName, 
                        lastName: profileData.lastName
                    });
                    
                    setIsLoggedIn(true);
                    localStorage.setItem('accessToken', token); 
                    
                    if (!profileData.isProfileCreated) {
                        console.log("User needs to create a profile!");
                    }
                } else {
                    const errorData = await profileRes.json().catch(() => ({}));
                    setAccessError(errorData.message || "Ошибка доступа. Данный портал не предназначен для сотрудников.");
                    localStorage.setItem('accessToken', token);
                }
            } else {
                console.error("Invalid or expired token, server returned:", response.status);
                clearSessionState();
            }
        } catch (error) {
            console.error("Network error while fetching user info:", error);
            clearSessionState();
        }
    };

    const clearSessionState = () => {
        localStorage.removeItem('accessToken'); 
        setIsLoggedIn(false);
        setCurrentUser(null);
        setAccessError(null);
    };

    const handleLoginSuccess = (token) => {
        if (token && token !== "undefined") {
            checkSession(token);
        }
        setForceAuthOpen(false); 
    };

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
                        }} 
                        style={{ backgroundColor: '#ff4d4f', color: 'white', border: 'none', padding: '10px 20px' }}
                    >
                        Сменить аккаунт (Sign out)
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
            onLogout={clearSessionState}
            forceOpen={forceAuthOpen} 
            onClose={() => setForceAuthOpen(false)} 
        />
    );

    return (
        <div className="app-container">
            {currentView === 'main' && (
                <div className="top-left-panel">
                    <EntryView
                        onEnter={() => setCurrentView('doctors')}
                        icon="👨‍⚕️"
                        label="Doctors"
                    />
                    <EntryView
                        onEnter={() => setCurrentView('services')}
                        icon="📋"
                        label="Services"
                    />
                </div>
            )}

            <div className="top-right-panel">
                <AppointmentModal 
                    isLoggedIn={isLoggedIn}
                    onSaveAppointment={handleSaveAppointment}
                    
                    onRequireAuth={() => {
                        alert("Sign in to make an appointment");
                        setForceAuthOpen(true);
                    }}
                />

                {isLoggedIn && (
                    <button 
                        className="btn-action" 
                        onClick={() => navigate('/profile')} 
                    >
                        👤 Profile
                    </button>
                )}
                <div className="auth-wrapper">
                    {authComponent}
                </div>
            </div>

            <main className="main-content">
                {currentView === 'doctors' && (
                    <PatientDoctorsModule onBack={() => setCurrentView('main')} />
                )}
                
                {currentView === 'services' && (
                    <ServicesModule onBack={() => setCurrentView('main')} />
                )}

                {currentView === 'main' && (
                    <div className="main-dashboard">
                        <h2>Welcome to the Clinic Dashboard</h2>
                    </div>
                )}
            </main>
        </div>
    );
};

// =======================================================
// ФУНКЦИИ-ОБЕРТКИ ДЛЯ МАРШРУТИЗАЦИИ И ПЕРЕДАЧИ СОБЫТИЙ
// =======================================================
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
        console.error("Ошибка при парсинге токена:", e);
        return null;
    }
};

const PatientProfileWrapper = () => {
    const navigate = useNavigate();
    
    const token = localStorage.getItem('accessToken');
    const decodedToken = token ? parseJwt(token) : null;
    const currentUserId = decodedToken?.sub 
        || decodedToken?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] 
        || decodedToken?.nameid;

    return (
        <PatientProfile 
            patientId={currentUserId}
            onBack={() => navigate('/')} 
            onViewResult={(appId) => navigate(`/result/${appId}`)} 
        />
    );
};

const DoctorRouteWrapper = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    return <DoctorProfile doctorId={id} userRole="Patient" onBack={() => navigate(-1)} />;
};

const MedicalResultRouteWrapper = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    return (
        <MedicalResultView 
            appointmentId={id} 
            onBack={() => navigate(-1)} 
        />
    );
};


// =======================================================
// ГЛАВНЫЙ РОУТЕР
// =======================================================
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MainApp />} />
                <Route path="/create-profile" element={<PatientProfileCreation />} />
                
                <Route path="/profile" element={<PatientProfileWrapper />} />
                <Route path="/doctor/:id" element={<DoctorRouteWrapper />} />
                <Route path="/result/:id" element={<MedicalResultRouteWrapper />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;