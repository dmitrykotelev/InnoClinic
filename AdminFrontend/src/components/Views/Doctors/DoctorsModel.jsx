import React, { useState, useEffect, useMemo } from 'react';
import { fetchDoctors } from './api';
import { DoctorsView } from './DoctorsView';
import { CreateDoctorModal } from './CreateDoctorModal';

const OFFICES_API_DOMAIN = 'https://gateway.inno-clinic.com/api-offices';
const SPECS_API_DOMAIN = 'https://gateway.inno-clinic.com/api-services';
const DOCTORS_API_DOMAIN = 'https://gateway.inno-clinic.com/api-profiles'; 
const IDENTITY_API_DOMAIN = 'https://gateway.inno-clinic.com/api-identity';
const DOCUMENTS_API_DOMAIN = 'http://documents.inno-clinic.com';

export const DoctorsModule = ({ onBack, userRole = 'Receptionist' }) => {
    const [doctors, setDoctors] = useState([]);
    const [officesData, setOfficesData] = useState([]); 
    const [specsData, setSpecsData] = useState([]);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpec, setSelectedSpec] = useState('');
    const [selectedOffice, setSelectedOffice] = useState(''); 
    const [isLoading, setIsLoading] = useState(true);
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

    if (isLoading) return <div className="loader-container">Loading</div>;

    const handleDeleteDoctor = async (doctorId, accountId) => {
    try {
        const token = localStorage.getItem('accessToken'); 

        const authHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const [profileResponse, accountResponse] = await Promise.all([
            fetch(`${DOCTORS_API_DOMAIN}/Profile/Doctor/${doctorId}`, {
                method: 'DELETE',
                headers: authHeaders 
            }),
            fetch(`${IDENTITY_API_DOMAIN}/Profile/${accountId}`, { 
                method: 'DELETE',
                headers: authHeaders 
            })
        ]);

        if (profileResponse.ok && accountResponse.ok) {
            loadData();
        } else {
            if (!profileResponse.ok && !accountResponse.ok) {
                alert('Ошибка: Не удалось удалить ни профиль, ни аккаунт доктора.');
            } else if (!profileResponse.ok) {
                alert('Внимание: Аккаунт удален, но произошла ошибка при удалении профиля доктора.');
                loadData();
            } else if (!accountResponse.ok) {
                alert('Внимание: Профиль удален, но произошла ошибка при удалении аккаунта.');
                loadData();
            }
        }
    } catch (error) {
        console.error("Ошибка при отправке DELETE запросов:", error);
        alert("Произошла ошибка сети при попытке удаления.");
    }
};

    if (isLoading) return <div className="loader-container">Loading</div>;

    return (
        <div className="doctors-module-wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <button onClick={onBack} className="btn-action">⬅ Назад</button>
                
                {userRole === 'receptionist' && (
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        ➕ Create doctor
                    </button>
                )}
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
                onDeleteDoctor={handleDeleteDoctor} 
            />

            <CreateDoctorModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)}
                onDoctorCreated={loadData} 
            />
        </div>
    );
};