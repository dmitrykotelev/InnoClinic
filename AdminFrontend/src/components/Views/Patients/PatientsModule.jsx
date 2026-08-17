import React, { useState, useEffect, useCallback } from 'react';
import '../../../styles/App.css'; 

import { PatientsList } from './PatientsList';
import { PatientDetails } from './PatientDetails';
import { CreatePatientModal } from './CreatePatientModal';

const API_BASE_PROFILES = 'https://gateway.inno-clinic.com/api-profiles/Profile/Patient';
const API_BASE_PHOTOS = 'https://gateway.inno-clinic.com/api-photos/photo';
const API_BASE_IDENTITY = 'https://gateway.inno-clinic.com/api-identity/Profile'; 

export const PatientsModule = ({ onBack }) => {
    const [patients, setPatients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);

    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        try {
            // ДОБАВЛЕН ТОКЕН ОДИН РАЗ ДЛЯ ВСЕХ GET ЗАПРОСОВ
            const token = localStorage.getItem('accessToken');
            const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

            const res = await fetch(`${API_BASE_PROFILES}/GetAll`, { headers: authHeader });
            if (!res.ok) throw new Error("Failed to load patients");
            
            const data = await res.json();

            const enrichedPatients = await Promise.all(data.map(async (profile) => {
                let photoUrl = null;
                let phoneNumber = 'N/A';
                const accountId = profile.accountId ?? profile.AccountId;

                if (accountId) {
                    try {
                        const [photoIdRes, phoneRes] = await Promise.all([
                            fetch(`${API_BASE_IDENTITY}/GetPhotoId?userId=${accountId}`, { headers: authHeader }),
                            fetch(`${API_BASE_IDENTITY}/GetPhoneNumber?userId=${accountId}`, { headers: authHeader })
                        ]);

                        if (phoneRes.ok) {
                            const rawPhone = await phoneRes.text();
                            const cleanedPhone = rawPhone.replace(/^"|"$/g, '');
                            if (cleanedPhone) phoneNumber = cleanedPhone;
                        }

                        if (photoIdRes.ok) {
                            let photoId = await photoIdRes.text();
                            photoId = photoId.replace(/^"|"$/g, '');

                            if (photoId && photoId !== "null" && photoId !== "00000000-0000-0000-0000-000000000000") {
                                const photoRes = await fetch(`${API_BASE_PHOTOS}/GetPhoto/${photoId}`, { headers: authHeader });
                                if (photoRes.ok) {
                                    const rawUrl = await photoRes.text();
                                    photoUrl = rawUrl.replace(/^"|"$/g, ''); 
                                }
                            }
                        }
                    } catch (e) {
                        console.warn(`Failed to fetch extra data for AccountId: ${accountId}`);
                    }
                }

                return { ...profile, photoUrl, phoneNumber };
            }));

            setPatients(enrichedPatients);

            setSelectedPatient(prev => {
                if (!prev) return null;
                return enrichedPatients.find(p => (p.id ?? p.Id) === (prev.id ?? prev.Id)) || prev;
            });
            
        } catch (err) {
            console.error(err);
            setError("Failed to load data from server.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleCreatedSuccess = () => {
        setIsModalOpen(false); 
        fetchInitialData(); 
    };

    const handleDeletePatient = async (id) => {
        try {
            // ДОБАВЛЕН ТОКЕН ДЛЯ УДАЛЕНИЯ
            const token = localStorage.getItem('accessToken');
            const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

            const patientToDelete = patients.find(p => (p.id ?? p.Id) === id);
            if (!patientToDelete) throw new Error("Patient not found.");
            const accountId = patientToDelete.accountId ?? patientToDelete.AccountId;

            const profileRes = await fetch(`${API_BASE_PROFILES}/${id}`, { 
                method: 'DELETE',
                headers: authHeader
            });
            if (!profileRes.ok) throw new Error("Failed to delete profile");

            if (accountId) {
                await fetch(`${API_BASE_IDENTITY}/Patient/${accountId}`, { 
                    method: 'DELETE',
                    headers: authHeader
                }).catch(console.warn);
            }

            fetchInitialData();
        } catch (err) {
            alert("Error deleting patient: " + err.message);
        }
    };

    if (isLoading) return <div className="profile-loader">Loading patients...</div>;
    if (error) return <div className="profile-error-state"><h3>{error}</h3></div>;

    if (selectedPatient) {
        return (
            <PatientDetails 
                patient={selectedPatient}
                onBack={() => setSelectedPatient(null)}
                onUpdated={() => fetchInitialData()} 
            />
        );
    }

    return (
        <>
            <PatientsList 
                patients={patients}
                onBack={onBack}
                onSelectPatient={setSelectedPatient}
                onCreatePatient={() => setIsModalOpen(true)} 
                onDeletePatient={handleDeletePatient}
            />

            <CreatePatientModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleCreatedSuccess}
            />
        </>
    );
};