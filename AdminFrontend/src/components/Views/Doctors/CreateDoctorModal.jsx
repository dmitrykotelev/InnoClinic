import React, { useState, useMemo, useEffect } from 'react';
import '../../../styles/Global.css'; 
const OFFICES_API_DOMAIN = 'http://gateway.inno-clinic.com/api-offices';
const SPECS_API_DOMAIN = 'http://gateway.inno-clinic.com/api-services';
const IDENTITY_API_DOMAIN = 'http://gateway.inno-clinic.com/api-identity';
const PHOTOS_API_DOMAIN = 'http://gateway.inno-clinic.com/api-photos';

export const CreateDoctorModal = ({ isOpen, onClose, onDoctorCreated }) => {
    const initialFormState = {
        photo: null,
        firstName: '',
        lastName: '',
        middleName: '',
        dateOfBirth: '',
        email: '',
        specialization: '',
        office: '',
        careerStartYear: '',
        status: 'At work'
    };

    const [formData, setFormData] = useState(initialFormState);
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    
    const [officesList, setOfficesList] = useState([]);
    const [specializationsList, setSpecializationsList] = useState([]);
    const [isFetchingData, setIsFetchingData] = useState(false);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);

    const statuses = [
        "At work", "On vacation", "Sick Day", "Sick Leave", 
        "Self-isolation", "Leave without pay", "Inactive"
    ];

    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        if (!isOpen) return;

        const fetchDropdownData = async () => {
            setIsFetchingData(true);
            try {
                const [officesRes, specsRes] = await Promise.all([
                    fetch(`${OFFICES_API_DOMAIN}/Offices/GetAll`),
                    fetch(`${SPECS_API_DOMAIN}/Specializations/GetAll`)
                ]);

                if (officesRes.ok) {
                    const oData = await officesRes.json();
                    setOfficesList(oData); 
                }
                
                if (specsRes.ok) {
                    const sData = await specsRes.json();
                    setSpecializationsList(sData);
                }
            } catch (error) {
                console.error("Ошибка при загрузке справочников:", error);
            } finally {
                setIsFetchingData(false);
            }
        };

        fetchDropdownData();
    }, [isOpen]);

    const checkEmailExists = async (email) => {
        if (!email || !/\S+@\S+\.\S+/.test(email)) return; 

        setIsCheckingEmail(true);
        try {
            const response = await fetch(`${IDENTITY_API_DOMAIN}/EmailChek/${encodeURIComponent(email)}`);
            
            if (!response.ok) {
                setErrors(prev => ({ ...prev, email: 'User with this email already exists' }));
            } else {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    if (newErrors.email === 'User with this email already exists') {
                        delete newErrors.email;
                    }
                    return newErrors;
                });
            }
        } catch (error) {
            console.error("Ошибка при проверке email:", error);
        } finally {
            setIsCheckingEmail(false);
        }
    };

    const validateField = (name, value) => {
        let error = '';
        switch (name) {
            case 'firstName':
                if (!value.trim()) error = 'Please, enter the first name';
                break;
            case 'lastName':
                if (!value.trim()) error = 'Please, enter the last name';
                break;
            case 'dateOfBirth':
                if (!value) error = 'Please, select the date';
                else if (value > today) error = 'Date cannot be in the future';
                break;
            case 'email':
                if (!value.trim()) error = 'Please, enter the email';
                else if (!/\S+@\S+\.\S+/.test(value)) error = "You've entered an invalid email";
                break;
            case 'specialization':
                if (!value.trim()) {
                    error = 'Please, choose the specialisation';
                } else {
                    const isValid = specializationsList.some(s => 
                        (s.name ?? s.Name ?? s.specializationName) === value
                    );
                    if (!isValid) error = 'Invalid specialization name';
                }
                break;
            case 'office':
                if (!value) error = 'Please, choose the office';
                break;
            case 'careerStartYear':
                if (!value) error = 'Please, select the year';
                else if (value > currentYear) error = 'Year cannot be in the future';
                break;
            default:
                break;
        }
        return error;
    };

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        const val = type === 'file' ? files[0] : value;
        setFormData(prev => ({ ...prev, [name]: val }));
        
        if (touched[name]) {
            setErrors(prev => ({ ...prev, [name]: validateField(name, val) }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        
        const localError = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: localError }));

        if (name === 'email' && !localError) {
            checkEmailExists(value);
        }
    };

    const isFormValid = useMemo(() => {
        const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'email', 'specialization', 'office', 'careerStartYear'];
        const hasEmptyRequired = requiredFields.some(field => !formData[field]);
        const hasErrors = Object.values(errors).some(err => err !== '');
        return !hasEmptyRequired && !hasErrors && !isCheckingEmail;
    }, [formData, errors, isCheckingEmail]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        const token = localStorage.getItem('accessToken');
        let uploadedPhotoId = "";

        try {
            if (formData.photo) {
                const photoData = new FormData();
                photoData.append('file', formData.photo); 

                const uploadResponse = await fetch(`${PHOTOS_API_DOMAIN}/Photo/UploadPhoto`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: photoData,
                });

                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload photo');
                }

                let rawId = await uploadResponse.text();
                uploadedPhotoId = rawId.replace(/"/g, ''); 
            }

            const selectedOffice = officesList.find(o => (o.adress ?? o.Adress) === formData.office);
            const officeId = selectedOffice ? (selectedOffice.id ?? selectedOffice.Id) : 0;

            const selectedSpec = specializationsList.find(s => (s.name ?? s.Name ?? s.specializationName) === formData.specialization);
            const specId = selectedSpec ? (selectedSpec.id ?? selectedSpec.Id) : 0;

            const dateOfBirthIso = new Date(formData.dateOfBirth).toISOString();
            const careerStartIso = new Date(`${formData.careerStartYear}-01-01`).toISOString();

            const registerPayload = {
                email: formData.email,  
                photoId: uploadedPhotoId, 
                profile: {   
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    middleName: formData.middleName || null,
                    dateOfBirth: dateOfBirthIso,
                    accountId: " ",
                    specializationId: specId,
                    officeId: officeId,
                    careerStartYear: careerStartIso,
                    status: formData.status === 'At work'
                }
            };

            console.log('Sending registration data:', registerPayload);

            const registrateResponse = await fetch(`${IDENTITY_API_DOMAIN}/Profile/Doctor/Registrate`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(registerPayload)
            });

            if (!registrateResponse.ok) {
                const errorText = await registrateResponse.text();
                throw new Error(`Registration failed: ${errorText}`);
            }

            alert("Doctor successfully registered!");
            onDoctorCreated();
            setFormData(initialFormState);
            setTouched({});
            onClose();

        } catch (error) {
            console.error("Ошибка при регистрации профиля:", error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleCancelClick = () => setShowCancelDialog(true);

    const confirmCancel = (confirm) => {
        if (confirm) {
            setFormData(initialFormState);
            setTouched({});
            setShowCancelDialog(false);
            onClose();
        } else {
            setShowCancelDialog(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-card md">
                <div className="modal-header">
                    <h2>Create Doctor Profile</h2>
                    <button className="btn-close" onClick={handleCancelClick}>&times;</button>
                </div>
                
                <div className="modal-body">
                    {isFetchingData ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>Loading data...</div>
                    ) : (
                        <form id="create-doctor-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Photo</label>
                                <input type="file" className="form-control" name="photo" accept="image/*" onChange={handleChange} />
                            </div>

                            <div className="form-group">
                                <label>First Name *</label>
                                <input type="text" className={`form-control ${errors.firstName ? 'is-invalid' : ''}`} name="firstName" value={formData.firstName} onChange={handleChange} onBlur={handleBlur} />
                                {errors.firstName && <span className="error-msg">{errors.firstName}</span>}
                            </div>

                            <div className="form-group">
                                <label>Last Name *</label>
                                <input type="text" className={`form-control ${errors.lastName ? 'is-invalid' : ''}`} name="lastName" value={formData.lastName} onChange={handleChange} onBlur={handleBlur} />
                                {errors.lastName && <span className="error-msg">{errors.lastName}</span>}
                            </div>

                            <div className="form-group">
                                <label>Middle Name</label>
                                <input type="text" className="form-control" name="middleName" value={formData.middleName} onChange={handleChange} />
                            </div>

                            <div className="form-group">
                                <label>Date of Birth *</label>
                                <input type="date" className={`form-control ${errors.dateOfBirth ? 'is-invalid' : ''}`} name="dateOfBirth" max={today} value={formData.dateOfBirth} onChange={handleChange} onBlur={handleBlur} />
                                {errors.dateOfBirth && <span className="error-msg">{errors.dateOfBirth}</span>}
                            </div>

                            <div className="form-group">
                                <label>E-mail *</label>
                                <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} />
                                {isCheckingEmail && <span style={{ fontSize: '12px', color: '#666' }}>Checking...</span>}
                                {errors.email && <span className="error-msg">{errors.email}</span>}
                            </div>

                            <div className="form-group">
                                <label>Specialization *</label>
                                <input list="specs" className={`form-control ${errors.specialization ? 'is-invalid' : ''}`} name="specialization" value={formData.specialization} onChange={handleChange} onBlur={handleBlur} />
                                <datalist id="specs">
                                    {specializationsList.map(spec => (
                                        <option 
                                            key={spec.id ?? spec.Id} 
                                            value={spec.name ?? spec.Name ?? spec.specializationName} 
                                        />
                                    ))}
                                </datalist>
                                {errors.specialization && <span className="error-msg">{errors.specialization}</span>}
                            </div>

                            <select className={`form-control ${errors.office ? 'is-invalid' : ''}`} name="office" value={formData.office} onChange={handleChange} onBlur={handleBlur}>
                                <option value="">Select an office</option>
                                {officesList.map(office => (
                                    <option 
                                        key={office.id ?? office.Id} 
                                        value={office.adress ?? office.Adress}
                                    >
                                        {office.adress ?? office.Adress}
                                    </option>
                                ))}
                            </select>

                            <div className="form-group">
                                <label>Career Start Year *</label>
                                <input type="number" className={`form-control ${errors.careerStartYear ? 'is-invalid' : ''}`} name="careerStartYear" min="1950" max={currentYear} value={formData.careerStartYear} onChange={handleChange} onBlur={handleBlur} />
                                {errors.careerStartYear && <span className="error-msg">{errors.careerStartYear}</span>}
                            </div>

                            <div className="form-group">
                                <label>Status *</label>
                                <select className="form-control" name="status" value={formData.status} onChange={handleChange}>
                                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </form>
                    )}
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" style={{ marginRight: '10px' }} onClick={handleCancelClick}>Cancel</button>
                    <button type="submit" form="create-doctor-form" className="btn-confirm" disabled={!isFormValid}>Confirm</button>
                </div>
            </div>

            {showCancelDialog && (
                <div className="modal-overlay dialog-overlay">
                    <div className="modal-card sm">
                        <p style={{ color: '#333', marginBottom: '20px' }}>
                            Do you really want to cancel?<br/>Entered data will not be saved.
                        </p>
                        <div className="dialog-actions">
                            <button className="btn btn-primary" onClick={() => confirmCancel(true)}>Yes</button>
                            <button className="btn btn-secondary" onClick={() => confirmCancel(false)}>No</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};