import React, { useState } from 'react';
import '../../styles/Global.css';

const api = {
    signIn: async (email, password, apiBaseUrl) => {
        const params = new URLSearchParams();
        params.append('grant_type', 'password');
        params.append('client_id', 'react_admin_client');
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

    // ИСПРАВЛЕНО: убрали жесткий лимит password.length > 15
    const isButtonDisabled = !email || !password || !!emailError || !!passwordError || password.length < 4;

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
        <form onSubmit={handleSubmit}>
            {globalMessage.text && (
                <div 
                    className={`badge ${globalMessage.type === 'error' ? 'badge-error' : 'badge-success'} mb-4`} 
                    style={{ display: 'block', textAlign: 'center', padding: '10px', fontSize: '14px' }}
                >
                    {globalMessage.text}
                </div>
            )}

            <div className="form-group">
                <label>Email *</label>
                <input
                    type="email"
                    name="email"
                    className={`form-control ${emailError ? 'is-invalid' : ''}`}
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                        if (globalMessage.type === 'error') setGlobalMessage({ type: '', text: '' });
                    }}
                    onBlur={handleEmailBlur}
                />
                {emailError && <span className="error-msg">{emailError}</span>}
            </div>

            <div className="form-group mb-4">
                <label>Password *</label>
                <input
                    type="password"
                    name="password"
                    className={`form-control ${passwordError ? 'is-invalid' : ''}`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                        if (globalMessage.type === 'error') setGlobalMessage({ type: '', text: '' });
                    }}
                    onBlur={handlePasswordBlur}
                />
                {passwordError && <span className="error-msg">{passwordError}</span>}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isButtonDisabled || isLoading}>
                {isLoading ? 'Checking...' : 'Sign in'}
            </button>
        </form>
    );
};

export default SignInForm;