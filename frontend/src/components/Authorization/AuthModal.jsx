import React, { useState, useEffect } from 'react';
import SignInForm from './SignInForm.jsx';
import SignUpForm from './SignUpForm.jsx';
import '../../styles/SignIn.css';

const AuthModal = ({ isOpen, onClose, onLoginSuccess, apiBaseUrl }) => {
    const [currentView, setCurrentView] = useState('signIn');

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => setCurrentView('signIn'), 200);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>

                {currentView === 'signIn' ? (
                    <>
                        <h2 className="modal-title">Sign In</h2>
                        <SignInForm
                            onGoToSignUp={() => setCurrentView('signUp')}
                            onLoginSuccess={onLoginSuccess}
                            apiBaseUrl={apiBaseUrl}
                        />
                    </>
                ) : (
                    <>
                        <h2 className="modal-title">Sign Up</h2>
                        <SignUpForm
                            onGoToSignIn={() => setCurrentView('signIn')}
                            apiBaseUrl={apiBaseUrl}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthModal;