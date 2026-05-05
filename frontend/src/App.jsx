import React, { useState } from 'react';
import Authorization from "./components/Authorization/Authorization.jsx";
import { DoctorsModule } from "./components/Views/Doctors/DoctorsModel.jsx";
import { EntryView } from "./components/Views/Doctors/EntryView";
import './styles/Doctors.css';

const API_BASE_URL = 'http://localhost:5225';

function App() {
    const [showDoctors, setShowDoctors] = useState(false);
    const authComponent = <Authorization apiBaseUrl={API_BASE_URL} />;

    return (
        <div className="app-container">
            {showDoctors ? (
                <DoctorsModule
                    onBack={() => setShowDoctors(false)}
                    authComponent={authComponent}
                />
            ) : (
                <>
                    <div className="auth-wrapper">
                        {authComponent}
                    </div>
                    <EntryView onEnter={() => setShowDoctors(true)} />
                </>
            )}
        </div>
    );
}

export default App;