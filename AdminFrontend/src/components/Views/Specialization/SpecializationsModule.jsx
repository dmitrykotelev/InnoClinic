import React, { useState, useEffect, useCallback } from 'react';
import '../../../styles/App.css'; 

import { SpecializationsList } from './SpecializationsList';
import { SpecializationDetails } from './SpecializationDetails';
import { ServiceDetails } from './ServiceDetails';
import { CreateSpecialization } from './CreateSpecialization';

const API_BASE_SERVICES = 'https://gateway.inno-clinic.com/api-services';

export const SpecializationsModule = ({ onBack }) => {
    const [specializations, setSpecializations] = useState([]);
    const [categories, setCategories] = useState([]); 
    const [categoriesMap, setCategoriesMap] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedSpec, setSelectedSpec] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [isCreatingSpec, setIsCreatingSpec] = useState(false);

    const handleServiceDeleted = () => {
        setSelectedService(null);
    };

    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        try {
            // ДОБАВЛЕН ТОКЕН (для всех GET запросов)
            const token = localStorage.getItem('accessToken');
            const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

            const [specsRes, categoriesRes] = await Promise.all([
                fetch(`${API_BASE_SERVICES}/Specializations/GetAll`, { headers: authHeader }),
                fetch(`${API_BASE_SERVICES}/ServiceCategories/GetAll`, { headers: authHeader })
            ]);

            if (specsRes.ok) {
                const specsData = await specsRes.json();
                setSpecializations(specsData);
                
                setSelectedSpec(prevSelected => {
                    if (!prevSelected) return null;
                    return specsData.find(s => (s.id ?? s.Id) === (prevSelected.id ?? prevSelected.Id)) || prevSelected;
                });
            }

            if (categoriesRes.ok) {
                const catData = await categoriesRes.json();
                setCategories(catData); 
                const map = {};
                catData.forEach(c => { map[c.id] = c.name; });
                setCategoriesMap(map);
            }
        } catch (err) {
            console.error("Ошибка загрузки данных:", err);
            setError("Failed to load specializations.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleSpecUpdated = () => {
        fetchInitialData();
        setIsCreatingSpec(false);
    };

    const handleServiceUpdated = () => {
        setSelectedService(null);
    };
    
    const handleSpecDeleted = () => {
        setSelectedSpec(null);
        fetchInitialData();
    };

    if (isLoading) return <div className="profile-loader">Loading specializations...</div>;
    if (error) return <div className="profile-error-state"><h3>{error}</h3></div>;

    if (isCreatingSpec) {
        return (
            <CreateSpecialization 
                categories={categories}
                categoriesMap={categoriesMap}
                onBack={() => setIsCreatingSpec(false)}
                onSuccess={handleSpecUpdated}
            />
        );
    }

    if (selectedService) {
        return (
            <ServiceDetails 
                service={selectedService}
                categories={categories} 
                categoriesMap={categoriesMap}
                onBack={() => setSelectedService(null)}
                onServiceUpdated={handleServiceUpdated}
                onServiceDeleted={handleServiceDeleted}
            />
        );
    }

    if (selectedSpec) {
        return (
            <SpecializationDetails 
                spec={selectedSpec}
                categories={categories} 
                categoriesMap={categoriesMap}
                onBack={() => setSelectedSpec(null)}
                onSelectService={setSelectedService}
                onSpecUpdated={handleSpecUpdated} 
                onSpecDeleted={handleSpecDeleted} 
            />
        );
    }

    return (
        <SpecializationsList 
            specializations={specializations}
            onBack={onBack}
            onSelectSpec={setSelectedSpec}
            onCreateSpec={() => setIsCreatingSpec(true)}
        />
    );
};