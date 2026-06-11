import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Authorization from "./components/Authorization/Authorization.jsx";
import { DoctorsModule } from "./components/Views/Doctors/DoctorsModel.jsx";
import { ServicesModule } from "./components/Views/Services/ServicesModule.jsx";
import { EntryView } from "./components/Views/EntryView.jsx";
import { PatientProfileCreation } from "./components/Profile/Patient/PatientProfileCreations.jsx";
import { PatientProfile } from './components/Profile/Patient/PatientProfile.jsx';
import { DoctorProfile } from './components/Profile/Doctor/DoctorProfile.jsx';
import { AppointmentModal } from './components/Appoitments/AppoitmentModal.jsx';
import { createAppointment } from './components/Appoitments/AppoitmentApi.js';
import './styles/Doctors.css';
import './styles/App.css';

const API_BASE_URL = 'http://identity.inno-clinic.com';

const MainApp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [currentView, setCurrentView] = useState(location.state?.targetView || 'main');
    const [forceAuthOpen, setForceAuthOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
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

            try {
                await createAppointment(appointmentData, token, userId);
                console.log("Appointment successfully saved to DB!");
            } catch (error) {
                console.error(error.message);
                alert("Error creating appointment. Please try again.");
            }
        };
    const checkSession = async (newToken = null) => {
        const token = newToken || localStorage.getItem('accessToken');
        console.log("App checking session. Token found:", !!token);

        if (!token || token === "undefined" || token === "null") {
            return clearSessionState();
        }

        try {
            const response = await fetch(`${API_BASE_URL}/connect/userinfo`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const userInfo = await response.json();
                console.log("User info received globally:", userInfo);

                setCurrentUser(userInfo);
                setIsLoggedIn(true);
                localStorage.setItem('accessToken', token); 
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
    };

    const handleLoginSuccess = (token) => {
        if (token && token !== "undefined") {
            checkSession(token);
        }
        setForceAuthOpen(false); 
    };

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
                    <DoctorsModule onBack={() => setCurrentView('main')} />
                )}
                
                {currentView === 'services' && (
                    <ServicesModule onBack={() => setCurrentView('main')} />
                )}

                {currentView === 'main' && (
                    <div className="main-dashboard">
                        <h2>Welcome to the Clinic Dashboard</h2>
                        {isLoggedIn && <p>Welcome, {currentUser?.given_name || currentUser?.UserName || "User"}!</p>}
                    </div>
                )}
            </main>
        </div>
    );
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MainApp />} />
                <Route path="/create-profile" element={<PatientProfileCreation />} />
                <Route path="/profile" element={<PatientProfile />} />
                <Route path="/doctor/:id" element={<DoctorProfile />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;