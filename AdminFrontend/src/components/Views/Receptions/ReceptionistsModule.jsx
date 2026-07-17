import React, { useState, useEffect, useCallback } from 'react';
import '../../../styles/App.css'; 

import { ReceptionistsList } from './ReceptionistsList';
import { ReceptionistDetails } from './ReceptionistDetails';
import { CreateReceptionistModal } from './CreateReceptionistModal';

const API_BASE_PROFILES = 'http://gateway.inno-clinic.com/api-profiles/Profile/Reception';
const API_BASE_OFFICES = 'http://gateway.inno-clinic.com/api-offices/Offices';
const API_BASE_PHOTOS = 'http://gateway.inno-clinic.com/api-photos/Photo';
const API_BASE_ACCOUNTS = 'http://gateway.inno-clinic.com/api-identity/Profile'; 

export const ReceptionistsModule = ({ onBack }) => {
    const [receptionists, setReceptionists] = useState([]);
    const [officesMap, setOfficesMap] = useState({});
    const [officesArray, setOfficesArray] = useState([]); 
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedReceptionist, setSelectedReceptionist] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        try {
            // ДОБАВЛЕН ТОКЕН
            const token = localStorage.getItem('accessToken');
            const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

            const [profilesRes, officesRes] = await Promise.all([
                fetch(`${API_BASE_PROFILES}/GetAll`, { headers: authHeader }), 
                fetch(`${API_BASE_OFFICES}/GetAll`, { headers: authHeader })
            ]);

            if (!profilesRes.ok) throw new Error("Failed to load profiles");
            const profilesData = await profilesRes.json();

            if (officesRes.ok) {
                const offData = await officesRes.json();
                setOfficesArray(offData);
                const map = {};
                offData.forEach(o => { 
                    map[o.id ?? o.Id] = o.adress ?? o.address ?? o.Adress ?? 'Unknown'; 
                });
                setOfficesMap(map);
            }

            const enrichedReceptionists = await Promise.all(profilesData.map(async (profile) => {
                let photoUrl = null;
                let email = null; 
                
                const accountId = profile.accountId ?? profile.AccountId;

                if (accountId) {
                    try {
                        const accRes = await fetch(`${API_BASE_ACCOUNTS}/GetPhotoId?userId=${accountId}`, { headers: authHeader });
                        
                        if (accRes.ok) {
                            let photoId = await accRes.text();
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
                        console.warn(`Failed to fetch photoId for AccountId: ${accountId}`);
                    }
                }

                return { 
                    ...profile, 
                    email: email || profile.email,
                    photoUrl 
                };
            }));

            setReceptionists(enrichedReceptionists);

            setSelectedReceptionist(prev => {
                if (!prev) return null;
                return enrichedReceptionists.find(r => (r.id ?? r.Id) === (prev.id ?? prev.Id)) || prev;
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

    const handleDeleteReceptionist = async (id) => {
        try {
            // ДОБАВЛЕН ТОКЕН ДЛЯ УДАЛЕНИЯ
            const token = localStorage.getItem('accessToken');
            const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

            const receptionistToDelete = receptionists.find(r => (r.id ?? r.Id) === id);
            if (!receptionistToDelete) throw new Error("Receptionist not found.");

            const accountId = receptionistToDelete.accountId ?? receptionistToDelete.AccountId;

            const profileRes = await fetch(`${API_BASE_PROFILES}/${id}`, { 
                method: 'DELETE',
                headers: authHeader
            });
            if (!profileRes.ok) {
                const errText = await profileRes.text();
                throw new Error(`Failed to delete profile: ${errText}`);
            }

            if (accountId) {
                const accountRes = await fetch(`${API_BASE_ACCOUNTS}/${accountId}`, { 
                    method: 'DELETE',
                    headers: authHeader
                });
                if (!accountRes.ok) {
                    console.warn(`Профиль удален, но аккаунт ${accountId} удалить не удалось.`);
                }
            }

            fetchInitialData(); 

        } catch (err) {
            alert("Delete Error: " + err.message);
        }
    };

    if (isLoading) return <div className="profile-loader">Loading receptionists...</div>;
    if (error) return <div className="profile-error-state"><h3>{error}</h3></div>;

    if (selectedReceptionist) {
        return (
            <ReceptionistDetails 
                receptionist={selectedReceptionist}
                officesMap={officesMap}
                officesArray={officesArray} 
                onBack={() => setSelectedReceptionist(null)}
                onUpdated={() => fetchInitialData()} 
            />
        );
    }

    return (
        <>
            <ReceptionistsList 
                receptionists={receptionists}
                officesMap={officesMap}
                onBack={onBack}
                onSelectReceptionist={setSelectedReceptionist}
                onCreateReceptionist={() => setIsModalOpen(true)} 
                onDeleteReceptionist={handleDeleteReceptionist}
            />

            <CreateReceptionistModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleCreatedSuccess}
                offices={officesArray}
            />
        </>
    );
};