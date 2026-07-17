const API_BASE_URL = 'http://gateway.inno-clinic.com/api-profiles/Profile/Doctor/GetAll';
const IDENTITY_API_DOMAIN = 'http://gateway.inno-clinic.com/api-identity';
const DOCUMENTS_API_DOMAIN = 'http://gateway.inno-clinic.com/api-photos';

export const fetchDoctors = async () => {
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const doctorsWithPhotos = await Promise.all(data.map(async (doc) => {
            let fetchedPhotoUrl = "https://placehold.co/150x150/png";
            let fetchedPhotoId = null;

            if (doc.accountId) {
                try {
                    const photoIdRes = await fetch(`${IDENTITY_API_DOMAIN}/Profile/GetPhotoId?userId=${doc.accountId}`);
                    
                    if (photoIdRes.ok) {
                        const idString = await photoIdRes.text();
                        
                        if (idString && idString !== "null" && idString.trim() !== "") {
                            fetchedPhotoId = idString.trim();
                        }
                    }

                    if (fetchedPhotoId) {
                        const photoRes = await fetch(`${DOCUMENTS_API_DOMAIN}/Photo/GetPhoto/${fetchedPhotoId}`);
                        
                        if (photoRes.ok) {
                            fetchedPhotoUrl = await photoRes.text(); 
                        }
                    }
                } catch (error) {
                    console.error(`Ошибка при загрузке фото для доктора ${doc.id}:`, error);
                }
            }

            return {
                id: doc.id,
                firstName: doc.firstName,
                lastName: doc.lastName,
                middleName: doc.middleName,
                careerStartYear: new Date(doc.careerStartYear).getFullYear(),
                status: doc.status ? 'At work' : 'Fired',
                specializationId: doc.specializationId, 
                officeId: doc.officeId, 
                accountId: doc.accountId,
                
                specialization: `Specialization #${doc.specializationId}`, 
                officeAddress: `Office #${doc.officeId}`, 
                
                photoUrl: fetchedPhotoUrl
            };
        }));

        return doctorsWithPhotos;

    } catch (error) {
        console.error("Fetch error:", error);
        return [];
    }
};