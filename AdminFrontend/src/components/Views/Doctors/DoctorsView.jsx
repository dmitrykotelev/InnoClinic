import React, { useState } from "react";
import '../../../styles/Global.css';
import { Header } from "../Header";
import { FiltersBar } from "../FiltersBar";
import { MapView } from "../MapView";
import { DoctorsList } from "./DoctorsList";

export const DoctorsView = (props) => {
    const [viewMap, setViewMap] = useState(false);

    return (
        <div className="page-container">
            <Header onBack={props.onBack} authComponent={props.authComponent} />

            <FiltersBar
                searchQuery={props.searchQuery}
                setSearchQuery={props.onSearchChange}
                selectedSpec={props.selectedSpec}
                setSelectedSpec={props.onSpecChange}
                specializations={props.specializations}
                selectedOffice={props.selectedOffice}
                setSelectedOffice={props.onOfficeChange}
                offices={props.offices}
                viewMap={viewMap}
                setViewMap={setViewMap}
            />

            {viewMap && <MapView selectedOffice={props.selectedOffice} />}

            <DoctorsList 
                doctors={props.doctors} 
                onDeleteDoctor={props.onDeleteDoctor}
            />
        </div>
    );
};