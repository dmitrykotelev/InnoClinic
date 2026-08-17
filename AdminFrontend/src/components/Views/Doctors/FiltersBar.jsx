import "../../../styles/Global.css"

export const FiltersBar = ({
    searchQuery, setSearchQuery,
    selectedSpec, setSelectedSpec, specializations,
    selectedOffice, setSelectedOffice, offices,
    viewMap, setViewMap
}) => (
    <div className="filters-bar">
        
        {/* Поиск */}
        <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Search Doctor</label>
            <input
                type="text"
                placeholder="Search by name..."
                className="filter-control"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>

        {/* Специализация */}
        <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Specialization</label>
            <select
                className="filter-control"
                value={selectedSpec}
                onChange={(e) => setSelectedSpec(e.target.value)}
            >
                <option value="">All Specializations</option>
                {specializations.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
        </div>

        {/* Офис */}
        <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Office</label>
            <select
                className="filter-control"
                value={selectedOffice}
                onChange={(e) => setSelectedOffice(e.target.value)}
            >
                <option value="">All Offices</option>
                {offices.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>

        {/* Кнопка карты */}
        <div>
            <button
                onClick={() => setViewMap(!viewMap)}
                className={`btn-map-toggle ${viewMap ? 'active' : 'inactive'}`}
            >
                📍 {viewMap ? 'Hide Map' : 'Offices on the Map'}
            </button>
        </div>
        
    </div>
);