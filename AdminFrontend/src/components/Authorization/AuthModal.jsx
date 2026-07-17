import React, { useState, useEffect } from 'react';
import SignInForm from './SignInForm.jsx';
import '../../styles/Global.css';

const AuthModal = ({ isOpen, onClose, onLoginSuccess, apiBaseUrl, unclosable }) => {
    const [currentView, setCurrentView] = useState('signIn');

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => setCurrentView('signIn'), 200);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay top-tier" onClick={unclosable ? undefined : onClose}>
            <div className="modal-card sm" onClick={(e) => e.stopPropagation()}>
                
                <div className="flex-between mb-4">
                    <h2 style={{ margin: 0 }}>Sign In</h2>
                    {!unclosable && (
                        <button className="btn btn-text" style={{ fontSize: '24px', padding: '0 10px', color: 'var(--text-muted)' }} onClick={onClose}>
                            &times;
                        </button>
                    )}
                </div>

                <SignInForm
                    onGoToSignUp={() => setCurrentView('signUp')}
                    onLoginSuccess={onLoginSuccess}
                    apiBaseUrl={apiBaseUrl}
                />

            </div>
        </div>
    );
};

export default AuthModal;