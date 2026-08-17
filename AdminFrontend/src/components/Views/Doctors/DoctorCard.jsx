import React from 'react';
import { useNavigate } from 'react-router-dom';

const calculateExperience = (startYear) => new Date().getFullYear() - startYear + 1;

export const DoctorCard = ({ doctor, onDelete }) => {
    const navigate = useNavigate();

    const handleCardClick = () => {
        navigate(`/doctor/${doctor.id}`);
    };

    const handleSignClick = (e) => {
        e.stopPropagation(); 
        navigate(`/doctor/${doctor.id}`);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        console.log("Данные доктора:", doctor);
        const isConfirmed = window.confirm("Вы уверены?");
        if (isConfirmed && onDelete) {
            onDelete(doctor.id, doctor.accountId ?? doctor.AccountId); 
        }
    };

    return (
        <div className="doctor-card" onClick={handleCardClick} style={{ cursor: 'pointer', position: 'relative' }}>
            
            <button 
                onClick={handleDeleteClick}
                style={{ 
                    position: 'absolute', 
                    top: '10px', 
                    right: '10px', 
                    backgroundColor: '#dc3545', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    padding: '5px 10px',
                    cursor: 'pointer',
                    zIndex: 2
                }}
                title="Удалить доктора"
            >
                Удалить
            </button>

            <img 
                src={doctor.photoUrl} 
                alt={doctor.lastName} 
                className="doctor-photo" 
            />

            <h3 className="doctor-name">
                {doctor.lastName}<br />{doctor.firstName} {doctor.middleName}
            </h3>

            <p className="doctor-spec">
                {doctor.specialization}
            </p>

            <div className="doctor-info-divider">
                <div className="doctor-info-row">
                    <span className="doctor-info-label">Experience:</span>
                    <span className="doctor-info-value">{calculateExperience(doctor.careerStartYear)} years</span>
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