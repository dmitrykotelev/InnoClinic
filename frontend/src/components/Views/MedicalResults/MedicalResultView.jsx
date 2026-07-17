import React, { useState, useEffect, useMemo } from 'react';
import '../../../styles/App.css'; 

const API_BASE_APPOINTMENTS = 'http://gateway.inno-clinic.com/api-appointments/Appointments';
const API_BASE_RESULTS = 'http://gateway.inno-clinic.com/api-appointments/Results'; 
const API_BASE_PATIENTS = 'http://gateway.inno-clinic.com/api-profiles/Profile/Patient';
const API_BASE_DOCTORS = 'http://gateway.inno-clinic.com/api-profiles/Profile/Doctor';
const API_BASE_SERVICES = 'http://gateway.inno-clinic.com/api-services/Services/GetAll';
const API_BASE_SPECS = 'http://gateway.inno-clinic.com/api-services/Specializations/GetAll'; 

export const MedicalResultView = ({ appointmentId, currentDoctorId, onBack }) => {
    const [mode, setMode] = useState('create'); 
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [prefilledData, setPrefilledData] = useState(null);
    const [existingResultId, setExistingResultId] = useState(null);

    const [form, setForm] = useState({
        complaints: '',
        conclusion: '',
        recommendations: ''
    });
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!appointmentId) {
                setError("Appointment ID is missing.");
                setIsLoading(false);
                return;
            }

            try {
                // БЕЗОПАСНАЯ ИНЖЕКЦИЯ ТОКЕНА
                const token = localStorage.getItem('accessToken');
                const headers = { 
                    'Accept': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                };

                const appRes = await fetch(`${API_BASE_APPOINTMENTS}/${appointmentId}`, { headers });
                if (!appRes.ok) throw new Error("Failed to load appointment details.");
                const appointment = await appRes.json();

                let existingResult = null;
                try {
                    const resultRes = await fetch(`${API_BASE_RESULTS}/GetByAppointmentId/${appointmentId}`, { headers });
                    if (resultRes.ok) {
                        existingResult = await resultRes.json();
                    }
                } catch (resErr) {
                    console.log("Existing result not found, proceeding to create mode.");
                }

                const [patientRes, doctorRes, servicesRes, specsRes] = await Promise.all([
                    fetch(`${API_BASE_PATIENTS}/${appointment.patientId}`, { headers }),
                    fetch(`${API_BASE_DOCTORS}/${appointment.doctorId}`, { headers }),
                    fetch(API_BASE_SERVICES, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...headers },
                        body: JSON.stringify([]) 
                    }),
                    fetch(API_BASE_SPECS, { headers })
                ]);

                const patient = patientRes.ok ? await patientRes.json() : {};
                const doctor = doctorRes.ok ? await doctorRes.json() : {};
                const services = servicesRes.ok ? await servicesRes.json() : [];
                
                let specs = [];
                if (specsRes.ok) {
                    const sData = await specsRes.json();
                    specs = Array.isArray(sData) ? sData : (sData.items || sData.data || []);
                }

                const serviceObj = services.find(s => String(s.id || s.Id) === String(appointment.serviceId));
                const serviceName = serviceObj ? (serviceObj.name || serviceObj.serviceName) : `Service #${appointment.serviceId}`;

                const docSpecId = doctor.specializationId || doctor.SpecializationId;
                const specObj = specs.find(s => String(s.id || s.Id) === String(docSpecId));
                const doctorSpec = specObj 
                    ? (specObj.name || specObj.Name) 
                    : (doctor.specializationName || doctor.SpecializationName || doctor.specialization?.name || 'Unknown Specialization');

                const formatName = (p) => p.firstName ? `${p.lastName || ''} ${p.firstName} ${p.middleName || ''}`.trim() : 'Unknown';

                const sourceDate = existingResult 
                    ? (existingResult.date || existingResult.Date || existingResult.createdAt || existingResult.CreatedAt || appointment.date || appointment.Date)
                    : (appointment.date || appointment.Date || new Date().toISOString());

                const formatCleanDate = (rawDate) => {
                    if (!rawDate) return 'N/A';
                    const cleanDate = String(rawDate).split('T')[0].split(' ')[0];
                    const parts = cleanDate.split('-');
                    if (parts.length === 3) {
                        return `${parts[2]}.${parts[1]}.${parts[0]}`;
                    }
                    return cleanDate;
                };

                const formattedPatientDOB = patient.dateOfBirth ? formatCleanDate(patient.dateOfBirth) : 'N/A';

                setPrefilledData({
                    resultDate: formatCleanDate(sourceDate),
                    patientName: formatName(patient),
                    patientDOB: formattedPatientDOB,
                    doctorName: formatName(doctor),
                    doctorId: appointment.doctorId || appointment.DoctorId,
                    doctorSpec: doctorSpec, 
                    serviceName: serviceName,
                    appointmentId: appointment.id || appointment.Id
                });

                if (existingResult) {
                    setExistingResultId(existingResult.id || existingResult.Id);
                    setForm({
                        complaints: existingResult.complaints || existingResult.Complaints || '',
                        conclusion: existingResult.conclusion || existingResult.Conclusion || '',
                        recommendations: existingResult.recomendations || existingResult.Recomendations || existingResult.recommendations || ''
                    });
                    setMode('view');
                } else {
                    setMode('create');
                }

            } catch (err) {
                console.error("Data loading error:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, [appointmentId]);

    const validateField = (name, value) => {
        if (!value.trim()) {
            if (name === 'complaints') return 'Please, enter the complaints';
            if (name === 'conclusion') return 'Please, enter the conclusion';
            if (name === 'recommendations') return 'Please, enter the recommendations';
        }
        return '';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (touched[name]) {
            setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    };

    const isFormValid = useMemo(() => {
        const requiredFields = ['complaints', 'conclusion', 'recommendations'];
        const hasEmpty = requiredFields.some(field => !form[field].trim());
        const hasErrors = Object.values(errors).some(err => err !== '');
        return !hasEmpty && !hasErrors;
    }, [form, errors]);

    const handleSave = async () => {
        if (!isFormValid || isSaving) return;
        setIsSaving(true);

        try {
            // БЕЗОПАСНАЯ ИНЖЕКЦИЯ ТОКЕНА ДЛЯ СОХРАНЕНИЯ
            const token = localStorage.getItem('accessToken');
            const payload = {
                id: existingResultId || 0,
                complaints: form.complaints,
                conclusion: form.conclusion,
                recomendations: form.recommendations, 
                appointmentId: String(prefilledData.appointmentId) 
            };

            const endpoint = mode === 'edit' ? `${API_BASE_RESULTS}/Update` : `${API_BASE_RESULTS}/Add`;

            const res = await fetch(endpoint, {
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to save medical result");
            
            if (mode === 'edit') {
                setMode('view');
            } else {
                onBack(); 
            }
        } catch (err) {
            console.error("Save error:", err);
            alert("Error saving result: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelClick = () => setShowCancelDialog(true);
    
    const confirmCancel = () => {
        setShowCancelDialog(false);
        if (mode === 'edit') {
            setMode('view');
        } else {
            onBack(); 
        }
    };
    
    const abortCancel = () => {
        setShowCancelDialog(false); 
    };

    if (isLoading) return <div className="page-container"><div style={{padding: '40px', textAlign: 'center'}}>Loading data...</div></div>;
    if (error) return <div className="page-container"><div style={{padding: '40px', color: 'red', textAlign: 'center'}}><h3>{error}</h3><button className="btn btn-secondary mt-3" onClick={onBack}>Go Back</button></div></div>;

    const isOwnerDoctor = String(currentDoctorId) === String(prefilledData.doctorId);

    return (
        <div className="page-container sm">
            
            <div className="modal-header mb-4">
                <h2>
                    {mode === 'view' ? 'Medical Result Details' : mode === 'edit' ? 'Edit Medical Result' : 'Create Medical Result'}
                </h2>
            </div>

            <div className="data-card grid-1-to-2 mb-4" style={{ backgroundColor: 'var(--bg-page)', boxShadow: 'none' }}>
                <div><span className="doctor-info-label">Date of Result:</span> <br/><b style={{ fontSize: '16px' }}>{prefilledData.resultDate}</b></div>
                <div><span className="doctor-info-label">Service:</span> <br/><b style={{ fontSize: '16px' }}>{prefilledData.serviceName}</b></div>
                <div><span className="doctor-info-label">Patient Name:</span> <br/><b style={{ fontSize: '16px' }}>{prefilledData.patientName}</b></div>
                <div><span className="doctor-info-label">Patient DOB:</span> <br/><b style={{ fontSize: '16px' }}>{prefilledData.patientDOB}</b></div>
                <div><span className="doctor-info-label">Doctor Name:</span> <br/><b style={{ fontSize: '16px' }}>{prefilledData.doctorName}</b></div>
                <div><span className="doctor-info-label">Specialization:</span> <br/><b style={{ fontSize: '16px' }}>{prefilledData.doctorSpec}</b></div>
            </div>
            
            {mode === 'create' && !isOwnerDoctor ? (
                <div className="empty-state">
                    <h3 className="mb-3" style={{ color: 'var(--text-main)' }}>No medical results yet</h3>
                    <p className="mb-4">The attending doctor has not added the results for this appointment.</p>
                    <button className="btn btn-secondary" onClick={onBack}>Go Back</button>
                </div>
            ) : 
            
            mode === 'view' ? (
                <div>
                    <div className="mb-3">
                        <label className="doctor-info-label">Complaints</label>
                        <div className="form-control" style={{ backgroundColor: 'var(--bg-page)', minHeight: '80px' }}>{form.complaints}</div>
                    </div>
                    <div className="mb-3">
                        <label className="doctor-info-label">Conclusion</label>
                        <div className="form-control" style={{ backgroundColor: 'var(--bg-page)', minHeight: '80px' }}>{form.conclusion}</div>
                    </div>
                    <div className="mb-4">
                        <label className="doctor-info-label">Recommendations</label>
                        <div className="form-control" style={{ backgroundColor: 'var(--bg-page)', minHeight: '80px' }}>{form.recommendations}</div>
                    </div>

                    <div className="modal-footer mt-4">
                        <button className="btn btn-secondary" onClick={onBack}>Back to Schedule</button>
                        {isOwnerDoctor && (
                            <button className="btn btn-primary" onClick={() => setMode('edit')}>Edit Result</button>
                        )}
                    </div>
                </div>
            ) : (
                <div>
                    <div className="form-group">
                        <label>Complaints *</label>
                        <textarea 
                            name="complaints" 
                            className={`form-control ${errors.complaints ? 'is-invalid' : ''}`}
                            value={form.complaints} 
                            onChange={handleChange} 
                            onBlur={handleBlur} 
                            style={{ minHeight: '100px' }}
                        />
                        {errors.complaints && <span className="error-msg">{errors.complaints}</span>}
                    </div>

                    <div className="form-group">
                        <label>Conclusion *</label>
                        <textarea 
                            name="conclusion" 
                            className={`form-control ${errors.conclusion ? 'is-invalid' : ''}`}
                            value={form.conclusion} 
                            onChange={handleChange} 
                            onBlur={handleBlur} 
                            style={{ minHeight: '100px' }}
                        />
                        {errors.conclusion && <span className="error-msg">{errors.conclusion}</span>}
                    </div>

                    <div className="form-group">
                        <label>Recommendations *</label>
                        <textarea 
                            name="recommendations" 
                            className={`form-control ${errors.recommendations ? 'is-invalid' : ''}`}
                            value={form.recommendations} 
                            onChange={handleChange} 
                            onBlur={handleBlur} 
                            style={{ minHeight: '100px' }}
                        />
                        {errors.recommendations && <span className="error-msg">{errors.recommendations}</span>}
                    </div>

                    <div className="modal-footer mt-4">
                        <button className="btn btn-secondary" disabled={isSaving} onClick={handleCancelClick}>Cancel</button>
                        <button className="btn btn-primary" disabled={!isFormValid || isSaving} onClick={handleSave}>
                            {isSaving ? 'Saving...' : 'Confirm'}
                        </button>
                    </div>
                </div>
            )}

            {showCancelDialog && (
                <div className="modal-overlay top-tier">
                    <div className="modal-card sm">
                        <h3 className="mb-3">Do you really want to cancel?</h3>
                        <p className="mb-4" style={{ color: 'var(--text-muted)' }}>Entered data will not be saved.</p>
                        <div className="flex-row" style={{ justifyContent: 'center' }}>
                            <button className="btn btn-primary" onClick={confirmCancel}>Yes</button>
                            <button className="btn btn-secondary" onClick={abortCancel}>No</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};