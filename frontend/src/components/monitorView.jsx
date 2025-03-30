import { useEffect, useState } from 'react';
import { GetMonitorsJSON } from '../../wailsjs/go/main/App';

function MonitorsView() {
    const [monitors, setMonitors] = useState([]);
    const [selectedMonitor, setSelectedMonitor] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMonitors = async () => {
            try {
                const json = await GetMonitorsJSON();
                const parsed = JSON.parse(json);
                console.log(parsed);
                setMonitors(parsed);
            } catch (err) {
                console.error('Error parsing monitor data:', err);
                setError('Failed to laod monitors.');
            }
        };
        fetchMonitors();
    }, []);

    const handleMonitorClick = (monitor) => {
        setSelectedMonitor(monitor);
    };

    const generateMonitorLine = (m) => {
        return `monitor=${m.name},${m.width}x${m.height}@${m.refreshRate},${m.x}x${m.y},${m.scale}`;
    };

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div style={{ display: 'flex', gap: '1rem', padding: '2rem' }}>
            {/* Monitor Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 150px)', gap: '1rem' }}>
                {monitors.map((m, idx) => (
                    <div
                        key={idx}
                        onClick={() => handleMonitorClick({ ...m })}
                        style={{
                            color: 'black',
                            border: '2px solid #555',
                            padding: '1rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: selectedMonitor?.name === m.name ? '#d0f0ff' : '#eee',
                        }}
                    >
                        <strong>{m.name}</strong>
                        <p>
                            {m.width}×{m.height}
                        </p>
                        <p>{m.refreshRate}Hz</p>
                    </div>
                ))}
            </div>

            {/* Config Panel */}
            {selectedMonitor && (
                <div style={{ marginLeft: '2rem', flex: '1' }}>
                    <h2>{selectedMonitor.name}</h2>
                    {/* Resolution dropdown */}
                    <label>Mode:</label>
                    <select
                        value={`${selectedMonitor.width}x${selectedMonitor.height}@${selectedMonitor.refreshRate.toFixed(2)}Hz`}
                        onChange={(e) => {
                            const [res, rateStr] = e.target.value.split('@');
                            const [width, height] = res.split('x').map(Number);
                            const refreshRate = parseFloat(rateStr.replace('Hz', ''));
                            setSelectedMonitor((prev) => ({
                                ...prev,
                                width,
                                height,
                                refreshRate,
                            }));
                        }}
                    >
                        {selectedMonitor.availableModes.map((mode, idx) => (
                            <option key={idx} value={mode}>
                                {mode.replace('@', ' @ ')}
                            </option>
                        ))}
                    </select>
                    <br /> {/* Config preview */}
                    <p>
                        <strong>Config Line:</strong>
                    </p>
                    <code>{generateMonitorLine(selectedMonitor)}</code>
                </div>
            )}
        </div>
    );
}

export default MonitorsView;
