import React from 'react';
import { useNavigate } from 'react-router-dom';

const calculateExperience = (startYear) => {
    if (!startYear) return 0;
    
    const year = String(startYear).includes('-') 
        ? new Date(startYear).getFullYear() 
        : Number(startYear);

    if (isNaN(year) || year <= 0) return 0;

    return new Date().getFullYear() - year + 1;
};

export const DoctorCard = ({ doctor }) => {
    const navigate = useNavigate();

    const handleCardClick = () => {
        navigate(`/doctor/${doctor.id || doctor.Id}`);
    };

    const handleSignClick = (e) => {
        e.stopPropagation(); 
        navigate(`/doctor/${doctor.id || doctor.Id}`);
    };

    // Достаем ссылку на фото из любого возможного поля
    const imageUrl = doctor.photoUrl || doctor.PhotoUrl || doctor.photo || doctor.Photo;

    return (
        <div className="doctor-card" onClick={handleCardClick} style={{ cursor: 'pointer', position: 'relative' }}>
            
            {imageUrl ? (
                <img 
                    src={imageUrl} 
                    alt={doctor.lastName || 'Doctor'} 
                    className="doctor-photo" 
                    onError={(e) => {
                        // Если ссылка заблокирована браузером или сломана, ставим встроенную SVG-заглушку
                        e.target.onerror = null; 
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect width='150' height='150' fill='%23eeeeee'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999999' font-family='sans-serif' font-size='16px'%3ENo Photo%3C/text%3E%3C/svg%3E";
                    }}
                />
            ) : (
                <div className="doctor-photo" style={{ backgroundColor: '#eeeeee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999999', fontSize: '16px', height: '150px', width: '100%', objectFit: 'cover' }}>
                    No Photo
                </div>
            )}

            <h3 className="doctor-name">
                {doctor.lastName}<br />{doctor.firstName} {doctor.middleName}
            </h3>

            <p className="doctor-spec" style={{ minHeight: '20px' }}>
                {doctor.specialization}
            </p>

            <div className="doctor-info-divider">
                <div className="doctor-info-row">
                    <span className="doctor-info-label">Experience:</span>
                    <span className="doctor-info-value">{calculateExperience(doctor.careerStartYear || doctor.CareerStartYear)} years</span>
                </div>
                <div className="doctor-info-row">
                    <span className="doctor-info-label">Address:</span>
                    <span className="doctor-info-value medium">{doctor.officeAddress}</span>
                </div>
            </div>

            <button className="btn btn-secondary" onClick={handleSignClick}>
                Sign
            </button>
        </div>
    );
};