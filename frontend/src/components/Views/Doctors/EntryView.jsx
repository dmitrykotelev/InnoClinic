import React from 'react';
import '../../../styles/Doctors.css';

export const EntryView = ({ onEnter }) => (
    <div className="entry-view">
        <button onClick={onEnter} className="btn-enter">
            <span className="icon-large">👨‍⚕️</span> Doctors
        </button>
    </div>
);