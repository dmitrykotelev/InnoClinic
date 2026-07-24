import React, { useState, useEffect, useMemo, useCallback } from 'react';
import '../../../styles/Global.css'; 
import { createAppointment } from './AppoitmentApi';
import { AppointmentModal } from './AppoitmentModal';

const API_BASE_APPOINTMENTS = 'https://gateway.inno-clinic.com/api-appointments/Appointments';
const API_BASE_DOCTORS = 'https://gateway.inno-clinic.com/api-profiles/Profile/Doctor';
const API_BASE_PATIENTS = 'https://gateway.inno-clinic.com/api-profiles/Profile/Patient';
const API_BASE_OFFICES = 'https://gateway.inno-clinic.com/api-offices/Offices';
const API_BASE_SERVICES = 'https://gateway.inno-clinic.com/api-services/Services';
const API_BASE_IDENTITY= 'https://gateway.inno-clinic.com/api-identity';

export const AppointmentsModule = ({ onBack }) => {
    const [appointments, setAppointments] = useState([]);
    const [doctorsMap, setDoctorsMap] = useState({});
    const [patientsMap, setPatientsMap] = useState({});
    const [officesMap, setOfficesMap] = useState({});
    const [servicesMap, setServicesMap] = useState({});
    
    const [rescheduleData, setRescheduleData] = useState(null); 
    
    const [officesArray, setOfficesArray] = useState([]);
    const [doctorsArray, setDoctorsArray] = useState([]);
    const [servicesArray, setServicesArray] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false); 

    const [filters, setFilters] = useState({
        date: '',
        doctorSearch: '',
        serviceSearch: '',
        status: 'All',
        officeId: ''
    });

    const getDocFullName = (doc) => `${doc.lastName || ''} ${doc.firstName || ''} ${doc.middleName || ''}`.trim();
    const getSrvName = (srv) => srv.name ?? srv.Name;

    const fetchDictionaries = useCallback(async () => {
        try {
            // ДОБАВЛЕН ТОКЕН (Гейтвей пропустит GET и без него, но для единообразия отправляем)
            const token = localStorage.getItem('accessToken');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const [docRes, patRes, offRes, srvRes] = await Promise.all([
                fetch(`${API_BASE_DOCTORS}/GetAll`, { headers }).catch(() => ({ ok: false })),
                fetch(`${API_BASE_PATIENTS}/GetAll`, { headers }).catch(() => ({ ok: false })),
                fetch(`${API_BASE_OFFICES}/GetAll`, { headers }).catch(() => ({ ok: false })),
                fetch(`${API_BASE_SERVICES}/GetAll`, { headers }).catch(() => ({ ok: false }))
            ]);

            if (docRes.ok) {
                const docs = await docRes.json();
                setDoctorsArray(docs);
                const map = {};
                docs.forEach(d => map[d.id ?? d.Id] = d);
                setDoctorsMap(map);
            }
            if (patRes.ok) {
                const pats = await patRes.json();
                const map = {};
                pats.forEach(p => map[p.id ?? p.Id] = p);
                setPatientsMap(map);
            }
            if (offRes.ok) {
                const offs = await offRes.json();
                setOfficesArray(offs);
                const map = {};
                offs.forEach(o => map[o.id ?? o.Id] = o.adress ?? o.address ?? o.Adress);
                setOfficesMap(map);
            }
            if (srvRes.ok) {
                const srvs = await srvRes.json();
                setServicesArray(srvs);
                const map = {};
                srvs.forEach(s => map[s.id ?? s.Id] = s.name ?? s.Name);
                setServicesMap(map);
            }
        } catch (err) {
            console.error("Failed to load dictionaries", err);
        }
    }, []);

    useEffect(() => {
        fetchDictionaries();
    }, [fetchDictionaries]);

    const handleApproveAppointment = async (appointmentId) => {
        try {
            // ДОБАВЛЕН ТОКЕН (Обязательно, так как это POST в Appointments)
            const token = localStorage.getItem('accessToken');
            const url = `${API_BASE_APPOINTMENTS}/Approve?id=${appointmentId}`;
            const res = await fetch(url, { 
                method: 'POST',
                headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
            });
            if (!res.ok) throw new Error(await res.text());

            setAppointments(prev => prev.map(app => 
                (app.id ?? app.Id) === appointmentId 
                    ? { ...app, isApproved: true } 
                    : app
            ));
        } catch (err) {
            alert("Error approving appointment: " + err.message);
        }
    };

    const handleCancelAppointment = async (appointmentId) => {
        const isConfirmed = window.confirm("Are you sure you want to cancel this appointment?");
        if (!isConfirmed) return;

        try {
            // ДОБАВЛЕН ТОКЕН (Обязательно, DELETE в Appointments)
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${API_BASE_APPOINTMENTS}/${appointmentId}`, { 
                method: 'DELETE',
                headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
            });
            if (!res.ok) throw new Error(await res.text());

            setAppointments(prev => prev.filter(app => (app.id ?? app.Id) !== appointmentId));
        } catch (err) {
            alert("Error cancelling appointment: " + err.message);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        if (name === 'date') setIsGenerated(false); 
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const payload = [];

            if (filters.date && filters.date.trim() !== '') {
                payload.push({ fieldName: 'date', operation: 'equals', value: filters.date });
            }
            if (filters.doctorSearch.trim()) {
                const matchedDoc = doctorsArray.find(doc => getDocFullName(doc) === filters.doctorSearch.trim());
                if (matchedDoc) payload.push({ fieldName: 'doctor', operation: 'equals', value: String(matchedDoc.id ?? matchedDoc.Id) });
            }
            if (filters.serviceSearch.trim()) {
                const matchedSrv = servicesArray.find(srv => getSrvName(srv) === filters.serviceSearch.trim());
                if (matchedSrv) payload.push({ fieldName: 'service', operation: 'equals', value: String(matchedSrv.id ?? matchedSrv.Id) });
            }
            if (filters.status !== 'All') {
                payload.push({ fieldName: 'status', operation: 'equals', value: filters.status === 'Approved' ? 'true' : 'false' });
            }

            // ДОБАВЛЕН ТОКЕН (POST в Appointments)
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${API_BASE_APPOINTMENTS}/GetAll`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
            }); 
            
            if (!res.ok) throw new Error(`Bad Request: ${await res.text()}`);
            const appointmentsData = await res.json();

            const uniquePatientIds = [...new Set(appointmentsData.map(app => app.patientId).filter(Boolean))];
            const enrichedPatientsMap = { ...patientsMap };

            await Promise.all(uniquePatientIds.map(async (patId) => {
                try {
                    // ДОБАВЛЕН ТОКЕН
                    const patProfileRes = await fetch(`${API_BASE_PATIENTS}/${patId}`, {
                        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
                    });
                    
                    if (patProfileRes.ok) {
                        const patProfile = await patProfileRes.json();
                        const accountId = patProfile.accountId ?? patProfile.AccountId ?? patProfile.userId ?? patProfile.UserId;
                        let phoneNumber = 'N/A';

                        if (accountId) {
                            const phoneRes = await fetch(`${API_BASE_IDENTITY}/Profile/GetPhoneNumber?userId=${encodeURIComponent(accountId)}`, {
                                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                            });
                            if (phoneRes.ok) {
                                const rawPhone = await phoneRes.text();
                                phoneNumber = rawPhone.replace(/^"|"$/g, '') || 'N/A';
                            }
                        }
                        enrichedPatientsMap[patId] = { ...patProfile, phoneNumber };
                    }
                } catch (err) {
                    console.warn(`Не удалось загрузить доп. данные для пациента с ID ${patId}:`, err);
                }
            }));
            
            setPatientsMap(enrichedPatientsMap);
            setAppointments(appointmentsData);
            setIsGenerated(true);

        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const processedAppointments = useMemo(() => {
        if (!isGenerated) return [];
        let result = appointments.filter(app => {
            if (filters.officeId) {
                const offId = app.officeId || (doctorsMap[app.doctorId]?.officeId);
                if (offId !== filters.officeId) return false;
            }
            return true;
        });

        result.sort((a, b) => {
            const dateTimeA = new Date(`${a.date || a.Date}T${a.time || a.Time || '00:00:00'}`).getTime();
            const dateTimeB = new Date(`${b.date || b.Date}T${b.time || b.Time || '00:00:00'}`).getTime();
            if (dateTimeA !== dateTimeB) return dateTimeA - dateTimeB;

            const docA = doctorsMap[a.doctorId] || {};
            const docB = doctorsMap[b.doctorId] || {};
            const surnameComp = (docA.lastName || '').localeCompare(docB.lastName || '');
            if (surnameComp !== 0) return surnameComp;

            const nameComp = (docA.firstName || '').localeCompare(docB.firstName || '');
            if (nameComp !== 0) return nameComp;

            const srvA = servicesMap[a.serviceId] || '';
            const srvB = servicesMap[b.serviceId] || '';
            return srvA.localeCompare(srvB);
        });
        return result;
    }, [appointments, filters.officeId, isGenerated, doctorsMap, servicesMap]);

    const formatTimeWindow = (timeString, durationMinutes = 20) => {
        if (!timeString || typeof timeString !== 'string') return 'N/A';
        if (timeString.includes('T')) timeString = timeString.split('T')[1];

        const parts = timeString.split(':');
        const hoursStr = parts[0] || '00';
        const minutesStr = parts[1] || '00';

        const hours = parseInt(hoursStr, 10) || 0;
        const minutes = parseInt(minutesStr, 10) || 0;

        const totalMinutes = hours * 60 + minutes + durationMinutes;
        const endHours = Math.floor(totalMinutes / 60) % 24;
        const endMins = totalMinutes % 60;

        const startFormatted = `${hoursStr.padStart(2, '0')}:${minutesStr.padStart(2, '0')}`;
        const endFormatted = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

        return `${startFormatted} - ${endFormatted}`;
    };

    const openRescheduleModal = (app) => {
        const docObj = doctorsArray.find(d => (d.id ?? d.Id) === app.doctorId);
        const patObj = patientsMap[app.patientId];
        const srvObj = servicesArray.find(s => (s.id ?? s.Id) === app.serviceId);
        const offObj = officesArray.find(o => String(o.id ?? o.Id) === String(app.officeId || docObj?.officeId));

        const rawDate = app.date ?? app.Date ?? (app.dateTime ? app.dateTime.split('T')[0] : '');
        const rawTime = app.time ?? app.Time ?? (app.dateTime ? app.dateTime.split('T')[1] : '');

        setRescheduleData({
            id: app.id ?? app.Id,
            patient: { ...patObj, name: `${patObj?.lastName || ''} ${patObj?.firstName || ''}`.trim() },
            doctor: { ...docObj, name: getDocFullName(docObj) },
            service: { ...srvObj, name: getSrvName(srvObj) },
            office: offObj,
            specialization: { id: docObj?.specializationId, name: 'Assigned Spec' }, 
            date: rawDate,
            time: rawTime
        });
    };

    const handleSaveAppointmentModal = async (formData) => {
        if (formData.id) {
            try {
                // ДОБАВЛЕН ТОКЕН (POST в Appointments)
                const token = localStorage.getItem('accessToken');
                const newDateTime = `${formData.date}T${formData.time}:00`;
                const url = `${API_BASE_APPOINTMENTS}/Reshedulle?id=${formData.id}&date=${newDateTime}&doctorId=${formData.doctor.id}`;
                
                const res = await fetch(url, { 
                    method: 'POST',
                    headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
                });
                if (!res.ok) throw new Error(`Failed to reschedule: ${await res.text()}`);

                setRescheduleData(null); 
                handleGenerate(); 

            } catch (err) {
                alert("Reschedule Error: " + err.message);
            }
        } else {
            await createAppointment(formData);
            handleGenerate(); 
        }
    };

    // Оставшаяся часть компонента (рендеринг UI) не меняется...
    return (
        <div className="page-container" style={{ maxWidth: '1200px' }}>
            <div className="modal-header flex-between mb-4">
                <div className="flex-row">
                    <button className="btn btn-text" onClick={onBack}>&larr; Back</button>
                    <h2 style={{ margin: 0 }}>Appointments</h2>
                </div>
                
                <AppointmentModal 
                    isLoggedIn={true} 
                    externalOpen={!!rescheduleData}
                    rescheduleData={rescheduleData}
                    onExternalClose={() => setRescheduleData(null)}
                    onSaveAppointment={handleSaveAppointmentModal} 
                />
            </div>

            <div className="data-card mb-4">
                <div className="grid-4-cols mb-3">
                    
                    <div className="form-group mb-0">
                        <label>Date</label>
                        <input type="date" name="date" className="form-control" value={filters.date} onChange={handleFilterChange} />
                    </div>

                    <div className="form-group mb-0">
                        <label>Doctor</label>
                        <input 
                            type="text" 
                            name="doctorSearch" 
                            className="form-control" 
                            list="doctors-list" 
                            placeholder="Type or select doctor..."
                            value={filters.doctorSearch} 
                            onChange={handleFilterChange} 
                        />
                        <datalist id="doctors-list">
                            {doctorsArray.map(doc => (
                                <option key={doc.id ?? doc.Id} value={getDocFullName(doc)} />
                            ))}
                        </datalist>
                    </div>

                    <div className="form-group mb-0">
                        <label>Service</label>
                        <input 
                            type="text" 
                            name="serviceSearch" 
                            className="form-control" 
                            list="services-list" 
                            placeholder="Type or select service..."
                            value={filters.serviceSearch} 
                            onChange={handleFilterChange} 
                        />
                        <datalist id="services-list">
                            {servicesArray.map(srv => (
                                <option key={srv.id ?? srv.Id} value={getSrvName(srv)} />
                            ))}
                        </datalist>
                    </div>

                    <div className="form-group mb-0">
                        <label>Status</label>
                        <select name="status" className="form-control" value={filters.status} onChange={handleFilterChange}>
                            <option value="All">All</option>
                            <option value="Approved">Approved</option>
                            <option value="Not Approved">Not Approved</option>
                        </select>
                    </div>

                    <div className="form-group mb-0">
                        <label>Office</label>
                        <select name="officeId" className="form-control" value={filters.officeId} onChange={handleFilterChange}>
                            <option value="">All Offices</option>
                            {officesArray.map(off => (
                                <option key={off.id ?? off.Id} value={off.id ?? off.Id}>
                                    {off.adress ?? off.address ?? off.Adress}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex-end">
                    <button className="btn btn-primary" onClick={handleGenerate} disabled={isLoading}>
                        {isLoading ? 'Generating...' : 'Generate'}
                    </button>
                </div>
            </div>

            {isGenerated && (
            <div className="table-responsive">
                {processedAppointments.length === 0 ? (
                    <div className="empty-state">No appointments found for the selected criteria.</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr style={{textAlign: 'center'}}>
                                <th>Date & Time</th>
                                <th>Doctor Full Name</th>
                                <th>Patient Full Name</th>
                                <th>Patient Phone</th>
                                <th>Service</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedAppointments.map(app => {
                                const doc = doctorsMap[app.doctorId] || {};
                                const pat = patientsMap[app.patientId] || {};
                                const srv = servicesMap[app.serviceId] || 'Unknown Service';

                                const docFullName = `${doc.firstName || ''} ${doc.lastName || ''} ${doc.middleName || ''}`.trim();
                                const patFullName = `${pat.firstName || ''} ${pat.lastName || ''} ${pat.middleName || ''}`.trim();
                                const patPhone = pat.phoneNumber || 'N/A';

                                const rawDate = app.date ?? app.Date ?? (app.dateTime ? app.dateTime.split('T')[0] : 'N/A');
                                const rawTime = app.time ?? app.Time ?? (app.dateTime ? app.dateTime.split('T')[1] : null);

                                return (
                                    <tr 
                                        key={app.id ?? app.Id} 
                                        className={app.isApproved ? 'row-approved' : 'row-unapproved'}
                                    >
                                        <td>
                                            <div style={{ fontWeight: 'bold' }}>{rawDate}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatTimeWindow(rawTime)}</div>
                                        </td>
                                        <td>{docFullName || 'N/A'}</td>
                                        <td>{patFullName || 'N/A'}</td>
                                        <td>{patPhone || 'N/A'}</td>
                                        <td>{srv}</td>
                                        <td style={{textAlign: 'center'}}>
                                            <span className={`badge ${app.isApproved ? 'badge-success' : 'badge-warning'}`}>
                                                {app.isApproved ? 'Approved' : 'Not Approved'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex-end">
                                                {!app.isApproved && (
                                                    <>
                                                        <button className="btn btn-primary btn-sm" onClick={() => handleApproveAppointment(app.id ?? app.Id)}>✓ Approve</button>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => openRescheduleModal(app)}>🕒 Reschedule</button>
                                                    </>
                                                )}
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleCancelAppointment(app.id ?? app.Id)}>✖ Cancel</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        )}
    </div>
    );
};