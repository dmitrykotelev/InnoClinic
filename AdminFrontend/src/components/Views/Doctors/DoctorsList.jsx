import React from 'react';
import { DoctorCard } from './DoctorCard.jsx';

export const DoctorsList = ({ doctors, onDeleteDoctor }) => {
    if (doctors.length === 0) {
        return (
            <div className="empty-state">
                <p className="empty-text">Nothing found by your filters</p>
            </div>
        );
    }

    return (
        <div className="doctors-grid">
            {doctors.map(doctor => (
                <DoctorCard 
                    key={doctor.id} 
                    doctor={doctor} 
                    onDelete={onDeleteDoctor} 
                />
            ))}
        </div>
    );
};