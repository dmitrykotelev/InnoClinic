import { AppointmentModal } from '../Views/Appointments/AppoitmentModal.jsx';

export const ReceptionistDashboard = ({ setCurrentView, isLoggedIn, handleSaveAppointment, setForceAuthOpen }) => {
    return (
        <div>
            <h2>Панель Администратора 📅</h2>
            <p style={{ marginBottom: '20px' }}>Быстрый доступ к управлению клиникой:</p>
            
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '30px' }}>
                <button 
                    className="btn-action" 
                    onClick={() => setCurrentView('doctors')}
                    style={{ padding: '15px', fontSize: '16px', backgroundColor: '#007bff' }}
                >
                    👨‍⚕️ Doctors Database
                </button>

                <button 
                    className="btn-action" 
                    onClick={() => setCurrentView('specializations')}
                    style={{ padding: '15px', fontSize: '16px', backgroundColor: '#39ad03' }}
                >
                    📋 Specializations Database
                </button>

                <button 
                    className="btn-action" 
                    onClick={() => setCurrentView('offices')}
                    style={{ padding: '15px', fontSize: '16px', backgroundColor: '#6f42c1' }}
                >
                    🏢 Offices Database
                </button>

                <button 
                    className="btn-action" 
                    onClick={() => setCurrentView('receptionists')}
                    style={{ padding: '15px', fontSize: '16px', backgroundColor: '#e83e8c' }}
                >
                    👩‍💼 Receptions Database
                </button>

                <button 
                    className="btn-action" 
                    onClick={() => setCurrentView('appointments')}
                    style={{ padding: '15px', fontSize: '16px', backgroundColor: '#fd7e14' }}
                >
                    📅 Appointments Database
                </button>

                <button 
                    className="btn-action" 
                    onClick={() => setCurrentView('patients')}
                    style={{ padding: '15px', fontSize: '16px', backgroundColor: '#20c997' }}
                >
                    🤒 Patients Database
                </button>
            </div>
        </div>
    );
};