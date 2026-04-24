import React, { useState } from 'react';
import '../styles/SignIn.css';

const InputField = ({
                        label, type, name, placeholder, value, onChange, onBlur, error, isPassword
                    }) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    let inputClasses = 'input-field';
    if (error) inputClasses += ' has-error';
    if (isPassword) inputClasses += ' is-password';

    return (
        <div className="input-group">
            {label && <label className="input-label">{label}</label>}

            <div className="input-wrapper">
                <input
                    type={inputType}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    className={inputClasses}
                />

                {isPassword && (
                    <button
                        type="button"
                        className="eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? "Show Password" : "Hide Password"}
                    >
                        {showPassword ? '👁̸' : '👁️'}
                    </button>
                )}
            </div>

            {error && <span className="error-text">{error}</span>}
        </div>
    );
};

export default InputField;