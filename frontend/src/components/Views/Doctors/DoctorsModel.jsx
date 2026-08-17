import React, { useState, useEffect, useMemo } from 'react';
import { fetchDoctors } from './api';
import { DoctorsView } from './DoctorsView';
import '../../../styles/Global.css'; 

const OFFICES_API_DOMAIN = 'https://gateway.inno-clinic.com/api-offices';
const SPECS_API_DOMAIN = 'https://gateway.inno-clinic.com/api-services';

export const DoctorsModule = ({ onBack }) => {
    const [doctors, setDoctors] = useState([]);
    const [officesData, setOfficesData] = useState([]); 
    const [specsData, setSpecsData] = useState([]);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpec, setSelectedSpec] = useState('');
    const [selectedOffice, setSelectedOffice] = useState(''); 
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [doctorsData, officesRes, specsRes] = await Promise.all([
                fetchDoctors(),
                fetch(`${OFFICES_API_DOMAIN}/Offices/GetAll`),
                fetch(`${SPECS_API_DOMAIN}/Specializations/GetAll`) 
            ]);

            setDoctors(doctorsData);

            if (officesRes.ok) {
                const oData = await officesRes.json();
                setOfficesData(oData);
            }

            if (specsRes.ok) {
                const sData = await specsRes.json();
                setSpecsData(sData);
            }
        } catch (error) {
            console.error("Ошибка при загрузке данных модуля врачей:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const officeAddressesForView = useMemo(() => {
        return officesData.map(o => o.adress ?? o.Adress);
    }, [officesData]);

    const specializationsForView = useMemo(() => {
        return specsData.map(s => s.name ?? s.Name); 
    }, [specsData]);

    const enrichedDoctors = useMemo(() => {
        if (!doctors.length) return [];

        return doctors.map(doctor => {
            const docOfficeId = doctor.officeId ?? doctor.OfficeId ?? doctor.office;
            const office = officesData.find(o => {
                const currentOfficeId = o.id ?? o.Id;
                if (docOfficeId == null) return false;
                return String(currentOfficeId) === String(docOfficeId);
            });

            const docSpecId = doctor.specializationId ?? doctor.SpecializationId;
            const spec = specsData.find(s => {
                const currentSpecId = s.id ?? s.Id;
                if (docSpecId == null) return false;
                return String(currentSpecId) === String(docSpecId);
            });

            return {
                ...doctor,
                officeAddress: office ? (office.adress ?? office.Adress) : 'Address not found',
                specialization: spec ? (spec.name ?? spec.Name) : 'Spec not found'
            };
        });
    }, [doctors, officesData, specsData]);

    const filteredDoctors = useMemo(() => {
        return enrichedDoctors.filter(doctor => {
            // Показываем только врачей со статусом "At work"
            if (doctor.status !== 'At work') return false;
            
            const fullName = `${doctor.lastName} ${doctor.firstName} ${doctor.middleName}`.toLowerCase();
            
            const matchesOffice = selectedOffice ? doctor.officeAddress === selectedOffice : true;
            const matchesSpec = selectedSpec ? doctor.specialization === selectedSpec : true;

            return (
                fullName.includes(searchQuery.toLowerCase()) &&
                matchesSpec &&
                matchesOffice
            );
        });
    }, [enrichedDoctors, searchQuery, selectedSpec, selectedOffice]);

    if (isLoading) {
        return (
            <div className="page-container">
                <div className="empty-state">Loading doctors list...</div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="flex-between mb-4">
                <div className="flex-row">
                    {onBack && (
                        <button className="btn btn-text" onClick={onBack}>
                            &larr; Back
                        </button>
                    )}
                    <h2 style={{ margin: 0 }}>Our Doctors</h2>
                </div>
            </div>

            <DoctorsView
            doctors={filteredDoctors} 
            specializations={specializationsForView}
            offices={officeAddressesForView} 
            searchQuery={searchQuery}
            selectedSpec={selectedSpec}
            selectedOffice={selectedOffice}
            setSearchQuery={setSearchQuery} 
            setSelectedSpec={setSelectedSpec} 
            setSelectedOffice={setSelectedOffice} 
        />
        </div>
    );
};