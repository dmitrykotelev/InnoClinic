import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '../Header';
import '../../../styles/Services.css';

export const ServicesModule = ({ onBack }) => {
    // AC-3: Consultations tab is displayed by default
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
                // Добавляем токен на случай, если эндпоинты закрыты авторизацией
                const token = localStorage.getItem('accessToken');
                const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

                // В некоторых версиях твоего бэкенда GetAll требует POST запрос с пустым телом [].
                // Если стандартный GET отдает ошибку 405, поменяй method на 'POST' и добавь body: JSON.stringify([])
                const [servicesRes, specializationsRes] = await Promise.all([
                    fetch(`http://gateway.inno-clinic.com/api-services/Services/GetAll`, { headers: authHeader }),
                    fetch(`http://gateway.inno-clinic.com/api-services/Specializations/GetAll`, { headers: authHeader })
                ]);

                if (!servicesRes.ok || !specializationsRes.ok) {
                    throw new Error(`HTTP error! Services: ${servicesRes.status}, Specs: ${specializationsRes.status}`);
                }

                const servicesData = await servicesRes.json();
                const specsData = await specializationsRes.json();

                // Защита от пагинации (если бэкенд возвращает объект { items: [...] })
                setAllServices(Array.isArray(servicesData) ? servicesData : (servicesData.items || []));
                setAllSpecializations(Array.isArray(specsData) ? specsData : (specsData.items || []));

            } catch (err) {
                console.error("Failed to fetch data:", err);
                setError("Не удалось загрузить список услуг.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // AC-7: Разделяем сервисы по категориям, учитывая только "Active" статус
    const categorizedServices = useMemo(() => {
        const result = {
            consultations: [],
            diagnostics: [],
            analyses: []
        };

        allServices.forEach(service => {
            // Учитываем разные варианты флагов активности от бэкенда
            const isActiveService = service.isActive === true || service.status === true || service.status === 'Active';
            if (!isActiveService) return;

            const categoryName = (service.category?.name || service.categoryName || '').toLowerCase();
            const categoryId = service.categoryId || service.serviceCategoryId || service.ServiceCategoryId;

            if (categoryName.includes('consultation') || categoryId === 1) {
                result.consultations.push(service);
            } else if (categoryName.includes('diagnostic') || categoryId === 2) {
                result.diagnostics.push(service);
            } else if (categoryName.includes('analys') || categoryId === 3) {
                result.analyses.push(service);
            }
        });

        return result;
    }, [allServices]);

    // AC-4: Группируем консультации по специализациям
    const groupedConsultations = useMemo(() => {
        const activeSpecializationsMap = {};
        
        allSpecializations.forEach(spec => {
            // AC-7: Только активные специализации (исправлена опечатка isActiove)
            const isActiveSpec = spec.isActive === true || spec.status === true || spec.isActiove === true;
            
            if (isActiveSpec) {
                const specId = spec.id ?? spec.Id;
                activeSpecializationsMap[specId] = spec.name ?? spec.Name;
            }
        });

        return categorizedServices.consultations.reduce((acc, curr) => {
            const specId = curr.specializationId ?? curr.SpecializationId;
            const specName = activeSpecializationsMap[specId];

            // Если специализация неактивна или не найдена — пропускаем эту консультацию
            if (!specName) return acc;

            if (!acc[specName]) {
                acc[specName] = [];
            }
            acc[specName].push(curr);
            return acc;
        }, {});
    }, [categorizedServices.consultations, allSpecializations]);

    // Рендер контента вкладок
    const renderContent = () => {
        if (isLoading) return <div className="empty-state">Loading services...</div>;
        if (error) return <div className="empty-state" style={{color: 'red'}}>{error}</div>;

        switch (activeTab) {
            case 'consultations':
                const specializations = Object.entries(groupedConsultations);
                if (specializations.length === 0) return <div className="empty-state">No active consultations found</div>;

                return (
                    <div className="tab-content">
                        {/* AC-4: Список консультаций, сгруппированный по специализациям */}
                        {specializations.map(([specName, services]) => (
                            <div key={specName} className="data-card mb-4" style={{ padding: '20px' }}>
                                <h3 style={{ marginTop: 0, color: 'var(--innowise-red)', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                                    {specName}
                                </h3>
                                <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                                    {services.map(service => (
                                        <li key={service.id ?? service.Id} style={{ padding: '8px 0', borderBottom: '1px dashed var(--border-light)' }}>
                                            {service.name ?? service.serviceName ?? service.ServiceName}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                );
            case 'diagnostics':
                if (categorizedServices.diagnostics.length === 0) return <div className="empty-state">No diagnostic services found</div>;
                return (
                    <div className="tab-content">
                        {/* AC-5: Список диагностики */}
                        <div className="data-card" style={{ padding: '20px' }}>
                            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                                {categorizedServices.diagnostics.map(service => (
                                    <li key={service.id ?? service.Id} style={{ padding: '8px 0', borderBottom: '1px dashed var(--border-light)' }}>
                                        {service.name ?? service.serviceName ?? service.ServiceName}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                );
            case 'analyses':
                if (categorizedServices.analyses.length === 0) return <div className="empty-state">No analyses found</div>;
                return (
                    <div className="tab-content">
                        {/* AC-6: Список анализов */}
                        <div className="data-card" style={{ padding: '20px' }}>
                            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                                {categorizedServices.analyses.map(service => (
                                    <li key={service.id ?? service.Id} style={{ padding: '8px 0', borderBottom: '1px dashed var(--border-light)' }}>
                                        {service.name ?? service.serviceName ?? service.ServiceName}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="page-container">
            <div className="flex-between mb-4">
                <div className="flex-row">
                    {onBack && (
                        <button className="btn btn-text" onClick={onBack}>&larr; Back</button>
                    )}
                    <h2 style={{ margin: 0 }}>Clinic Services</h2>
                </div>
            </div>

            {/* AC-2: 3 вкладки */}
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

            <div className="services-content-wrapper mt-4">
                {renderContent()}
            </div>
        </div>
    );
};