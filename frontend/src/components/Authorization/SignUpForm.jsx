import React, { useState } from 'react';
import InputField from './InputField.jsx';
import '../../styles/SignIn.css';

const api = {
    checkEmailExists: async (email, apiBaseUrl) => {
        const response = await fetch(`${apiBaseUrl}/Registration/all`)
            .catch(e => console.error(e));

        if (response?.ok) {
            const users = await response.json().catch(() => []);
            return users.some(u => u.email.toLowerCase() === email.toLowerCase());
        }

        return false;
    },

    signUp: async (email, password, apiBaseUrl) => {
        const response = await fetch(`${apiBaseUrl}/Registration/reg`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        }).catch(error => console.error(error));

        return !!response?.ok;
    }
};

const SignUpForm = ({ onGoToSignIn, apiBaseUrl }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rePassword, setRePassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [rePasswordError, setRePasswordError] = useState('');
    const [globalMessage, setGlobalMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleEmailBlur = async () => {
        if (!email) { setEmailError('Please, enter the email'); return; }
        if (!email.includes('@')) { setEmailError("You've entered an invalid email"); return; }

        setEmailError('');
        // Прокидываем URL
        const exists = await api.checkEmailExists(email, apiBaseUrl);
        if (exists) { setEmailError("User with this email already exists"); }
    };

    const handlePasswordBlur = () => {
        if (!password) setPasswordError('Please, enter the password');
        else setPasswordError('');
        if (rePassword && password !== rePassword) setRePasswordError("The passwords you’ve entered don’t coincide");
        else if (rePassword && password === rePassword) setRePasswordError('');
    };

    const handleRePasswordBlur = () => {
        if (!rePassword) setRePasswordError('Please, reenter the password');
        else if (password !== rePassword) setRePasswordError("The passwords you’ve entered don’t coincide");
        else setRePasswordError('');
    };

    const isButtonDisabled =
        !email || !password || !rePassword ||
        !!emailError || !!passwordError || !!rePasswordError ||
        password.length < 6 || password.length > 15 ||
        password !== rePassword;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isButtonDisabled) return;

        setIsLoading(true);
        setGlobalMessage({ type: '', text: '' });

        const exists = await api.checkEmailExists(email, apiBaseUrl);
        if (exists) {
            setGlobalMessage({ type: 'error', text: "Someone already uses this email" });
            setIsLoading(false);
            return;
        }

        const success = await api.signUp(email, password, apiBaseUrl);
        if (success) {
            setGlobalMessage({ type: 'success', text: "Please check your email to confirm signing up." });
        } else {
            setGlobalMessage({ type: 'error', text: "Failed to sign up. Please try again." });
        }
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="auth-form">
            {globalMessage.text && (<div className={`global-message ${globalMessage.type}`}>{globalMessage.text}</div>)}
            <InputField type="text" name="email" placeholder="Enter your email" value={email} onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }} onBlur={handleEmailBlur} error={emailError} />
            <InputField type="password" name="password" placeholder="Enter your password" value={password} onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(''); }} onBlur={handlePasswordBlur} error={passwordError} isPassword={true} />
            <InputField type="password" name="rePassword" label="Repeat entered password" placeholder="Repeat entered password" value={rePassword} onChange={(e) => { setRePassword(e.target.value); if (rePasswordError) setRePasswordError(''); }} onBlur={handleRePasswordBlur} error={rePasswordError} isPassword={true} />
            <button type="submit" className="submit-btn" disabled={isButtonDisabled || isLoading}>{isLoading ? 'Loading...' : 'Sign up'}</button>
            <div className="signup-container">Already have an account?{' '} <span className="signup-link" onClick={onGoToSignIn}>Sign in</span></div>
        </form>
    );
};

export default SignUpForm;