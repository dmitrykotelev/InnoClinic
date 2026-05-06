import React from 'react';
import Authorization from "./components/Authorization.jsx";

const API_BASE_URL = 'http://localhost:5225';

function App() {
    return (
        <div className="app-container">
            <Authorization apiBaseUrl={API_BASE_URL} />
        </div>
    );
}

export default App;