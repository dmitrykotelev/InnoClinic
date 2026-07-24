const API_BASE_URL = 'https://gateway.inno-clinic.com/api-profiles/Profile/Doctor/GetAll';
const AUTH_API_URL = 'https://gateway.inno-clinic.com/api-identity/Profile'; 
const PHOTOS_API_URL = 'https://gateway.inno-clinic.com/api-photos/Photo';

export const fetchDoctors = async () => {
    try {
        const token = localStorage.getItem('accessToken');
        const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

        // 1. Делаем POST запрос с пустым массивом фильтров
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader
            },
            body: JSON.stringify([]) 
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawDoctors = await response.json();

        // 2. Параллельно подтягиваем фотографии для каждого доктора
        const enrichedWithPhotos = await Promise.all(rawDoctors.map(async (doc) => {
            let finalPhotoUrl = null;
            
            try {
                const targetUserId = doc.accountId || doc.AccountId || doc.id;
                
                if (targetUserId) {
                    const photoIdRes = await fetch(`${AUTH_API_URL}/GetPhotoId?userId=${targetUserId}`, { headers: authHeader });
                    
                    if (photoIdRes.ok) {
                        let photoId = await photoIdRes.text();
                        photoId = photoId.replace(/^"|"$/g, '');
                        
                        if (photoId && photoId !== "null" && photoId !== "00000000-0000-0000-0000-000000000000") {
                            const photoUrlRes = await fetch(`${PHOTOS_API_URL}/GetPhoto/${photoId}`, { headers: authHeader });
                            if (photoUrlRes.ok) {
                                finalPhotoUrl = (await photoUrlRes.text()).replace(/^"|"$/g, '');
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn(`Не удалось загрузить фото для доктора ${doc.id}`);
            }

            // Возвращаем ЧИСТЫЕ данные с бэкенда без текстовых заглушек
            return {
                ...doc,
                id: doc.id ?? doc.Id,
                firstName: doc.firstName ?? doc.FirstName,
                lastName: doc.lastName ?? doc.LastName,
                middleName: doc.middleName ?? doc.MiddleName,
                specializationId: doc.specializationId ?? doc.SpecializationId,
                officeId: doc.officeId ?? doc.OfficeId,
                careerStartYear: doc.careerStartYear ?? doc.CareerStartYear,
                status: doc.status,
                photoUrl: finalPhotoUrl 
            };
        }));

        return enrichedWithPhotos;

    } catch (error) {
        console.error("Ошибка в fetchDoctors:", error);
        return [];
    }
};