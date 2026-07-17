import React, { useState, useEffect, useMemo, useRef } from 'react';
import '../../../styles/Global.css';

const PATIENTS_API = 'http://gateway.inno-clinic.com/api-profiles/Profile/Patient/GetAll';
const DOCTORS_API = 'http://gateway.inno-clinic.com/api-profiles/Profile/Doctor/GetAll'; 
const SPECS_API = 'http://gateway.inno-clinic.com/api-services/Specializations/GetAllFiltered';
const SPECS_API_NOFILTERS = 'http://gateway.inno-clinic.com/api-services/Specializations/GetAll';
const SERVICES_API = 'http://gateway.inno-clinic.com/api-services/Services/GetAll';

const OFFICES_API = 'http://gateway.inno-clinic.com/api-offices/Offices/GetAll';
const CATEGORIES_API = 'http://gateway.inno-clinic.com/api-services/ServiceCategories/GetAll'; 
const TIMESTAMPS_API = 'http://gateway.inno-clinic.com/api-appointments/Appointments/GetTimeStamps';

const DEFAULT_OFFICE = [{
    id: 'default-office-1',
    name: 'Main Clinic Office (Default)',
    isActive: true
}];

// ПЕРЕНЕСЛИ COMBOBOX НАВЕРХ!
const Combobox = ({ label, value, options, error, onChange, onSelect, onBlur, onFocus, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className={`form-group ${disabled ? 'disabled-combo' : ''}`}>
            <label>{label}</label>
            <input 
                type="text"
                className={`form-control ${error ? 'is-invalid' : ''}`}
                value={value}
                disabled={disabled}
                onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
                onFocus={() => { if (!disabled) { setIsOpen(true); if (onFocus) onFocus(); } }}
                onBlur={() => { setTimeout(() => { setIsOpen(false); onBlur(); }, 150); }}
                placeholder={`Start typing ${label.toLowerCase()}...`}
            />
            {isOpen && options.length > 0 && !disabled && (
                <ul className="combo-dropdown">
                    {options.map(opt => (
                        <li key={opt.id || Math.random()} onClick={() => onSelect(opt)}>{opt.name}</li>
                    ))}
                </ul>
            )}
            {error && <span className="error-msg">{error}</span>}
        </div>
    );
};

export const AppointmentModal = ({ 
    isLoggedIn, 
    onRequireAuth, 
    onSaveAppointment, 
    rescheduleData = null, 
    externalOpen = false, 
    onExternalClose = null 
}) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const isModalOpen = externalOpen || internalOpen;
    const isRescheduleMode = !!rescheduleData; 

    const [showExitDialog, setShowExitDialog] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [specializations, setSpecializations] = useState([]);
    const [services, setServices] = useState([]);
    
    const [offices, setOffices] = useState([]);
    const [categories, setCategories] = useState([]);

    const [form, setForm] = useState({
        patient: null, 
        specialization: null,
        doctor: null,
        service: null,
        office: null,
        date: '',
        time: ''
    });
    
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [inputs, setInputs] = useState({ patient: '', spec: '', doctor: '', service: '' });
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});

    const searchTimers = useRef({ patient: null, spec: null, doctor: null, service: null });

    let SlotSize = 10;

    const closeModal = () => {
        if (externalOpen && onExternalClose) onExternalClose();
        else setInternalOpen(false);
    };

    const fetchSpecificData = (targetField, currentInputs, currentForm) => {
        const specId = currentForm.specialization?.id || currentForm.specialization?.Id || null;
        const patientId = currentForm.patient?.id || currentForm.patient?.Id || null; 

        const payload = [
            { fieldName: 'specialization', value: currentInputs.spec || "", operation: 'contains' },
            { fieldName: 'doctor', value: currentInputs.doctor || "", operation: 'contains' },
            { fieldName: 'service', value: currentInputs.service || "", operation: 'contains' }
        ];

        if (patientId) {
            payload.push({ fieldName: 'patientId', value: String(patientId), operation: 'equals' });
        } else {
            payload.push({ fieldName: 'patient', value: currentInputs.patient || "", operation: 'contains' });
        }

        if (specId) {
            payload.push({ fieldName: 'specializationId', value: String(specId), operation: 'equals' });
        }

        // ДОБАВЛЕН ТОКЕН (Так как все эти API используют POST-метод)
        const token = localStorage.getItem('accessToken');
        const requestOptions = {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(payload)
        };

        if (targetField === 'patient' || targetField === 'all') {
            fetch(PATIENTS_API, requestOptions)
                .then(res => { if (!res.ok) throw new Error(); return res.json(); })
                .then(data => {
                    if (Array.isArray(data)) {
                        setPatients(data.map(p => ({
                            ...p,
                            name: `${p.lastName || ''} ${p.firstName || ''} ${p.middleName || ''}`.trim()
                        })));
                    }
                }).catch(() => {});
        }

        if (targetField === 'spec' || targetField === 'all') {
            fetch(SPECS_API, requestOptions)
                .then(res => { if (!res.ok) throw new Error(); return res.json(); })
                .then(data => {
                    if (Array.isArray(data)) setSpecializations(data.filter(spec => spec.isActive === true || spec.isActiove === true));
                }).catch(() => {});
        }

        if (targetField === 'doctor' || targetField === 'all') {
            fetch(DOCTORS_API, requestOptions)
                .then(res => { if (!res.ok) throw new Error(); return res.json(); })
                .then(data => {
                    if (Array.isArray(data)) setDoctors(data.filter(doc => doc.status === true || doc.status === 'At work'));
                }).catch(() => {});
        }

        if (targetField === 'service' || targetField === 'all') {
            fetch(SERVICES_API, requestOptions)
                .then(res => { if (!res.ok) throw new Error(); return res.json(); })
                .then(data => {
                    if (Array.isArray(data)) setServices(data.filter(serv => serv.isActive === true || serv.status === true));
                }).catch(() => {});
        }
    };

    useEffect(() => {
        if (isModalOpen) {
            setIsLoadingData(true);
            
            if (isRescheduleMode && rescheduleData) {
                const cleanTime = rescheduleData.time ? rescheduleData.time.substring(0, 5) : '';
                const cleanDate = rescheduleData.date ? rescheduleData.date.split('T')[0] : '';

                setForm({
                    patient: rescheduleData.patient || null,
                    specialization: rescheduleData.specialization || null,
                    doctor: rescheduleData.doctor || null,
                    service: rescheduleData.service || null,
                    office: rescheduleData.office || null,
                    date: cleanDate,
                    time: cleanTime
                });

                setInputs({
                    patient: rescheduleData.patient?.name || '',
                    spec: rescheduleData.specialization?.name || '',
                    doctor: rescheduleData.doctor?.name || '',
                    service: rescheduleData.service?.name || ''
                });
                
                fetchSpecificData('all', {
                    patient: rescheduleData.patient?.name || '',
                    spec: rescheduleData.specialization?.name || '',
                    doctor: rescheduleData.doctor?.name || '',
                    service: rescheduleData.service?.name || ''
                }, {
                    patient: rescheduleData.patient,
                    specialization: rescheduleData.specialization
                });
            } else {
                fetchSpecificData('all', inputs, form);
            }

            fetch(OFFICES_API)
                .then(res => res.json())
                .then(data => {
                    const activeOffices = data.filter(off => off.isActive === true || off.status === true);
                    setOffices(activeOffices.length > 0 ? activeOffices : DEFAULT_OFFICE);
                })
                .catch(() => setOffices(DEFAULT_OFFICE));

            fetch(CATEGORIES_API)
                .then(res => { if (!res.ok) throw new Error(); return res.json(); })
                .then(data => setCategories(data))
                .catch(() => {});

            setIsLoadingData(false);
        } else {
            setForm({ patient: null, specialization: null, doctor: null, service: null, office: null, date: '', time: '' });
            setInputs({ patient: '', spec: '', doctor: '', service: '' });
            setTouched({});
            setErrors({});
            setAvailableTimeSlots([]);
        }
    }, [isModalOpen, rescheduleData, isRescheduleMode]);

    const handleComboChange = (field, textValue) => {
        let nextInputs = { ...inputs, [field]: textValue };
        const formField = field === 'spec' ? 'specialization' : field;
        let nextForm = { ...form };

        if (form[formField] !== null) {
            nextForm[formField] = null; 

            if (field === 'spec') {
                nextInputs.doctor = ''; nextForm.doctor = null;
                nextInputs.service = ''; nextForm.service = null;
                if (!isRescheduleMode) nextForm.office = null;
            } else if (field === 'doctor') {
                if (!isRescheduleMode) {
                    nextInputs.service = ''; nextForm.service = null;
                    nextForm.office = null;
                }
            } 
            
            if (field !== 'patient') {
                nextForm.date = '';
                nextForm.time = '';
                setAvailableTimeSlots([]);
            }
            
            setErrors({}); 
        } else {
            nextForm[formField] = null;
        }

        setInputs(nextInputs);
        setForm(nextForm);

        if (searchTimers.current[field]) clearTimeout(searchTimers.current[field]);

        searchTimers.current[field] = setTimeout(() => {
            fetchSpecificData('all', nextInputs, nextForm);
        }, 300);
    };

    const handleComboSelect = async (field, item) => {
        let nextInputs = { ...inputs, [field]: item.name || `${item.lastName} ${item.firstName}` };
        const formField = field === 'spec' ? 'specialization' : field;
        let nextForm = { ...form, [formField]: item };

        if (field === 'doctor' && item.officeId && !isRescheduleMode) {
            const docOffice = offices.find(o => String(o.id) === String(item.officeId));
            if (docOffice) nextForm.office = docOffice;
        }

        if ((field === 'doctor' || field === 'service') && item.specializationId && !isRescheduleMode) {
            if (!nextForm.specialization || String(nextForm.specialization.id) !== String(item.specializationId)) {
                try {
                    const res = await fetch(SPECS_API_NOFILTERS, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
                    if (res.ok) {
                        const data = await res.json();
                        if (Array.isArray(data) && data.length > 0) {
                            const fetchedSpec = data.find(s => String(s.id) === String(item.specializationId));
                            if (fetchedSpec) {
                                nextInputs.spec = fetchedSpec.name;
                                nextForm.specialization = fetchedSpec;
                            }
                            setSpecializations(data);
                        }
                    }
                } catch (err) { console.error(err); }
            }
        }

        setInputs(nextInputs);
        setForm(nextForm);
        setErrors(prev => ({ ...prev, [field]: null }));

        if (field === 'doctor') fetchSpecificData('service', nextInputs, nextForm);
        else if (field === 'service') fetchSpecificData('doctor', nextInputs, nextForm);
    };

    const handleBlur = (field) => setTouched(prev => ({ ...prev, [field]: true }));
    const handleComboFocus = (field) => fetchSpecificData(field, inputs, form);

    const getRequiredSlotsCount = (service) => {
        if (!service) return 0;
        const catId = service.categoryId || service.serviceCategoryId; 
        if (!catId) return 1; 

        const category = categories.find(c => c.id === catId);
        if (!category) return 1; 

        const catName = category.name.toLowerCase();
        if (catName.includes('diagnostic')) { SlotSize = 30; return 3; }; 
        if (catName.includes('consultation')) { SlotSize = 20; return 2; }; 
        if (catName.includes('analys')) { SlotSize = 10; return 1; };   
        
        return 1; 
    };

    useEffect(() => {
        if (form.doctor?.id && form.date) {
            // ДОБАВЛЕН ТОКЕН
            const token = localStorage.getItem('accessToken');
            const requestOptions = {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    doctorId: form.doctor.id,
                    date: form.date,
                    SlotSize: SlotSize
                })
            };

            fetch(TIMESTAMPS_API, requestOptions)
                .then(res => { if (!res.ok) throw new Error(); return res.json(); })
                .then(data => { setAvailableTimeSlots(data); })
                .catch(() => { setAvailableTimeSlots([]); });
        } else {
            setAvailableTimeSlots([]);
        }
    }, [form.doctor?.id, form.date]);

    const getEndTime = (startTime, slotsCount) => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + (slotsCount * 10);
        const endHours = Math.floor(totalMinutes / 60);
        const endMins = totalMinutes % 60;
        return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const newErrors = {};
        if (touched.patient && !form.patient) newErrors.patient = "Please, select a patient";
        if (touched.spec && !form.specialization) newErrors.spec = "Invalid specialization name";
        if (touched.doctor && !form.doctor) newErrors.doctor = inputs.doctor ? "Invalid doctor name" : "Please, choose the doctor";
        if (touched.service && !form.service) newErrors.service = "Invalid service name";
        if (touched.office && !form.office) newErrors.office = "Please, choose the office";
        if (touched.date && !form.date) newErrors.date = "Please, select the date";
        if (touched.time && !form.time) newErrors.time = "Please, select the time slot";
        
        setErrors(newErrors);
    }, [form, inputs, touched]);

    const isFormValid = () => {
        return form.patient && form.specialization && form.doctor && form.service && form.office && form.date && form.time && Object.keys(errors).length === 0;
    };

    const isDateTimeEnabled = !!(form.specialization && form.service && form.office);

    const handleCloseClick = () => setShowExitDialog(true);
    const handleExitConfirm = () => { setShowExitDialog(false); closeModal(); };
    const handleExitCancel = () => setShowExitDialog(false);

    const handleConfirmSubmit = () => {
        if (!isLoggedIn) {
            alert("Sign in to make an appointment");
            onRequireAuth && onRequireAuth();
            return;
        }
        if (isFormValid()) {
            onSaveAppointment && onSaveAppointment({ ...form, id: rescheduleData?.id || rescheduleData?.Id });
            closeModal();
        }
    };

    return (
    <div className="appointment-wrapper">
        {!externalOpen && !isRescheduleMode && (
            <button className="btn btn-primary" onClick={() => setInternalOpen(true)}>
                ➕ Appointment
            </button>
        )}

        {isModalOpen && (
            <div className="modal-overlay">
                <div className="modal-card md">
                    <div className="modal-header">
                        <h2>{isRescheduleMode ? "Reschedule Appointment" : "Create Appointment"}</h2>
                        <button className="btn-close" onClick={handleCloseClick}>&times;</button>
                    </div>

                    <div className="modal-body">
                        {isLoadingData ? (
                            <div className="empty-state">Loading data...</div>
                        ) : (
                            <>
                                <Combobox 
                                    label="Patient"
                                    value={inputs.patient}
                                    options={patients}
                                    error={errors.patient}
                                    onChange={(val) => handleComboChange('patient', val)}
                                    onSelect={(item) => handleComboSelect('patient', item)}
                                    onBlur={() => handleBlur('patient')}
                                    onFocus={() => handleComboFocus('patient')}
                                    disabled={isRescheduleMode}
                                />

                                <Combobox 
                                    label="Specialization"
                                    value={inputs.spec}
                                    options={specializations}
                                    error={errors.spec}
                                    onChange={(val) => handleComboChange('spec', val)}
                                    onSelect={(item) => handleComboSelect('spec', item)}
                                    onBlur={() => handleBlur('spec')}
                                    onFocus={() => handleComboFocus('spec')}
                                    disabled={isRescheduleMode}
                                />

                                <Combobox 
                                    label="Doctor"
                                    value={inputs.doctor}
                                    options={doctors.map(d => ({...d, name: `${d.lastName} ${d.firstName}`}))}
                                    error={errors.doctor}
                                    onChange={(val) => handleComboChange('doctor', val)}
                                    onSelect={(item) => handleComboSelect('doctor', item)}
                                    onBlur={() => handleBlur('doctor')}
                                    onFocus={() => handleComboFocus('doctor')}
                                    disabled={false} // AC-3: В режиме Reschedule врач доступен для редактирования
                                />

                                <Combobox 
                                    label="Service"
                                    value={inputs.service}
                                    options={services}
                                    error={errors.service}
                                    onChange={(val) => handleComboChange('service', val)}
                                    onSelect={(item) => handleComboSelect('service', item)}
                                    onBlur={() => handleBlur('service')}
                                    onFocus={() => handleComboFocus('service')}
                                    disabled={isRescheduleMode}
                                />

                                <div className="form-group">
                                    <label>Office</label>
                                    <select 
                                        className={`form-control ${errors.office ? 'is-invalid' : ''}`}
                                        value={form.office?.id || ''}
                                        onChange={(e) => {
                                            const selected = offices.find(o => String(o.id) === String(e.target.value));
                                            setForm(prev => ({ ...prev, office: selected || null }));
                                        }}
                                        onBlur={() => handleBlur('office')}
                                        disabled={isRescheduleMode}
                                    >
                                        <option value="">Select an office...</option>
                                        {offices.map(o => (
                                            <option key={o.id} value={o.id}>{o.name || `Office ${o.adress}`}</option>
                                        ))}
                                    </select>
                                    {errors.office && <span className="error-msg">{errors.office}</span>}
                                </div>

                                <div className="form-group">
                                    <label>Date</label>
                                    <input 
                                        type="date" 
                                        className={`form-control ${errors.date ? 'is-invalid' : ''}`}
                                        disabled={!isDateTimeEnabled} 
                                        min={new Date().toISOString().split('T')[0]}
                                        value={form.date}
                                        onChange={(e) => {
                                            setForm(prev => ({ ...prev, date: e.target.value, time: '' }));
                                            setErrors(prev => ({...prev, date: null})); 
                                        }}
                                        onBlur={() => handleBlur('date')}
                                    />
                                    {errors.date && <span className="error-msg">{errors.date}</span>}
                                </div>

                                <div className="form-group">
                                    <label>Time Slots {form.service && `(Requires ${getRequiredSlotsCount(form.service) * 10} min)`}</label>
                                    <div 
                                        className={`time-slots-grid ${!form.date ? 'disabled' : ''}`}
                                        tabIndex={0}
                                        onBlur={() => handleBlur('time')}
                                    >
                                        {!form.date ? (
                                            <div className="empty-state" style={{gridColumn: '1 / -1', padding: '20px'}}>Please select a date first</div>
                                        ) : availableTimeSlots.length === 0 ? (
                                            <div className="empty-state" style={{gridColumn: '1 / -1', padding: '20px', color: 'var(--error-color)'}}>No free time slots</div>
                                        ) : (
                                            availableTimeSlots.map(slot => {
                                                const cleanSlot = slot.substring(0, 5); 
                                                const requiredSlots = getRequiredSlotsCount(form.service);
                                                
                                                return (
                                                    <button 
                                                        key={slot}
                                                        className={`time-slot ${form.time === cleanSlot ? 'selected' : ''}`}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setForm(prev => ({ ...prev, time: cleanSlot }));
                                                            setErrors(prev => ({...prev, time: null}));
                                                        }}
                                                    >
                                                        {cleanSlot} - {getEndTime(cleanSlot, requiredSlots)}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                    {errors.time && <span className="error-msg">{errors.time}</span>}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={handleCloseClick}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" disabled={!isFormValid() || isLoadingData} onClick={handleConfirmSubmit}>
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        )}

        {showExitDialog && (
            <div className="modal-overlay top-tier">
                <div className="modal-card sm">
                    <p className="mb-4">Do you really want to cancel? Entered data won't be saved.</p>
                    <div className="flex-row" style={{justifyContent: 'center'}}>
                        <button className="btn btn-primary" onClick={handleExitConfirm}>Yes</button>
                        <button className="btn btn-secondary" onClick={handleExitCancel}>No</button>
                    </div>
                </div>
            </div>
        )}
    </div>
    );
};