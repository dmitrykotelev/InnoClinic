import React, { useState } from 'react';
import AuthModal from './AuthModal.jsx';

const Authorization = ({ apiBaseUrl, isLoggedIn, currentUser, onLoginSuccess, onLogout }) => {
    const [isAuthOpen, setIsAuthOpen] = useState(false);

    const handleSuccess = (token) => {
        setIsAuthOpen(false);
        onLoginSuccess(token);
    };

    const handleLogout = () => {
        onLogout();
        console.log("Local logout successful");
    };

    const displayName = currentUser?.UserName
        || currentUser?.preferred_username
        || currentUser?.given_name
        || "User";

    return (
        <div className="authorization-wrapper">
            <div className="auth-header-section">
                <div className="buttons-row">
                    {isLoggedIn ? (
                        <button className="trigger-btn" onClick={handleLogout}>Sign out</button>
                    ) : (
                        <button className="trigger-btn" onClick={() => setIsAuthOpen(true)}>Sign in</button>
                    )}
                </div>
            </div>

            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                onLoginSuccess={handleSuccess}
                apiBaseUrl={apiBaseUrl}
            />

            <header style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
                {isLoggedIn && currentUser ? (
                    <div>
                        <h2 style={{ color: 'white', fontWeight: 'bold' }}>
                            Hello, {displayName}!
                        </h2>

                        <div style={{
                            marginTop: '20px',
                            backgroundColor: '#1e1e1e',
                            padding: '15px',
                            borderRadius: '8px',
                            border: '1px solid #333',
                            textAlign: 'left',
                            overflowX: 'auto'
                        }}>
                            <h3 style={{ color: '#888', marginTop: 0, fontSize: '14px', textTransform: 'uppercase' }}>
                                Данные профиля (UserInfo):
                            </h3>
                            <pre style={{ color: '#4caf50', fontSize: '14px', margin: 0 }}>
                                {JSON.stringify(currentUser, null, 4)}
                            </pre>
                        </div>
                    </div>
                ) : (
                    <span style={{ color: 'gray' }}>Not logged in</span>
                )}
            </header>
        </div>
    );
};

export default Authorization;