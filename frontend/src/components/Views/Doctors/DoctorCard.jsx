import React from 'react';

const calculateExperience = (startYear) => new Date().getFullYear() - startYear + 1;

export const DoctorCard = ({ doctor }) => (
    <div className="doctor-card">
        <img src={doctor.photo} alt={doctor.lastName} className="doctor-photo" />

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
                <span className="doctor-info-label">Adress:</span>
                <span className="doctor-info-value medium">{doctor.officeAddress}</span>
            </div>
        </div>

        <button className="btn-book">
            Sign
        </button>
    </div>
);