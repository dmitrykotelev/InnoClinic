import React from 'react';
import '../../styles/Doctors.css';

export const EntryView = ({ onEnter, icon, label }) => (
    <div className="entry-view">
        <button onClick={onEnter} className="btn-enter">
            <span className="icon-large">{icon}</span> {label}
        </button>
    </div>
);