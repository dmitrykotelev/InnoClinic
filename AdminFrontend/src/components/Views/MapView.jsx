import React from 'react';

export const MapView = ({ selectedOffice }) => (
    <div className="map-view">
        <p className="map-placeholder">[map]</p>
        <p className="map-subtitle">{selectedOffice || "All Filters"}</p>
    </div>
);