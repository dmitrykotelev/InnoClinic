import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../../styles/Doctors.css'; 
import '../../../styles/AppointmentModal.css';
import { createAppointment } from '../../Appoitments/AppoitmentApi.js'; 

const DOCTOR_API_URL = 'https://gateway.inno-clinic.com/api-profiles/Profile/Doctor'; 
const SPECIALIZATIONS_API_URL = 'https://gateway.inno-clinic.com/api-services/Specializations'; 
const SERVICES_API_URL = 'https://gateway.inno-clinic.com/api-services/Services'; 
const OFFICES_API_URL = 'https://gateway.inno-clinic.com/api-offices/Offices'; 
const AUTH_API_URL = 'https://gateway.inno-clinic.com/api-identity/Profile'; 
const PHOTOS_API_URL = 'https://gateway.inno-clinic.com/api-photos/Photo'; 

const CATEGORIES_API = 'https://gateway.inno-clinic.com/api-services/ServiceCategories/GetAll'; 
const TIMESTAMPS_API = 'https://gateway.inno-clinic.com/api-appointments/Appointments/GetTimeStamps';

export const DoctorProfile = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();

    const [doctor, setDoctor] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchDoctorData = async () => {
            try {
                const doctorResponse = await fetch(`${DOCTOR_API_URL}/${id}`);
                if (!doctorResponse.ok) throw new Error('Врач не найден');
                const doctorData = await doctorResponse.json();

                try {
                    const specResponse = await fetch(`${SPECIALIZATIONS_API_URL}/${doctorData.specializationId}`);
                    if (specResponse.ok) {
                        const specData = await specResponse.json();
                        doctorData.specializationName = specData.name; 
                    } else {
                        doctorData.specializationName = `Unknown (ID: ${doctorData.specializationId})`;
                    }
                } catch (specErr) {
                    doctorData.specializationName = `Unknown`;
                }

                try {
                    const servicesResponse = await fetch(`${SERVICES_API_URL}/GetBySpec/${doctorData.specializationId}`);
                    if (servicesResponse.ok) {
                        const servicesData = await servicesResponse.json();
                        doctorData.servicesList = servicesData; 
                    } else {
                        doctorData.servicesList = [];
                    }
                } catch (servicesErr) {
                    doctorData.servicesList = [];
                }

                try {
                    const officeResponse = await fetch(`${OFFICES_API_URL}/${doctorData.officeId}`);
                    if (officeResponse.ok) {
                        const officeData = await officeResponse.json();
                        doctorData.officeName = officeData.adress || `Office ${doctorData.officeId}`;
                    } else {
                        doctorData.officeName = `Unknown (ID: ${doctorData.officeId})`;
                    }
                } catch (officeErr) {
                    doctorData.officeName = `Unknown (ID: ${doctorData.officeId})`;
                }

                try {
                    const targetUserId = doctorData.accountId || doctorData.id; 
                    const photoIdResponse = await fetch(`${AUTH_API_URL}/GetPhotoId?userId=${targetUserId}`);
                    
                    if (photoIdResponse.ok) {
                        const photoId = await photoIdResponse.text();
                        if (photoId && photoId.trim() !== "null" && photoId.trim() !== "") {
                            const photoUrlResponse = await fetch(`${PHOTOS_API_URL}/GetPhoto/${photoId.replace(/"/g, '')}`);
                            if (photoUrlResponse.ok) {
                                const rawUrl = await photoUrlResponse.text();
                                doctorData.photoUrl = rawUrl.replace(/^"|"$/g, ''); 
                            }
                        } else {
                            doctorData.photoUrl = null;
                        }
                    }
                } catch (photoErr) {
                    doctorData.photoUrl = null;
                }

                setDoctor(doctorData);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchDoctorData();
    }, [id]);

    const calculateExperience = (careerStartDateString) => {
        if (!careerStartDateString) return 0;
        const startYear = new Date(careerStartDateString).getFullYear();
        return new Date().getFullYear() - startYear + 1;
    };

    const handleSaveAppointment = async (appointmentData) => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            alert("Пожалуйста, авторизуйтесь для создания приема.");
            return;
        }

        let userId = null;
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            const decodedToken = JSON.parse(jsonPayload);
            userId = decodedToken.sub || decodedToken.nameid || decodedToken.name;
        } catch (e) {
            console.error("Ошибка при чтении токена:", e);
        }

        try {
            await createAppointment(appointmentData, token, userId);
            alert("Appointment successfully created!");
            setIsModalOpen(false);
        } catch (error) {
            console.error(error.message);
            alert("Error creating appointment. Please try again.");
        }
    };

    if (isLoading) return <div className="loader-container">Loading...</div>;
    if (error) return <div className="empty-state"><p className="empty-text">{error}</p></div>;
    if (!doctor) return <div className="empty-state"><p className="empty-text">Данные отсутствуют</p></div>;

    return (
        <div className="doctor-profile-container">
            <button className="btn-back" onClick={() => navigate('/', { state: { targetView: 'doctors' } })}>
                &larr; Back to Doctors List
            </button>

            <div className="doctor-info-card">
                <div className="doctor-photo-wrapper">
                    {doctor.photoUrl ? (
                        <img 
                            src={doctor.photoUrl} 
                            alt={`Dr. ${doctor.lastName}`} 
                            className="doctor-photo" 
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : null}
                    
                    <div 
                        className="photo-placeholder" 
                        style={{ display: doctor.photoUrl ? 'none' : 'flex' }}
                    >
                        Фотография отсутствует
                    </div>
                </div>

                <div className="doctor-details">
                    <h2 className="profile-name">
                        {doctor.lastName} {doctor.firstName} {doctor.middleName}
                    </h2>
                    
                    <p className="profile-spec">{doctor.specializationName}</p>

                    <div className="profile-info-divider">
                        <div className="profile-info-row">
                            <span className="profile-info-label">Experience:</span>
                            <span className="profile-info-value">{calculateExperience(doctor.careerStartYear)} years</span>
                        </div>
                        
                        <div className="profile-info-row">
                            <span className="profile-info-label">Office:</span>
                            <span className="profile-info-value">{doctor.officeName}</span>
                        </div>
                    </div>

                    <div className="profile-info-row profile-services">
                        <span className="profile-info-label">Services:</span>
                        <div className="profile-info-value">
                            {doctor.servicesList && doctor.servicesList.length > 0 ? (
                                <ul>
                                    {doctor.servicesList.map((service, index) => (
                                        <li key={index}>{service.name || "Unnamed service"}</li>
                                    ))}
                                </ul>
                            ) : (
                                <span>No services found for this specialization</span>
                            )}
                        </div>
                    </div>

                    <button className="btn-make-appointment" onClick={() => setIsModalOpen(true)}>
                        Make an appointment
                    </button>
                </div>
            </div>

            {isModalOpen && (
                <PrefilledAppointmentModal 
                    doctorData={doctor} 
                    onClose={() => setIsModalOpen(false)} 
                    onSaveAppointment={handleSaveAppointment} 
                />
            )}
        </div>
    );
};

const PrefilledAppointmentModal = ({ doctorData, onClose, onSaveAppointment }) => {
    const [showExitDialog, setShowExitDialog] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    
    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState(doctorData.servicesList || []);

    const [form, setForm] = useState({
        specialization: { id: doctorData.specializationId, name: doctorData.specializationName },
        doctor: { id: doctorData.id, name: `${doctorData.lastName} ${doctorData.firstName}` },
        service: null,
        office: { id: doctorData.officeId, adress: doctorData.officeName },
        date: '',
        time: ''
    });

    const [inputs, setInputs] = useState({ 
        spec: doctorData.specializationName, 
        doctor: `${doctorData.lastName} ${doctorData.firstName}`, 
        service: '' 
    });

    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});

    let SlotSize = 10;

    useEffect(() => {
        setIsLoadingData(true);
        fetch(CATEGORIES_API)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch categories");
                return res.json();
            })
            .then(data => setCategories(data))
            .catch(err => console.error("Категории не загрузились:", err))
            .finally(() => setIsLoadingData(false));
    }, []);

    const handleComboChange = (field, textValue) => {
        if (field !== 'service') return;

        setInputs({ ...inputs, [field]: textValue });
        if (form.service !== null) {
            setForm({ ...form, service: null, date: '', time: '' });
            setAvailableTimeSlots([]);
            setErrors({});
        }
    };

    const handleComboSelect = (field, item) => {
        if (field !== 'service') return;
        setInputs({ ...inputs, service: item.name });
        setForm({ ...form, service: item });
        setErrors(prev => ({ ...prev, service: null }));
    };

    const handleBlur = (field) => setTouched(prev => ({ ...prev, [field]: true }));

    const getRequiredSlotsCount = (service) => {
        if (!service) return 0;
        const catId = service.categoryId || service.serviceCategoryId; 
        if (!catId) return 1; 

        const category = categories.find(c => c.id === catId);
        if (!category) return 1; 

        const catName = category.name.toLowerCase();
        
        if (catName.includes('diagnostic')) { SlotSize = 30; return 3; } 
        if (catName.includes('consultation')) { SlotSize = 20; return 2; } 
        if (catName.includes('analys')) { SlotSize = 10; return 1; }    
        return 1; 
    };

    useEffect(() => {
        if (form.doctor?.id && form.date) {
            getRequiredSlotsCount(form.service);
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
                .then(data => setAvailableTimeSlots(data))
                .catch(() => setAvailableTimeSlots([]));
        } else {
            setAvailableTimeSlots([]);
        }
    }, [form.date, form.service]); 

    const getEndTime = (startTime, slotsCount) => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + (slotsCount * 10);
        const endHours = Math.floor(totalMinutes / 60);
        const endMins = totalMinutes % 60;
        return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const newErrors = {};
        if (touched.service && !form.service) newErrors.service = "Invalid service name";
        if (touched.date && !form.date) newErrors.date = "Please, select the date";
        if (touched.time && !form.time) newErrors.time = "Please, select the time slot";
        setErrors(newErrors);
    }, [form, inputs, touched]);

    const isFormValid = () => {
        return form.specialization && form.doctor && form.service && form.office && form.date && form.time && Object.keys(errors).length === 0;
    };

    const isDateTimeEnabled = !!form.service;

    const handleConfirmSubmit = () => {
        const token = localStorage.getItem('accessToken');
        if (!token || token === "undefined") {
            alert("Sign in to make an appointment");
            return;
        }
        if (isFormValid()) {
            onSaveAppointment(form);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card md">
                <div className="modal-header">
                    <h2>Create Appointment</h2>
                    <button className="btn-close" onClick={() => setShowExitDialog(true)}>&times;</button>
                </div>

                <div className="modal-body">
                    {isLoadingData ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>Loading data...</div>
                    ) : (
                        <>
                            <Combobox 
                                label="Specialization"
                                value={inputs.spec}
                                options={[]}
                                disabled={true}
                                onChange={() => {}}
                                onSelect={() => {}}
                            />

                            <Combobox 
                                label="Doctor"
                                value={inputs.doctor}
                                options={[]}
                                disabled={true} 
                                onChange={() => {}}
                                onSelect={() => {}}
                            />

                            <Combobox 
                                label="Service"
                                value={inputs.service}
                                options={services}
                                error={errors.service}
                                onChange={(val) => handleComboChange('service', val)}
                                onSelect={(item) => handleComboSelect('service', item)}
                                onBlur={() => handleBlur('service')}
                            />

                            <div className="form-group">
                                <label>Office</label>
                                <select className="form-control" value={form.office.id} disabled>
                                    <option value={form.office.id}>{form.office.adress}</option>
                                </select>
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
                        className="btn btn-primary" 
                        disabled={!isFormValid() || isLoadingData} 
                        onClick={handleConfirmSubmit}
                    >
                        Confirm
                    </button>
                </div>
            </div>

            {showExitDialog && (
                <div className="modal-overlay top-tier">
                    <div className="modal-card sm">
                        <h3 className="mb-3">Cancel Edit?</h3>
                        <p className="mb-4">Do you really want to exit? Your appointment will not be saved.</p>
                        <div className="flex-row" style={{justifyContent: 'center'}}>
                            <button className="btn btn-primary" onClick={onClose}>Yes</button>
                            <button className="btn btn-secondary" onClick={() => setShowExitDialog(false)}>No</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Combobox = ({ label, value, options, error, onChange, onSelect, onBlur, onFocus, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="form-group combo-box">
            <label>{label}</label>
            <input 
                type="text"
                className={`form-control ${error ? 'is-invalid' : ''}`}
                value={value}
                disabled={disabled}
                onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
                onFocus={() => { 
                    if (disabled) return;
                    setIsOpen(true); 
                    if (onFocus) onFocus(); 
                }}
                onBlur={() => { setTimeout(() => { setIsOpen(false); if(onBlur) onBlur(); }, 150); }}
                placeholder={disabled ? "" : `Start typing ${label.toLowerCase()}...`}
            />
            {isOpen && !disabled && options.length > 0 && (
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