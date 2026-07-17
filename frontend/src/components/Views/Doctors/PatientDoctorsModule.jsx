import React, { useState, useEffect, useMemo } from 'react';
import { fetchDoctors } from './api';
import { DoctorsView } from './DoctorsView';
import '../../../styles/Global.css'; 

const OFFICES_API_DOMAIN = 'http://gateway.inno-clinic.com/api-offices';
const SPECS_API_DOMAIN = 'http://gateway.inno-clinic.com/api-services';

export const PatientDoctorsModule = ({ onBack }) => {
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
            const token = localStorage.getItem('accessToken');
            const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

            const [doctorsData, officesRes, specsRes] = await Promise.all([
                fetchDoctors(),
                fetch(`${OFFICES_API_DOMAIN}/Offices/GetAll`, { headers: authHeader }),
                fetch(`${SPECS_API_DOMAIN}/Specializations/GetAll`, { headers: authHeader }) 
            ]);

            setDoctors(doctorsData || []);

            if (officesRes.ok) {
                const oData = await officesRes.json();
                setOfficesData(Array.isArray(oData) ? oData : (oData.items || []));
            }

            if (specsRes.ok) {
                const sData = await specsRes.json();
                setSpecsData(Array.isArray(sData) ? sData : (sData.items || []));
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
        return officesData.map(o => o.adress ?? o.address ?? o.Adress).filter(Boolean);
    }, [officesData]);

    const specializationsForView = useMemo(() => {
        return specsData.map(s => s.name ?? s.Name).filter(Boolean); 
    }, [specsData]);

    // ==========================================
    // СТРОГОЕ ОБОГАЩЕНИЕ ДАННЫХ
    // ==========================================
    const enrichedDoctors = useMemo(() => {
        if (!doctors.length) return [];

        return doctors.map(doctor => {
            // Ищем точное совпадение по ID
            const office = officesData.find(o => String(o.id ?? o.Id) === String(doctor.officeId));
            const spec = specsData.find(s => String(s.id ?? s.Id) === String(doctor.specializationId));

            return {
                ...doctor,
                officeAddress: office ? (office.adress ?? office.address ?? office.Adress) : 'Адрес не найден',
                specialization: spec ? (spec.name ?? spec.Name) : 'Специальность не указана',
                status: doctor.status === true || doctor.status === 'At work' ? 'At work' : 'Inactive'
            };
        });
    }, [doctors, officesData, specsData]);

    const filteredDoctors = useMemo(() => {
        return enrichedDoctors.filter(doctor => {
            if (doctor.status !== 'At work') return false;
            
            const fullName = `${doctor.lastName} ${doctor.firstName} ${doctor.middleName}`.toLowerCase();
            const matchesOffice = selectedOffice ? doctor.officeAddress === selectedOffice : true;
            const matchesSpec = selectedSpec ? doctor.specialization === selectedSpec : true;

            return fullName.includes(searchQuery.toLowerCase()) && matchesSpec && matchesOffice;
        });
    }, [enrichedDoctors, searchQuery, selectedSpec, selectedOffice]);

    if (isLoading) return <div className="page-container"><div className="empty-state">Loading doctors...</div></div>;

    return (
        <div className="doctors-module-wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                {onBack && <button onClick={onBack} className="btn-action">⬅ Назад</button>}
            </div>

            <DoctorsView
                doctors={filteredDoctors} 
                specializations={specializationsForView}
                offices={officeAddressesForView} 
                searchQuery={searchQuery}
                selectedSpec={selectedSpec}
                selectedOffice={selectedOffice}
                onSearchChange={setSearchQuery}
                onSpecChange={setSelectedSpec}
                onOfficeChange={setSelectedOffice}
            />
        </div>
    );
};