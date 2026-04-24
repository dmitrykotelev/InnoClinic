import React, { useState, useEffect } from 'react';
import AuthModal from './AuthModal';

const Authorization = ({ apiBaseUrl }) => {
    const [isAuthOpen, setIsAuthOpen] = useState(false);

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        const token = localStorage.getItem('app_token');
        console.log("Authorization checking session. Token found:", !!token);

        const isInvalid = !token || token === "undefined" || token === "null";

        if (isInvalid) {
            return clearSessionState();
        }

        try {
            const response = await fetch(`${apiBaseUrl}/connect/userinfo`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const userInfo = await response.json();
                console.log("User info received from server:", userInfo);
                setCurrentUser(userInfo);
                setIsLoggedIn(true);
            } else {
                console.error("Invalid or expired token, server returned:", response.status);
                clearSessionState();
            }
        } catch (error) {
            console.error("Network error while fetching user info:", error);
            clearSessionState();
        }
    };

    const clearSessionState = () => {
        localStorage.removeItem('app_token');
        setIsLoggedIn(false);
        setCurrentUser(null);
    };

    const handleLoginSuccess = (token) => {
        console.log("Authorization received token:", token);

        if (token && token !== "undefined") {
            localStorage.setItem('app_token', token);
            checkSession();
            setIsAuthOpen(false);
        } else {
            console.error("Token is missing or undefined!");
        }
    };

    const handleLogout = () => {
        clearSessionState();
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
                onLoginSuccess={handleLoginSuccess}
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