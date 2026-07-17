import React, { useState, useEffect } from 'react';
import AuthModal from './AuthModal.jsx';

const Authorization = ({ apiBaseUrl, isLoggedIn, currentUser, onLoginSuccess, onLogout, forceOpen, onClose }) => {
    const [isAuthOpen, setIsAuthOpen] = useState(false);

    useEffect(() => {
        if (forceOpen) {
            setIsAuthOpen(true);
        }
    }, [forceOpen]);

    const handleCloseModal = () => {
        setIsAuthOpen(false);
        if (onClose) onClose();
    };

    const handleSuccess = (token) => {
        handleCloseModal();
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
                onClose={handleCloseModal}
                onLoginSuccess={handleSuccess}
                apiBaseUrl={apiBaseUrl}
            />

            <header style={{ padding: '10px', maxWidth: '600px', margin: '0 auto' }}>
    {isLoggedIn && currentUser ? (
        <div>
            <h2 style={{ color: 'black', fontWeight: 'bold', fontSize: '18px', margin: '0 0 10px 0' }}>
                Hello, {displayName}!
            </h2>

            
        </div>
    ) : (
        <span style={{ color: 'gray', fontSize: '14px' }}>Not logged in</span>
    )}
</header>
        </div>
    );
};

export default Authorization;