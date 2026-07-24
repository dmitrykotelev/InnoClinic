import React from 'react';

export const FiltersBar = ({
                               searchQuery, setSearchQuery,
                               selectedSpec, setSelectedSpec, specializations,
                               selectedOffice, setSelectedOffice, offices,
                               viewMap, setViewMap
                           }) => (
    <div className="filters-bar">
        <input
            type="text"
            placeholder="Search by name..."
            className="filter-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
            className="filter-select"
            value={selectedSpec}
            onChange={(e) => setSelectedSpec(e.target.value)}
        >
            <option value="">Any Specialization</option>
            {specializations.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        
        <select
            className="filter-select"
            value={selectedOffice}
            onChange={(e) => setSelectedOffice(e.target.value)}
        >
            <option value="">Any Office</option>
            {offices.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        
        <button
            onClick={() => setViewMap(!viewMap)}
            className={`btn-map-toggle ${viewMap ? 'active' : 'inactive'}`}
        >
            📍 {viewMap ? 'Show Map' : 'Offices on the Map'}
        </button>
    </div>
);