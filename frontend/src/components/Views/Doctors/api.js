const API_BASE_URL = 'https://localhost:7046/Profile/Doctor/GetAll';

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

        return data.map(doc => ({
            id: doc.id,
            firstName: doc.firstName,
            lastName: doc.lastName,
            middleName: doc.middleName,

            photo: doc.photoUrl || 'https://placehold.co/150x150/png',

            careerStartYear: new Date(doc.careerStartYear).getFullYear(),

            specialization: doc.specializationName || `Specialization #${doc.specializationId}`,
            officeAddress: doc.officeName || `Office #${doc.officeId}`,

            status: doc.status ? 'At work' : 'On leave'
        }));

    } catch (error) {
        console.error( error);
        return [];
    }
};