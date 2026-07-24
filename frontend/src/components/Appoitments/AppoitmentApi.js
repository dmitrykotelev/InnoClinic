const APPOINTMENTS_API_URL = 'https://gateway.inno-clinic.com/api-appointments/Appointments/Add';
// Предполагаемый эндпоинт для обновления. Проверь свой C# контроллер!
const APPOINTMENTS_UPDATE_API_URL = 'https://gateway.inno-clinic.com/api-appointments/Appointments/Update'; 
const PATIENT_PROFILE_API_URL = 'https://gateway.inno-clinic.com/api-profiles/Profile/Patient/GetByAccId';

const parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;

        // Заменяем символы на стандартные для Base64
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        
        // Магия: добавляем знаки "=", чтобы длина строки делилась на 4
        const pad = base64.length % 4;
        if (pad) {
            if (pad === 1) throw new Error('Invalid Base64 length');
            base64 += new Array(5 - pad).join('=');
        }

        // Декодируем
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Ошибка при парсинге токена:", e);
        return null;
    }
};

// Скрытая утилита для получения ID пациента
// Скрытая утилита для получения ID пациента
const getNumericPatientId = async (token) => {
    if (!token) {
        throw new Error("Токен отсутствует в localStorage. Вы точно вошли в систему?");
    }

    const decodedToken = parseJwt(token);
    
    if (!decodedToken) {
        console.error("Сломанный токен:", token);
        throw new Error("Не удалось расшифровать JWT токен. Проверьте консоль.");
    }

    console.log("Decoded JWT Token:", decodedToken); 

    const accountId = decodedToken?.sub 
        || decodedToken?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
        || decodedToken?.nameid
        || decodedToken?.uid 
        || decodedToken?.id 
        || decodedToken?.Id 
        || decodedToken?.UserId 
        || decodedToken?.userId
        || decodedToken?.AccountId
        || decodedToken?.accountId;

    if (!accountId) {
        console.error("Не удалось найти ID. Доступные поля:", Object.keys(decodedToken));
        throw new Error("Failed to extract Account ID from the token.");
    }
    
    const profileRes = await fetch(`${PATIENT_PROFILE_API_URL}?accountId=${accountId}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
    });

    if (!profileRes.ok) throw new Error("Patient profile not found.");
    const profileData = await profileRes.json();
    return profileData.id ?? profileData.Id; 
};

// --- СОЗДАНИЕ ПРИЕМА ---
export const createAppointment = async (appointmentData) => {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error("Authentication error: No token found.");
    
    const numericPatientId = await getNumericPatientId(token);

    const payload = {
        patientId: numericPatientId,
        doctorId: appointmentData.doctor.id,
        serviceId: appointmentData.service.id,
        date: appointmentData.date,
        data: appointmentData.date, 
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

// --- ПЕРЕНОС (ОБНОВЛЕНИЕ) ПРИЕМА ---
export const rescheduleAppointment = async (appointmentId, appointmentData) => {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error("Authentication error: No token found.");
    
    const numericPatientId = await getNumericPatientId(token);

    const payload = {
        id: appointmentId, // Передаем ID изменяемого приема
        patientId: numericPatientId,
        doctorId: appointmentData.doctor.id,
        serviceId: appointmentData.service.id,
        date: appointmentData.date, 
        data: appointmentData.date, 
        time: `${appointmentData.time}:00`,
        isApproved: false // Перенос сбрасывает статус подтверждения
    };
    
    const response = await fetch(APPOINTMENTS_UPDATE_API_URL, { 
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
        throw new Error(`Failed to reschedule appointment: ${errorText}`);
    }
    // Если бэкенд при PUT возвращает 204 No Content, response.json() упадет. Проверяем:
    return response.status === 204 ? null : await response.json().catch(() => null); 
};