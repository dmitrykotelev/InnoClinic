import React, { useState, useEffect, useMemo, useRef } from 'react';
import '../../styles/Global.css';

const DOCTORS_API = 'https://gateway.inno-clinic.com/api-profiles/Profile/Doctor/GetAll'; 
const SPECS_API = 'https://gateway.inno-clinic.com/api-services/Specializations/GetAllFiltered';
const SPECS_API_NOFILTERS = 'https://gateway.inno-clinic.com/api-services/Specializations/GetAll';
const SERVICES_API = 'https://gateway.inno-clinic.com/api-services/Services/GetAll';
const OFFICES_API = 'https://gateway.inno-clinic.com/api-offices/Offices/GetAll';
const CATEGORIES_API = 'https://gateway.inno-clinic.com/api-services/ServiceCategories/GetAll'; 
const TIMESTAMPS_API = 'https://gateway.inno-clinic.com/api-appointments/Appointments/GetTimeStamps';

const DEFAULT_OFFICE = [{ id: 'default-office-1', name: 'Main Clinic Office', isActive: true }];

const Combobox = ({ label, value, options, error, disabled, onChange, onSelect, onBlur, onFocus }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="form-group combo-box">
            <label>{label}</label>
            <input 
                type="text"
                disabled={disabled}
                className={`form-control ${error ? 'is-invalid' : ''}`}
                style={{ backgroundColor: disabled ? 'var(--bg-page)' : '', cursor: disabled ? 'not-allowed' : 'text' }}
                value={value}
                onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
                onFocus={() => { setIsOpen(true); if (onFocus) onFocus(); }}
                onBlur={() => { setTimeout(() => { setIsOpen(false); onBlur(); }, 150); }}
                placeholder={disabled ? value : `Start typing ${label.toLowerCase()}...`}
            />
            {isOpen && !disabled && options.length > 0 && (
                <ul className="combo-dropdown">
                    {options.map(opt => (
                        <li key={opt.id} onClick={() => onSelect(opt)}>{opt.name}</li>
                    ))}
                </ul>
            )}
            {error && !disabled && <span className="error-msg">{error}</span>}
        </div>
    );
};

export const AppointmentModal = ({ 
    isOpen: externalIsOpen, 
    onClose: externalOnClose, 
    rescheduleData, 
    isLoggedIn = true, 
    onRequireAuth, 
    onSaveAppointment 
}) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isModalOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
    
    const isRescheduling = !!rescheduleData; 

    const [showExitDialog, setShowExitDialog] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    
    const [doctors, setDoctors] = useState([]);
    const [specializations, setSpecializations] = useState([]);
    const [services, setServices] = useState([]);
    const [offices, setOffices] = useState([]);
    const [categories, setCategories] = useState([]);

    const [form, setForm] = useState({ specialization: null, doctor: null, service: null, office: null, date: '', time: '' });
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [inputs, setInputs] = useState({ spec: '', doctor: '', service: '' });
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});

    const searchTimers = useRef({ spec: null, doctor: null, service: null });
    let SlotSize = 10;
    
    const fetchSpecificData = (targetField, currentInputs, currentForm) => {
        const specId = currentForm.specialization?.id || null;
        const token = localStorage.getItem('accessToken');
        const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

        const payload = [
            { fieldName: 'specialization', value: currentInputs.spec || "", operation: 'contains' },
            { fieldName: 'doctor', value: currentInputs.doctor || "", operation: 'contains' },
            { fieldName: 'service', value: currentInputs.service || "", operation: 'contains' }
        ];

        if (specId) payload.push({ fieldName: 'specializationId', value: String(specId), operation: 'equals' });

        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeader },
            body: JSON.stringify(payload)
        };

        if (targetField === 'spec' || targetField === 'all') {
            fetch(SPECS_API, requestOptions).then(res => res.json()).then(data => {
                if (Array.isArray(data)) setSpecializations(data.filter(spec => spec.isActive === true || spec.isActiove === true));
            }).catch(() => {});
        }
        if (targetField === 'doctor' || targetField === 'all') {
            fetch(DOCTORS_API, requestOptions).then(res => res.json()).then(data => {
                if (Array.isArray(data)) setDoctors(data.filter(doc => doc.status === true || doc.status === 'At work'));
            }).catch(() => {});
        }
        if (targetField === 'service' || targetField === 'all') {
            fetch(SERVICES_API, requestOptions).then(res => res.json()).then(data => {
                if (Array.isArray(data)) setServices(data.filter(serv => serv.isActive === true || serv.status === true));
            }).catch(() => {});
        }
    };

    useEffect(() => {
        if (isModalOpen) {
            setIsLoadingData(true);
            const token = localStorage.getItem('accessToken');
            const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            Promise.all([
                fetch(SPECS_API_NOFILTERS, { headers: authHeader }).then(r => r.json()).catch(() => []),
                fetch(DOCTORS_API, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify([]) }).then(r => r.json()).catch(() => []),
                fetch(SERVICES_API, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify([]) }).then(r => r.json()).catch(() => []),
                fetch(OFFICES_API, { headers: authHeader }).then(r => r.json()).catch(() => []),
                fetch(CATEGORIES_API, { headers: authHeader }).then(r => r.json()).catch(() => [])
            ]).then(([specsList, docsList, servsList, offsList, catsList]) => {
                const activeOffices = offsList.filter(o => o.isActive === true || o.status === true);
                setOffices(activeOffices.length > 0 ? activeOffices : DEFAULT_OFFICE);
                setCategories(catsList);

                if (rescheduleData) {
                    const tService = servsList.find(s => s.id === rescheduleData.serviceId || s.Id === rescheduleData.serviceId);
                    const tDoctor = docsList.find(d => d.id === rescheduleData.doctorId || d.Id === rescheduleData.doctorId);
                    const tSpec = specsList.find(s => String(s.id) === String(tService?.specializationId || tDoctor?.specializationId));
                    const tOffice = activeOffices.find(o => String(o.id) === String(tDoctor?.officeId || tDoctor?.OfficeId));

                    setForm({
                        specialization: tSpec || null,
                        service: tService || null,
                        office: tOffice || null,
                        doctor: tDoctor || null,
                        date: rescheduleData.date || rescheduleData.Date || '',
                        time: (rescheduleData.time || rescheduleData.Time || '').substring(0, 5)
                    });

                    setInputs({
                        spec: tSpec?.name || tSpec?.Name || '',
                        service: tService?.name || tService?.serviceName || '',
                        doctor: tDoctor ? `${tDoctor.lastName} ${tDoctor.firstName}` : ''
                    });

                    setDoctors(docsList.filter(d => d.status === true || d.status === 'At work'));
                } else {
                    fetchSpecificData('all', inputs, form);
                }
                setIsLoadingData(false);
            });
        } else {
            setForm({ specialization: null, doctor: null, service: null, office: null, date: '', time: '' });
            setInputs({ spec: '', doctor: '', service: '' });
            setTouched({}); setErrors({}); setAvailableTimeSlots([]);
        }
    }, [isModalOpen, rescheduleData]);

    const handleComboChange = (field, textValue) => {
        if (isRescheduling && field !== 'doctor') return;
        let nextInputs = { ...inputs, [field]: textValue };
        const formField = field === 'spec' ? 'specialization' : field;
        let nextForm = { ...form, [formField]: null, date: '', time: '' };

        if (field === 'spec') {
            nextInputs.doctor = ''; nextForm.doctor = null;
            nextInputs.service = ''; nextForm.service = null;
            nextForm.office = null;
        } else if (field === 'doctor' && !isRescheduling) {
            nextInputs.service = ''; nextForm.service = null;
            nextForm.office = null;
        } 
        
        setAvailableTimeSlots([]); setErrors({}); 
        setInputs(nextInputs); setForm(nextForm);

        if (searchTimers.current[field]) clearTimeout(searchTimers.current[field]);
        searchTimers.current[field] = setTimeout(() => fetchSpecificData('all', nextInputs, nextForm), 300);
    };

    const handleComboSelect = async (field, item) => {
        if (isRescheduling && field !== 'doctor') return;
        let nextInputs = { ...inputs, [field]: item.name || `${item.lastName} ${item.firstName}` };
        const formField = field === 'spec' ? 'specialization' : field;
        let nextForm = { ...form, [formField]: item };

        if (field === 'doctor' && !isRescheduling) {
            if (item.officeId || item.OfficeId) {
                const docOfficeId = item.officeId || item.OfficeId;
                const docOffice = offices.find(o => String(o.id) === String(docOfficeId));
                if (docOffice) nextForm.office = docOffice;
            }

            const specId = item.specializationId || item.SpecializationId;
            if (specId) {
                const docSpec = specializations.find(s => String(s.id) === String(specId));
                if (docSpec) {
                    nextForm.specialization = docSpec;
                    nextInputs.spec = docSpec.name || docSpec.Name;
                }
            }
        }

        setInputs(nextInputs);
        setForm(nextForm);
        setErrors(prev => ({ ...prev, [field]: null }));

        if (!isRescheduling) {
            if (field === 'doctor') fetchSpecificData('service', nextInputs, nextForm);
            else if (field === 'service') fetchSpecificData('doctor', nextInputs, nextForm);
        }
    };

    const handleBlur = (field) => setTouched(prev => ({ ...prev, [field]: true }));
    const handleComboFocus = (field) => { if (!isRescheduling || field === 'doctor') fetchSpecificData(field, inputs, form); };

    const getRequiredSlotsCount = (service) => {
        if (!service) return 1;
        const catId = service.categoryId || service.serviceCategoryId; 
        const category = categories.find(c => c.id === catId);
        const catName = category?.name?.toLowerCase() || '';
        
        if (catName.includes('diagnostic')) { SlotSize = 30; return 3; } 
        if (catName.includes('consultation')) { SlotSize = 20; return 2; } 
        if (catName.includes('analys')) { SlotSize = 10; return 1; }   
        return 1; 
    };

    useEffect(() => {
        if (form.doctor?.id && form.date) {
            const token = localStorage.getItem('accessToken');
            fetch(TIMESTAMPS_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                body: JSON.stringify({ doctorId: form.doctor.id, date: form.date, SlotSize: SlotSize })
            }).then(res => res.json()).then(data => setAvailableTimeSlots(data)).catch(() => setAvailableTimeSlots([]));
        } else {
            setAvailableTimeSlots([]);
        }
    }, [form.doctor?.id, form.date]);

    const getEndTime = (startTime, slotsCount) => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + (slotsCount * 10);
        return `${Math.floor(totalMinutes / 60).toString().padStart(2, '0')}:${(totalMinutes % 60).toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const newErrors = {};
        if (touched.spec && !form.specialization) newErrors.spec = "Invalid specialization name";
        if (touched.doctor && !form.doctor) newErrors.doctor = "Invalid doctor name";
        if (touched.service && !form.service) newErrors.service = "Invalid service name";
        if (touched.office && !form.office) newErrors.office = "Please, choose the office";
        if (touched.date && !form.date) newErrors.date = "Please, select the date";
        if (touched.time && !form.time) newErrors.time = "Please, select the time slot";
        setErrors(newErrors);
    }, [form, inputs, touched]);

    const isFormValid = () => form.specialization && form.doctor && form.service && form.office && form.date && form.time && Object.keys(errors).length === 0;
    const isDateTimeEnabled = !!(form.specialization && form.service && form.office);

    const closeHandler = () => {
        if (externalOnClose) externalOnClose();
        else setInternalIsOpen(false);
    };

    const handleCloseClick = () => setShowExitDialog(true);
    const handleExitConfirm = () => { setShowExitDialog(false); closeHandler(); };
    const handleExitCancel = () => setShowExitDialog(false);

    const handleConfirmSubmit = () => {
        if (!isLoggedIn) {
            alert("Sign in to make an appointment");
            onRequireAuth && onRequireAuth();
            return;
        }
        if (isFormValid()) {
            onSaveAppointment && onSaveAppointment(form);
            closeHandler();
        }
    };

    return (
        <div className="appointment-wrapper">
            {externalIsOpen === undefined && (
                <button className="btn-action" onClick={() => setInternalIsOpen(true)}>
                    ➕ Appointment
                </button>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-card md">
                        <div className="modal-header">
                            <h2>{isRescheduling ? 'Reschedule Appointment' : 'Create Appointment'}</h2>
                            <button className="btn-close" onClick={handleCloseClick}>&times;</button>
                        </div>

                        <div className="modal-body">
                            {isLoadingData ? (
                                <div className="empty-state">Loading data...</div>
                            ) : (
                                <>
                                    <Combobox 
                                        label="Specialization"
                                        disabled={isRescheduling}
                                        value={inputs.spec}
                                        options={specializations}
                                        error={errors.spec}
                                        onChange={(val) => handleComboChange('spec', val)}
                                        onSelect={(item) => handleComboSelect('spec', item)}
                                        onBlur={() => handleBlur('spec')}
                                        onFocus={() => handleComboFocus('spec')}
                                    />

                                    <Combobox 
                                        label="Doctor"
                                        disabled={false}
                                        value={inputs.doctor}
                                        options={doctors.map(d => ({...d, name: `${d.lastName} ${d.firstName}`}))}
                                        error={errors.doctor}
                                        onChange={(val) => handleComboChange('doctor', val)}
                                        onSelect={(item) => handleComboSelect('doctor', item)}
                                        onBlur={() => handleBlur('doctor')}
                                        onFocus={() => handleComboFocus('doctor')}
                                    />

                                    <Combobox 
                                        label="Service"
                                        disabled={isRescheduling}
                                        value={inputs.service}
                                        options={services}
                                        error={errors.service}
                                        onChange={(val) => handleComboChange('service', val)}
                                        onSelect={(item) => handleComboSelect('service', item)}
                                        onBlur={() => handleBlur('service')}
                                        onFocus={() => handleComboFocus('service')}
                                    />

                                    <div className="form-group">
                                        <label>Office</label>
                                        <select 
                                            className={`form-control ${errors.office ? 'is-invalid' : ''}`}
                                            disabled={isRescheduling}
                                            style={{ backgroundColor: isRescheduling ? 'var(--bg-page)' : '', cursor: isRescheduling ? 'not-allowed' : 'pointer' }}
                                            value={form.office?.id || ''}
                                            onChange={(e) => {
                                                const selected = offices.find(o => String(o.id) === String(e.target.value));
                                                setForm(prev => ({ ...prev, office: selected || null }));
                                            }}
                                            onBlur={() => handleBlur('office')}
                                        >
                                            <option value="">Select an office...</option>
                                            {offices.map(o => (
                                                <option key={o.id} value={o.id}>{o.name || `Office ${o.adress}`}</option>
                                            ))}
                                        </select>
                                        {errors.office && !isRescheduling && <span className="error-msg">{errors.office}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label>Date</label>
                                        <input 
                                            type="date" 
                                            className={`form-control ${errors.date ? 'is-invalid' : ''}`}
                                            disabled={!isDateTimeEnabled}
                                            min={new Date().toISOString().split('T')[0]}
                                            value={form.date}
                                            onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                            
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
                                        <div className={`time-slots-grid ${!form.date ? 'disabled' : ''}`} tabIndex={0} onBlur={() => handleBlur('time')}>
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
                            <button className="btn btn-secondary" onClick={handleCloseClick}>Cancel</button>
                            <button className="btn btn-primary" disabled={!isFormValid() || isLoadingData} onClick={handleConfirmSubmit}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {showExitDialog && (
                <div className="modal-overlay top-tier">
                    <div className="modal-card sm">
                        <h3 className="mb-3">Cancel Edit?</h3>
                        <p className="mb-4">Do you really want to cancel? Entered data won’t be saved.</p>
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