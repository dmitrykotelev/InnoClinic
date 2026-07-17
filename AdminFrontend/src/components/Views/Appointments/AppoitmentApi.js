const APPOINTMENTS_API_URL = 'http://gateway.inno-clinic.com/api-appointments/Appointments/Add';

export const createAppointment = async (appointmentData, currentUserId) => {
    const payload = {
        patientId: appointmentData.patient.id ?? appointmentData.patient.Id,
        doctorId: appointmentData.doctor.id,
        serviceId: appointmentData.service.id,
        date: appointmentData.date,
        time: `${appointmentData.time}:00`,
        isApproved: false 
    };
    
    // ДОБАВЛЕН ТОКЕН
    const token = localStorage.getItem('accessToken');

    const response = await fetch(APPOINTMENTS_API_URL, { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}) // Инжектим токен
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create appointment: ${errorText}`);
    }

    return await response.json(); 
};