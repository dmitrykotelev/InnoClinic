import React, { useState } from 'react';
import Authorization from "./components/Authorization/Authorization.jsx";
import { DoctorsModule } from "./components/Views/Doctors/DoctorsModel.jsx";
import { ServicesModule } from "./components/Views/Services/ServicesModule.jsx";
import { EntryView } from "./components/Views/EntryView.jsx";
import './styles/Doctors.css';

const API_BASE_URL = 'http://localhost:5225';

function App() {
    const [currentView, setCurrentView] = useState('main');

    const authComponent = <Authorization apiBaseUrl={API_BASE_URL} />;

    return (
        <div className="app-container">
            {currentView === 'doctors' && (
                <DoctorsModule
                    onBack={() => setCurrentView('main')}
                    authComponent={authComponent}
                />
            )}
            {currentView === 'services' && (
                <ServicesModule
                    onBack={() => setCurrentView('main')}
                    authComponent={authComponent}
                />
            )}

            {currentView === 'main' && (
                <>
                    <div className="auth-wrapper">
                        {authComponent}
                    </div>
                    <div className="menu-container">
                        <EntryView
                            onEnter={() => setCurrentView('doctors')}
                            icon="👨‍⚕️"
                            label="Doctors"
                        />
                        <EntryView
                            onEnter={() => setCurrentView('services')}
                            icon="📋"
                            label="Services"
                        />
                    </div>
                </>
            )}
        </div>
    );
}

export default App;