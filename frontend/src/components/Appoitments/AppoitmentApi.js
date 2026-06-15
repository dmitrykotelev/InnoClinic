const APPOINTMENTS_API_URL = 'http://appointments.inno-clinic.com/Appointments/Add';

export const createAppointment = async (appointmentData, token, currentUserId) => {
    if (!token) {
        throw new Error("Authentication error: No token found.");
    }
    
    const payload = {
        patientId: currentUserId,
        doctorId: appointmentData.doctor.id,
        serviceId: appointmentData.service.id,
        date: appointmentData.date,
        time: `${appointmentData.time}:00`,
        isApproved: false 
    };
    
    const response = await fetch(APPOINTMENTS_API_URL, { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create appointment: ${errorText}`);
    }

    return await response.json(); 
};