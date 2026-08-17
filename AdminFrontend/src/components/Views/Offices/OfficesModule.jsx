import React, { useState, useEffect, useCallback } from 'react';
import '../../../styles/App.css'; 

import { OfficesList } from './OfficesList';
import { OfficeDetails } from './OfficeDetails';
import { CreateOffice } from './CreateOffice';

const API_BASE_OFFICES = 'https://gateway.inno-clinic.com/api-offices/Offices';
const API_BASE_PHOTOS = 'https://gateway.inno-clinic.com/api-photos/Photo'; 

export const OfficesModule = ({ onBack }) => {
    const [offices, setOffices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedOffice, setSelectedOffice] = useState(null);
    const [isCreatingOffice, setIsCreatingOffice] = useState(false);

    const fetchOffices = useCallback(async () => {
        setIsLoading(true);
        try {
            // ДОБАВЛЕН ТОКЕН (На случай, если GET-запросы тоже захочешь закрыть в будущем)
            const token = localStorage.getItem('accessToken');
            const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

            const res = await fetch(`${API_BASE_OFFICES}/GetAll`, { headers: authHeader }); 
            if (!res.ok) throw new Error("Failed to load offices");
            
            const rawOffices = await res.json();

            const officesWithPhotos = await Promise.all(rawOffices.map(async (office) => {
                let photoUrl = null;
                const photoId = office.photoId ?? office.PhotoId;

                if (photoId && photoId !== "00000000-0000-0000-0000-000000000000") {
                    try {
                        const photoRes = await fetch(`${API_BASE_PHOTOS}/GetPhoto/${photoId}`, {
                            headers: authHeader
                        });
                        if (photoRes.ok) {
                            const rawUrl = await photoRes.text();
                            photoUrl = rawUrl.replace(/^"|"$/g, ''); 
                        }
                    } catch (e) {
                        console.warn(`Failed to fetch photo for office ${office.id}`);
                    }
                }
                return { ...office, photoUrl };
            }));

            setOffices(officesWithPhotos);

            setSelectedOffice(prev => {
                if (!prev) return null;
                return officesWithPhotos.find(o => (o.id ?? o.Id) === (prev.id ?? prev.Id)) || prev;
            });
            
        } catch (err) {
            console.error("Ошибка загрузки офисов:", err);
            setError("Failed to load offices from server.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOffices();
    }, [fetchOffices]);

    const handleOfficeCreated = () => {
        setIsCreatingOffice(false);
        fetchOffices(); 
    };

    const handleOfficeUpdated = () => {
        fetchOffices();
    };

    const handleOfficeDeleted = () => {
        setSelectedOffice(null);
        fetchOffices();          
    };

    if (isLoading) return <div className="profile-loader">Loading offices...</div>;
    if (error) return <div className="profile-error-state"><h3>{error}</h3></div>;

    if (isCreatingOffice) {
        return (
            <CreateOffice 
                onBack={() => setIsCreatingOffice(false)} 
                onSuccess={handleOfficeCreated} 
            />
        );
    }

    if (selectedOffice) {
        return (
            <OfficeDetails 
                office={selectedOffice}
                onBack={() => setSelectedOffice(null)}
                onOfficeUpdated={handleOfficeUpdated} 
                onOfficeDeleted={handleOfficeDeleted} 
            />
        );
    }

    return (
        <OfficesList 
            offices={offices}
            onBack={onBack}
            onSelectOffice={setSelectedOffice}
            onCreateOffice={() => setIsCreatingOffice(true)} 
        />
    );
};