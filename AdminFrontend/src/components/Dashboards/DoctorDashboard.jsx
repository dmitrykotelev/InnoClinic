import React, { useState } from 'react';
import '../../styles/Global.css'; 
import { DoctorScheduleView } from '../Views/DoctorShedule/DoctorSheduleView';

export const DoctorDashboard = ({ onNavigate, profileData }) => {
    const [showSchedule, setShowSchedule] = useState(false);

    if (showSchedule) {
        return <DoctorScheduleView 
                profileData={profileData} 
                onBack={() => setShowSchedule(false)} 
                onNavigateToPatient={(id) => onNavigate('patientProfile', { patientId: id })}
                onNavigateToResult={(appId) => onNavigate('medicalResult', { appointmentId: appId })}
            />;
    }

    return (
        <div className="page-container sm" style={{ textAlign: 'center', marginTop: '40px' }}>
            
            <h2 className="mb-3">Doctor Dashboard 🩺</h2>
            <p className="mb-4" style={{ color: 'var(--text-muted)' }}>Welcome back! Please select an action below.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px', margin: '0 auto' }}>
                
                <button 
                    className="btn btn-primary" 
                    style={{ padding: '16px', fontSize: '18px' }}
                    onClick={() => setShowSchedule(true)}
                >
                    📅 My Schedule
                </button>
                
                <button 
                    className="btn btn-secondary" 
                    style={{ padding: '16px', fontSize: '18px' }}
                    onClick={() => onNavigate && onNavigate('profile')}
                >
                    👨‍⚕️ My Profile
                </button>

            </div>
        </div>
    );
};