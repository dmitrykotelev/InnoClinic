import React, { useState, useEffect, useMemo } from 'react';
import '../../../styles/Global.css'; 

const API_BASE_APPOINTMENTS = 'https://gateway.inno-clinic.com/api-appointments/Appointments';
const API_BASE_PATIENTS = 'https://gateway.inno-clinic.com/api-profiles/Profile/Patient';
const API_BASE_SERVICES = 'https://gateway.inno-clinic.com/api-services/Services/GetAll'; 

export const DoctorScheduleView = ({ profileData, onBack, onNavigateToPatient, onNavigateToResult }) => {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    
    const [appointments, setAppointments] = useState([]);
    const [patientsMap, setPatientsMap] = useState({});
    const [servicesMap, setServicesMap] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
console.log("=== ДАННЫЕ ПРОФИЛЯ ОТ БЭКЕНДА ===", profileData);
    useEffect(() => {
        // ДОБАВЛЕН ТОКЕН (POST-запрос к Services)
        const token = localStorage.getItem('accessToken');
        fetch(API_BASE_SERVICES, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify([]) 
        })
        .then(res => res.json())
        .then(data => {
            const map = {};
            data.forEach(s => { map[s.id || s.Id] = s.name || s.serviceName; });
            setServicesMap(map);
        })
        .catch(err => console.error("Ошибка загрузки услуг:", err));
    }, []);

    useEffect(() => {
        const fetchSchedule = async () => {
            const doctorId = profileData?.profile?.id;
            
            if (!doctorId) {
                setError("Не удалось определить ID доктора из профиля.");
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                // ДОБАВЛЕН ТОКЕН
                const token = localStorage.getItem('accessToken');
                const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

                const payload = [
                    { fieldName: 'doctor', operation: 'equals', value: String(doctorId) },
                    { fieldName: 'date', operation: 'equals', value: selectedDate }
                ];

                // ДОБАВЛЕН ТОКЕН (POST-запрос к Appointments)
                const res = await fetch(`${API_BASE_APPOINTMENTS}/GetAll`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        ...authHeader
                    },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) throw new Error("Не удалось загрузить расписание");
                const data = await res.json();

                const uniquePatientIds = [...new Set(data.map(app => app.patientId).filter(Boolean))];
                const newPatientsMap = { ...patientsMap };

                await Promise.all(uniquePatientIds.map(async (patId) => {
                    if (newPatientsMap[patId]) return; 
                    try {
                        // ДОБАВЛЕН ТОКЕН (GET-запрос к Patients)
                        const patRes = await fetch(`${API_BASE_PATIENTS}/${patId}`, {
                            headers: { ...authHeader }
                        });
                        if (patRes.ok) {
                            newPatientsMap[patId] = await patRes.json();
                        }
                    } catch (e) { console.warn("Ошибка загрузки пациента", patId); }
                }));

                setPatientsMap(newPatientsMap);
                setAppointments(data);

            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSchedule();
    }, [selectedDate, profileData]); 

    const sortedAppointments = useMemo(() => {
        return [...appointments].sort((a, b) => {
            const timeA = a.time || a.Time || '00:00';
            const timeB = b.time || b.Time || '00:00';
            return timeA.localeCompare(timeB);
        });
    }, [appointments]);

    const formatTimeWindow = (startTime) => {
        if (!startTime) return 'N/A';
        const cleanStart = startTime.substring(0, 5); 
        const [hours, minutes] = cleanStart.split(':').map(Number);
        
        const totalMinutes = hours * 60 + minutes + 20; 
        const endHours = Math.floor(totalMinutes / 60);
        const endMins = totalMinutes % 60;
        
        const cleanEnd = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
        return `${cleanStart} - ${cleanEnd}`;
    };

    return (
        <div className="page-container">
            <div className="flex-between mb-4">
                <div className="flex-row">
                    <button className="btn btn-text" onClick={onBack}>&larr; Back to Dashboard</button>
                    <h2 style={{ margin: 0 }}>My Schedule</h2>
                </div>
            </div>

            <div className="data-card mb-4" style={{ display: 'inline-block' }}>
                <div className="form-group" style={{ margin: 0 }}>
                    <label>Select Date</label>
                    <input 
                        type="date" 
                        className="form-control" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)} 
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="empty-state">Loading schedule...</div>
            ) : error ? (
                <div className="empty-state"><span className="error-msg">{error}</span></div>
            ) : sortedAppointments.length === 0 ? (
                <div className="empty-state">No appointments scheduled for this date.</div>
            ) : (
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Patient Name</th>
                                <th>Service</th>
                                <th style={{textAlign: 'center'}}>Status</th>
                                <th style={{textAlign: 'right'}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAppointments.map(app => {
                                const pat = patientsMap[app.patientId] || {};
                                const patientFullName = `${pat.lastName || ''} ${pat.firstName || ''} ${pat.middleName || ''}`.trim() || 'Unknown Patient';
                                const serviceName = servicesMap[app.serviceId] || 'Unknown Service';
                                const isApproved = app.isApproved || app.IsApproved;

                                return (
                                    <tr key={app.id || app.Id} className={isApproved ? 'row-approved' : 'row-unapproved'}>
                                        <td style={{ fontWeight: 'bold' }}>{formatTimeWindow(app.time || app.Time)}</td>
                                        <td>{patientFullName}</td>
                                        <td>{serviceName}</td>
                                        <td style={{textAlign: 'center'}}>
                                            <span className={`badge ${isApproved ? 'badge-success' : 'badge-warning'}`}>
                                                {isApproved ? 'Approved' : 'Not Approved'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex-end">
                                                <button 
                                                    className="btn btn-secondary btn-sm" 
                                                    onClick={() => onNavigateToPatient(app.patientId)}
                                                >
                                                    👤 View Patient
                                                </button>
                                                <button 
                                                    className="btn btn-primary btn-sm" 
                                                    onClick={() => onNavigateToResult(app.id || app.Id)}
                                                >
                                                    📄 Medical Result
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};