import React, { useState, useEffect, useMemo } from 'react';
import { fetchDoctors } from './api';
import { DoctorsView } from './DoctorsView';

export const DoctorsModule = ({ onBack }) => {
    const [doctors, setDoctors] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpec, setSelectedSpec] = useState('');
    const [selectedOffice, setSelectedOffice] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDoctors().then(data => {
            setDoctors(data);
            setIsLoading(false);
        });
    }, []);

    const specializations = useMemo(() => [...new Set(doctors.map(d => d.specialization))], [doctors]);
    const offices = useMemo(() => [...new Set(doctors.map(d => d.officeAddress))], [doctors]);

    const filteredDoctors = useMemo(() => {
        return doctors.filter(doctor => {
            if (doctor.status !== 'At work') return false;
            const fullName = `${doctor.lastName} ${doctor.firstName} ${doctor.middleName}`.toLowerCase();
            return (
                fullName.includes(searchQuery.toLowerCase()) &&
                (selectedSpec ? doctor.specialization === selectedSpec : true) &&
                (selectedOffice ? doctor.officeAddress === selectedOffice : true)
            );
        });
    }, [doctors, searchQuery, selectedSpec, selectedOffice]);

    if (isLoading) return <div className="loader-container">Loading</div>;

    return (
        <DoctorsView
            doctors={filteredDoctors}
            specializations={specializations}
            offices={offices}
            searchQuery={searchQuery}
            selectedSpec={selectedSpec}
            selectedOffice={selectedOffice}
            onSearchChange={setSearchQuery}
            onSpecChange={setSelectedSpec}
            onOfficeChange={setSelectedOffice}
            onBack={onBack}
        />
    );
};