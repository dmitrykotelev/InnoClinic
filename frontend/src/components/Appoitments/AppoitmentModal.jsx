import React, { useState, useEffect, useMemo, useRef } from 'react';
import '../../styles/AppointmentModal.css';

// --- API ЭНДПОИНТЫ ---
const DOCTORS_API = 'http://patients.inno-clinic.com/Profile/Doctor/GetAll'; 
const SPECS_API = 'http://services.inno-clinic.com/Specializations/GetAllFiltered';
const SPECS_API_NOFILTERS = 'http://services.inno-clinic.com/Specializations/GetAll';
const SERVICES_API = 'http://services.inno-clinic.com/Services/GetAll';

// GET эндпоинты
const OFFICES_API = 'http://offices.inno-clinic.com/Offices/GetAll';
const CATEGORIES_API = 'http://services.inno-clinic.com/ServiceCategories/GetAll'; 
const TIMESTAMPS_API = 'http://appointments.inno-clinic.com/Appointments/GetTimeStamps';

const DEFAULT_OFFICE = [{
    id: 'default-office-1',
    name: 'Main Clinic Office (Default)',
    isActive: true
}];

export const AppointmentModal = ({ isLoggedIn, onRequireAuth, onSaveAppointment }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showExitDialog, setShowExitDialog] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    
    // --- СТЕЙТЫ ДАННЫХ ---
    const [doctors, setDoctors] = useState([]);
    const [specializations, setSpecializations] = useState([]);
    const [services, setServices] = useState([]);
    const [offices, setOffices] = useState([]);
    const [categories, setCategories] = useState([]);

    const [form, setForm] = useState({
        specialization: null,
        doctor: null,
        service: null,
        office: null,
        date: '',
        time: ''
    });
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [inputs, setInputs] = useState({ spec: '', doctor: '', service: '' });
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});

    const searchTimers = useRef({ spec: null, doctor: null, service: null });

    var SlotSize = 10;
    const fetchSpecificData = (targetField, currentInputs, currentForm) => {
        const specId = currentForm.specialization?.id || null;

        // 1. Базовый массив текстовых фильтров (без поля id)
        const payload = [
            { fieldName: 'specialization', value: currentInputs.spec || "", operation: 'contains' },
            { fieldName: 'doctor', value: currentInputs.doctor || "", operation: 'contains' },
            { fieldName: 'service', value: currentInputs.service || "", operation: 'contains' }
        ];

        // 2. Если специализация выбрана, докидываем в массив фильтр по её ID
        if (specId) {
            payload.push({
                fieldName: 'specializationId',
                value: String(specId),
                operation: 'equals'
            });
        }

        console.log(`[API] POST Запрос (массив) на обновление: ${targetField.toUpperCase()}`, payload);

        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        };

        // Отправляем массив на нужные эндпоинты
        if (targetField === 'spec' || targetField === 'all') {
            fetch(SPECS_API, requestOptions)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json();
                })
                .then(data => {
                    if (Array.isArray(data)) {
                        setSpecializations(data.filter(spec => spec.isActive === true || spec.isActiove === true));
                    }
                })
                .catch(err => console.error("Specs API Error:", err));
        }

        if (targetField === 'doctor' || targetField === 'all') {
            fetch(DOCTORS_API, requestOptions)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json();
                })
                .then(data => {
                    if (Array.isArray(data)) {
                        setDoctors(data.filter(doc => doc.status === true || doc.status === 'At work'));
                    }
                })
                .catch(err => console.error("Doctors API Error:", err));
        }

        if (targetField === 'service' || targetField === 'all') {
            fetch(SERVICES_API, requestOptions)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json();
                })
                .then(data => {
                    if (Array.isArray(data)) {
                        setServices(data.filter(serv => serv.isActive === true || serv.status === true));
                    }
                })
                .catch(err => console.error("Services API Error:", err));
        }
    };
    // --- ЗАГРУЗКА ПРИ ОТКРЫТИИ ОКНА ---
    useEffect(() => {
        if (isModalOpen) {
            setIsLoadingData(true);
            
            fetchSpecificData('all', inputs, form);

            fetch(OFFICES_API)
                .then(res => res.json())
                .then(data => {
                    const activeOffices = data.filter(off => off.isActive === true || off.status === true);
                    setOffices(activeOffices.length > 0 ? activeOffices : DEFAULT_OFFICE);
                })
                .catch(() => setOffices(DEFAULT_OFFICE));

            fetch(CATEGORIES_API)
                .then(res => {
                    if (!res.ok) throw new Error("Failed to fetch categories");
                    return res.json();
                })
                .then(data => {
                    setCategories(data);
                })
                .catch(err => console.error("Категории не загрузились:", err));

            setIsLoadingData(false);
        } else {
            setForm({ specialization: null, doctor: null, service: null, office: null, date: '', time: '' });
            setInputs({ spec: '', doctor: '', service: '' });
            setTouched({});
            setErrors({});
            setAvailableTimeSlots([]);
        }
    }, [isModalOpen]);

    // Обработчик изменения текста (Ввод пользователя + каскадная очистка)
    const handleComboChange = (field, textValue) => {
        let nextInputs = { ...inputs, [field]: textValue };
        const formField = field === 'spec' ? 'specialization' : field;
        let nextForm = { ...form };

        if (form[formField] !== null) {
            nextForm[formField] = null; 

            if (field === 'spec') {
                nextInputs.doctor = ''; nextForm.doctor = null;
                nextInputs.service = ''; nextForm.service = null;
                nextForm.office = null;
            } else if (field === 'doctor') {
                nextInputs.service = ''; nextForm.service = null;
                nextForm.office = null;
            } 
            nextForm.date = '';
            nextForm.time = '';
            setAvailableTimeSlots([]);
            
            setErrors({}); 
        } else {
            nextForm[formField] = null;
        }

        setInputs(nextInputs);
        setForm(nextForm);

        if (searchTimers.current[field]) {
            clearTimeout(searchTimers.current[field]);
        }

        searchTimers.current[field] = setTimeout(() => {
            fetchSpecificData('all', nextInputs, nextForm);
        }, 300);
    };

    // --- ОБРАБОТЧИК ВЫБОРА ИЗ СПИСКА ---
    // --- ОБРАБОТЧИК ВЫБОРА ИЗ СПИСКА ---
    const handleComboSelect = async (field, item) => {
        let nextInputs = { ...inputs, [field]: item.name || `${item.lastName} ${item.firstName}` };
        const formField = field === 'spec' ? 'specialization' : field;
        let nextForm = { ...form, [formField]: item };

        // 1. Автоматический подбор Офиса (ТОЛЬКО для доктора)
        if (field === 'doctor' && item.officeId) {
            const docOffice = offices.find(o => String(o.id) === String(item.officeId));
            if (docOffice) {
                nextForm.office = docOffice;
            }
        }

        // 2. Автоматический подбор Специализации (ДЛЯ ДОКТОРА И ДЛЯ УСЛУГИ)
        if ((field === 'doctor' || field === 'service') && item.specializationId) {
            
            // ДЕЛАЕМ АВТОПОДБОР ТОЛЬКО ЕСЛИ СПЕЦИАЛИЗАЦИЯ ЕЩЕ НЕ ВЫБРАНА ИЛИ ОТЛИЧАЕТСЯ
            if (!nextForm.specialization || String(nextForm.specialization.id) !== String(item.specializationId)) {
                
                const autoPayload = [
                    // Фильтр для строгого поиска самой специализации по её первичному ключу 'id'
                    { fieldName: 'id', value: String(item.specializationId), operation: 'equals' },
                    
                    // Текстовые фильтры (без передачи id)
                    { fieldName: 'doctor', value: nextInputs.doctor || "", operation: 'contains' },
                    { fieldName: 'service', value: nextInputs.service || "", operation: 'contains' },
                    
                    // Фильтр-связка: искать врачей и услуги только с этим specializationId
                    { fieldName: 'specializationId', value: String(item.specializationId), operation: 'equals' }
                ];

                const requestOptions = {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                };

                try {
                    const res = await fetch(SPECS_API_NOFILTERS, requestOptions);
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
                } catch (err) {
                    console.error("Ошибка при автоматическом получении специализации:", err);
                }
            }
        }

        // Обновляем состояния разом
        setInputs(nextInputs);
        setForm(nextForm);
        setErrors(prev => ({ ...prev, [field]: null }));

        // 3. Перекрестное обновление соседних списков
        if (field === 'doctor') {
            fetchSpecificData('service', nextInputs, nextForm);
        } else if (field === 'service') {
            fetchSpecificData('doctor', nextInputs, nextForm);
        }
    };

    const handleBlur = (field) => setTouched(prev => ({ ...prev, [field]: true }));
    
    const handleComboFocus = (field) => {
        fetchSpecificData(field, inputs, form);
    };

    // --- ЛОГИКА 2: ГЕНЕРАЦИЯ ТАЙМ-СЛОТОВ ---
    const getRequiredSlotsCount = (service) => {
        if (!service) return 0;
        const catId = service.categoryId || service.serviceCategoryId; 
        if (!catId) return 1; 

        const category = categories.find(c => c.id === catId);
        if (!category) return 1; 

        const catName = category.name.toLowerCase();
        
        if (catName.includes('diagnostic')) {
            SlotSize = 30;
            return 3
        }; 
        if (catName.includes('consultation')) {
            SlotSize = 20;
            return 2
        }; 
        if (catName.includes('analys')) {
            SlotSize = 10;
            return 1
        };    
        
        return 1; 
    };

    const allDailySlots = useMemo(() => {
        const slots = [];
        let hour = 9;
        let minute = 0;
        while (hour < 18) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            slots.push(timeString);
            minute += 10;
            if (minute === 60) {
                hour += 1;
                minute = 0;
            }
        }
        return slots;
    }, []);

    useEffect(() => {
        if (form.doctor?.id && form.date) {
            console.log(`[API] POST Запрос свободных слотов для Доктора №${form.doctor.id} на дату ${form.date}`);
            
            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doctorId: form.doctor.id,
                    date: form.date,
                    SlotSize: SlotSize
                })
            };

            fetch(TIMESTAMPS_API, requestOptions)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                    return res.json();
                })
                .then(data => {
                    setAvailableTimeSlots(data);
                    console.log("[Расписание] Получены свободные слоты:", data);
                })
                .catch(err => {
                    console.error("Ошибка при получении свободных слотов:", err);
                    setAvailableTimeSlots([]);
                });
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
    // --- ВАЛИДАЦИЯ ---
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

    const isFormValid = () => {
        return form.specialization && form.doctor && form.service && form.office && form.date && form.time && Object.keys(errors).length === 0;
    };

    const isDateTimeEnabled = !!(form.specialization && form.service && form.office);

    const handleCloseClick = () => setShowExitDialog(true);
    const handleExitConfirm = () => { setShowExitDialog(false); setIsModalOpen(false); };
    const handleExitCancel = () => setShowExitDialog(false);

    const handleConfirmSubmit = () => {
        if (!isLoggedIn) {
            alert("Sign in to make an appointment");
            onRequireAuth && onRequireAuth();
            return;
        }
        if (isFormValid()) {
            onSaveAppointment && onSaveAppointment(form);
            setIsModalOpen(false);
        }
    };

    return (
        <div className="appointment-wrapper">
            <button className="btn-action" onClick={() => setIsModalOpen(true)}>
                ➕ Appointment
            </button>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="appointment-modal">
                        <div className="modal-header">
                            <h2>Create Appointment</h2>
                            <button className="btn-close" onClick={handleCloseClick}>&times;</button>
                        </div>

                        <div className="modal-body">
                            {isLoadingData ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>Loading data...</div>
                            ) : (
                                <>
                                    <Combobox 
                                        label="Specialization"
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
                                        {errors.date && <span className="error-msg" style={{color: 'red', fontSize: '12px'}}>{errors.date}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label>Time Slots {form.service && `(Requires ${getRequiredSlotsCount(form.service) * 10} min)`}</label>
                                        <div 
                                            className={`time-slots-grid ${!form.date ? 'disabled' : ''} ${errors.time ? 'is-invalid-grid' : ''}`}
                                            tabIndex={0}
                                            onBlur={() => handleBlur('time')}
                                        >
                                            {!form.date ? (
                                                <div className="empty-state">Please select a date first</div>
                                            ) : availableTimeSlots.length === 0 ? (
                                                <div className="empty-state" style={{color: 'red'}}>No free time slots on this date</div>
                                            ) : (
                                                availableTimeSlots.map(slot => {
                                                    // Отрезаем секунды, получаем "09:00"
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
                                        {errors.time && <span className="error-msg" style={{color: 'red', fontSize: '12px'}}>{errors.time}</span>}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button 
                                className="btn-confirm" 
                                disabled={!isFormValid() || isLoadingData} 
                                onClick={handleConfirmSubmit}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showExitDialog && (
                <div className="modal-overlay dialog-overlay">
                    <div className="dialog-modal">
                        <p>Do you really want to exit? Your appointment will not be saved.</p>
                        <div className="dialog-actions">
                            <button className="btn-yes" onClick={handleExitConfirm}>Yes</button>
                            <button className="btn-no" onClick={handleExitCancel}>No</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Combobox = ({ label, value, options, error, onChange, onSelect, onBlur, onFocus }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="form-group combo-box">
            <label>{label}</label>
            <input 
                type="text"
                className={`form-control ${error ? 'is-invalid' : ''}`}
                value={value}
                onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
                onFocus={() => { 
                    setIsOpen(true); 
                    if (onFocus) onFocus(); 
                }}
                onBlur={() => { setTimeout(() => { setIsOpen(false); onBlur(); }, 150); }}
                placeholder={`Start typing ${label.toLowerCase()}...`}
            />
            {isOpen && options.length > 0 && (
                <ul className="combo-dropdown">
                    {options.map(opt => (
                        <li key={opt.id} onClick={() => onSelect(opt)}>
                            {opt.name}
                        </li>
                    ))}
                </ul>
            )}
            {error && <span className="error-msg" style={{color: 'red', fontSize: '12px'}}>{error}</span>}
        </div>
    );
};