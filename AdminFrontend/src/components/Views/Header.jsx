import React from 'react';

export const Header = ({ onBack, authComponent, title }) => (
    <div className="header">
        <h1 className="header-title">{title}</h1>
        <button onClick={onBack} className="btn-back">
            ← Return to Main
        </button>
        {authComponent && <div>{authComponent}</div>}
    </div>
);