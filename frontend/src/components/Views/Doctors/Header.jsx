import React from 'react';

export const Header = ({ onBack, authComponent }) => (
    <div className="header">
        <h1 className="header-title">Our Doctors</h1>
        <button onClick={onBack} className="btn-back">
            ← Return to Main
        </button>
        {authComponent && <div>{authComponent}</div>}
    </div>
);