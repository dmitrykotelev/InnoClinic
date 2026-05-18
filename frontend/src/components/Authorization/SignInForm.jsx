import React, { useState } from 'react';
import InputField from './InputField.jsx';
import '../../styles/SignIn.css';

const api = {
    signIn: async (email, password, apiBaseUrl) => {
        const params = new URLSearchParams();
        params.append('grant_type', 'password');
        params.append('client_id', 'react_client');
        params.append('username', email);
        params.append('password', password);
        params.append('scope', 'openid profile api_scope offline_access custom_profile');

        const response = await fetch(`${apiBaseUrl}/connect/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        }).catch(error => console.error("Login error:", error));

        if (response?.ok) {
            const data = await response.json().catch(() => ({}));
            console.log("Токены с сервера:", data);
            return {
                success: true,
                token: data.access_token
            };
        }

        return { success: false };
    }
};

const SignInForm = ({ onGoToSignUp, onLoginSuccess, apiBaseUrl }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [globalMessage, setGlobalMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleEmailBlur = () => {
        if (!email) {
            setEmailError('Please, enter the email');
        } else if (!email.includes('@')) {
            setEmailError("You've entered an invalid email");
        } else {
            setEmailError('');
        }
    };

    const handlePasswordBlur = () => {
        if (!password) {
            setPasswordError('Please, enter the password');
        } else {
            setPasswordError('');
        }
    };

    const isButtonDisabled =
        !email || !password ||
        !!emailError || !!passwordError ||
        password.length < 6 || password.length > 15;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isButtonDisabled) return;

        setIsLoading(true);
        setGlobalMessage({ type: '', text: '' });

        const result = await api.signIn(email, password, apiBaseUrl);

        if (result.success && result.token) {
            setGlobalMessage({ type: 'success', text: "You've signed in successfully" });
            setTimeout(() => {
                onLoginSuccess(result.token);
            }, 1000);
        } else {
            setGlobalMessage({ type: 'error', text: "User not found or incorrect password" });
        }

        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="auth-form">
            {globalMessage.text && (
                <div className={`global-message ${globalMessage.type}`}>
                    {globalMessage.text}
                </div>
            )}

            <InputField
                type="text"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                    if (globalMessage.type === 'error') setGlobalMessage({ type: '', text: '' });
                }}
                onBlur={handleEmailBlur}
                error={emailError}
            />

            <InputField
                type="password"
                name="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                    if (globalMessage.type === 'error') setGlobalMessage({ type: '', text: '' });
                }}
                onBlur={handlePasswordBlur}
                error={passwordError}
                isPassword={true}
            />

            <button type="submit" className="submit-btn" disabled={isButtonDisabled || isLoading}>
                {isLoading ? 'Checking...' : 'Sign in'}
            </button>

            <div className="signup-container">
                Don't have an account?{' '}
                <span className="signup-link" onClick={onGoToSignUp}>Sign up</span>
            </div>
        </form>
    );
};

export default SignInForm;