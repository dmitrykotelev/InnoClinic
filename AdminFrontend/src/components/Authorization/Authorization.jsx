import React, { useState, useEffect } from 'react';
import AuthModal from './AuthModal.jsx';

const Authorization = ({ apiBaseUrl, isLoggedIn, currentUser, onLoginSuccess, onLogout, forceOpen, onClose, unclosable }) => {
    const [isAuthOpen, setIsAuthOpen] = useState(false);

    useEffect(() => {
        if (forceOpen) {
            setIsAuthOpen(true);
        }
    }, [forceOpen]);

    const handleCloseModal = () => {
        if (unclosable) return; 
        
        setIsAuthOpen(false);
        if (onClose) onClose();
    };

    const handleSuccess = (token) => {
        setIsAuthOpen(false);
        if (onClose) onClose();
        onLoginSuccess(token);
    };

    const handleLogout = () => {
        onLogout();
        console.log("Local logout successful");
    };

    return (
        <div style={{ display: 'inline-block' }}>
            <div className="flex-end">
                {isLoggedIn ? (
                    <button className="btn btn-secondary" onClick={handleLogout}>Sign out</button>
                ) : (
                    <button className="btn btn-primary" onClick={() => setIsAuthOpen(true)}>Sign in</button>
                )}
            </div>

            <AuthModal
                isOpen={isAuthOpen}
                onClose={handleCloseModal}
                onLoginSuccess={handleSuccess}
                apiBaseUrl={apiBaseUrl}
                unclosable={unclosable}
            />
        </div>
    );
};

export default Authorization;