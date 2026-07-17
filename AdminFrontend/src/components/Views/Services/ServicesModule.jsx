import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '../Header';
import "../../../styles/Global.css"

export const ServicesModule = ({ onBack, apiBaseUrl }) => {
    const [activeTab, setActiveTab] = useState('consultations');

    const [allServices, setAllServices] = useState([]);
    const [allSpecializations, setAllSpecializations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const [servicesRes, specializationsRes] = await Promise.all([
                    fetch(`http://gateway.inno-clinic.com/api-services/Services/GetAll`),
                    fetch(`http://gateway.inno-clinic.com/api-services/Specializations/GetAll`)
                ]);

                if (!servicesRes.ok || !specializationsRes.ok) {
                    throw new Error(`HTTP error! Services: ${servicesRes.status}, Specs: ${specializationsRes.status}`);
                }

                const servicesData = await servicesRes.json();
                const specsData = await specializationsRes.json();

                setAllServices(servicesData);
                setAllSpecializations(specsData);

            } catch (err) {
                console.error("Failed to fetch data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [apiBaseUrl]);

    const categorizedServices = useMemo(() => {
        const result = {
            consultations: [],
            diagnostics: [],
            analyses: []
        };

        allServices.forEach(service => {
            const isActiveService = service.isActive === true || service.status === 'Active';

            if (!isActiveService) return;

            const categoryName = (service.category || service.categoryName || '').toLowerCase();
            const categoryId = service.serviceCategoryId;

            if (categoryName === 'consultations' || categoryId === 1) {
                result.consultations.push(service);
            } else if (categoryName === 'diagnostics' || categoryId === 2) {
                result.diagnostics.push(service);
            } else if (categoryName === 'analyses' || categoryId === 3) {
                result.analyses.push(service);
            }
        });

        return result;
    }, [allServices]);

    const groupedConsultations = useMemo(() => {
        const activeSpecializationsMap = {};
        allSpecializations.forEach(spec => {
            if (spec.isActiove) {
                activeSpecializationsMap[spec.id] = spec.name;
            }
        });

        return categorizedServices.consultations.reduce((acc, curr) => {
            const specName = activeSpecializationsMap[curr.specializationId];

            if (!specName) return acc;

            if (!acc[specName]) {
                acc[specName] = [];
            }
            acc[specName].push(curr);
            return acc;
        }, {});
    }, [categorizedServices.consultations, allSpecializations]);

    const renderContent = () => {
        if (isLoading) return <div className="status-message">Loading...</div>;
        if (error) return <div className="status-message error">{error}</div>;

        switch (activeTab) {
            case 'consultations':
                const specializations = Object.entries(groupedConsultations);
                if (specializations.length === 0) return <p className="empty-state">Nothing Founded</p>;

                return (
                    <div className="tab-content">
                        {specializations.map(([specialization, services]) => (
                            <div key={specialization} className="service-group">
                                <h3>{specialization}</h3>
                                <ul>
                                    {services.map(service => (
                                        <li key={service.id}>{service.name}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                );
            case 'diagnostics':
                if (categorizedServices.diagnostics.length === 0) return <p className="empty-state">Nothing Founded</p>;
                return (
                    <div className="tab-content">
                        <ul>
                            {categorizedServices.diagnostics.map(service => (
                                <li key={service.id}>{service.name}</li>
                            ))}
                        </ul>
                    </div>
                );
            case 'analyses':
                if (categorizedServices.analyses.length === 0) return <p className="empty-state">Nothing Founded</p>;
                return (
                    <div className="tab-content">
                        <ul>
                            {categorizedServices.analyses.map(service => (
                                <li key={service.id}>{service.name}</li>
                            ))}
                        </ul>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="page-container">
            <Header onBack={onBack} title="Clinic Services" />

            <div className="tabs-bar">
                <button
                    className={`tab-btn ${activeTab === 'consultations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('consultations')}
                    disabled={isLoading}
                >
                    Consultations
                </button>

                <button
                    className={`tab-btn ${activeTab === 'diagnostics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('diagnostics')}
                    disabled={isLoading}
                >
                    Diagnostics
                </button>

                <button
                    className={`tab-btn ${activeTab === 'analyses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analyses')}
                    disabled={isLoading}
                >
                    Analyses
                </button>
            </div>

            <div className="services-content-wrapper">
                {renderContent()}
            </div>
        </div>
    );
};