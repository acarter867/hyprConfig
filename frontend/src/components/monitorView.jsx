import { useEffect, useState, useRef } from 'react';
import { GetMonitorsJSON, WriteMonitorConfig } from '../../wailsjs/go/main/App';

function MonitorsCanvas({ monitors, selected, onSelect, onMove }) {
    const [dragging, setDragging] = useState(null); // { name, offsetX, offsetY }
    const canvasRef = useRef(null);

    const canvasWidth = 1200;
    const canvasHeight = 700;

    const bounds = monitors.reduce(
        (acc, m) => ({
            minX: Math.min(acc.minX, m.x),
            minY: Math.min(acc.minY, m.y),
            maxX: Math.max(acc.maxX, m.x + m.width),
            maxY: Math.max(acc.maxY, m.y + m.height),
        }),
        { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
    );
    const PADDING = 600; // space in pixels (in monitor coordinate space)

    const paddedBounds = {
        minX: bounds.minX - PADDING,
        minY: bounds.minY - PADDING,
        maxX: bounds.maxX + PADDING,
        maxY: bounds.maxY + PADDING,
    };

    const scaleX = canvasWidth / (paddedBounds.maxX - paddedBounds.minX);
    const scaleY = canvasHeight / (paddedBounds.maxY - paddedBounds.minY);
    const scale = Math.min(scaleX, scaleY);

    const SNAP_DISTANCE = 800;

    const snapPosition = (name, rawX, rawY) => {
        let snappedX = rawX;
        let snappedY = rawY;

        const draggedMonitor = monitors.find((m) => m.name === name);
        if (!draggedMonitor) return { snappedX, snappedY };

        monitors.forEach((other) => {
            if (other.name === name) return;

            const otherRight = other.x + other.width;
            const otherBottom = other.y + other.height;

            // Snap left edge to right edge
            if (Math.abs(rawX - otherRight) < SNAP_DISTANCE) {
                snappedX = otherRight;
            }

            // Snap right edge to left edge
            if (Math.abs(rawX + draggedMonitor.width - other.x) < SNAP_DISTANCE) {
                snappedX = other.x - draggedMonitor.width;
            }

            // Snap top edge to bottom edge
            if (Math.abs(rawY - otherBottom) < SNAP_DISTANCE) {
                snappedY = otherBottom;
            }

            // Snap bottom edge to top edge
            if (Math.abs(rawY + draggedMonitor.height - other.y) < SNAP_DISTANCE) {
                snappedY = other.y - draggedMonitor.height;
            }

            // Align tops
            if (Math.abs(rawY - other.y) < SNAP_DISTANCE) {
                snappedY = other.y;
            }

            // Align lefts
            if (Math.abs(rawX - other.x) < SNAP_DISTANCE) {
                snappedX = other.x;
            }
        });

        return { snappedX, snappedY };
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!dragging) return;

            const canvasRect = canvasRef.current.getBoundingClientRect();
            const offsetX = e.clientX - canvasRect.left - dragging.offsetX;
            const offsetY = e.clientY - canvasRect.top - dragging.offsetY;

            const rawX = Math.round(offsetX / scale + paddedBounds.minX);
            const rawY = Math.round(offsetY / scale + paddedBounds.minY);

            const { snappedX, snappedY } = snapPosition(dragging.name, rawX, rawY);
            onMove(dragging.name, snappedX, snappedY);
        };

        const handleMouseUp = () => {
            setDragging(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, scale, bounds, monitors]);

    return (
        <div
            ref={canvasRef}
            style={{
                position: 'relative',
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                border: '2px dashed gray',
                background: '#fdfdfd',
                marginBottom: '2rem',
                marginLeft: 'auto',
                marginRight: 'auto',
            }}
        >
            {monitors.map((m, idx) => {
                const left = (m.x - paddedBounds.minX) * scale;
                const top = (m.y - paddedBounds.minY) * scale;

                const width = m.width * scale;
                const height = m.height * scale;

                const isDragging = dragging?.name === m.name;

                return (
                    <div
                        key={idx}
                        onMouseDown={(e) => {
                            const boxRect = e.currentTarget.getBoundingClientRect();
                            const offsetX = e.clientX - boxRect.left;
                            const offsetY = e.clientY - boxRect.top;
                            setDragging({ name: m.name, offsetX, offsetY });
                            onSelect(m);
                        }}
                        style={{
                            position: 'absolute',
                            left,
                            top,
                            width,
                            height,
                            border: '2px solid black',
                            background: selected?.name === m.name ? '#add8e6' : '#ddd',
                            textAlign: 'center',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: isDragging ? 'grabbing' : 'grab',
                            userSelect: 'none',
                            color: 'black',
                        }}
                    >
                        <strong>{m.name} - </strong>
                        {m.make}-{m.model}
                    </div>
                );
            })}
        </div>
    );
}

function MonitorsView() {
    const [monitors, setMonitors] = useState([]);
    const [selectedMonitor, setSelectedMonitor] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMonitors = async () => {
            try {
                const json = await GetMonitorsJSON();
                const parsed = JSON.parse(json);
                setMonitors(parsed);
            } catch (err) {
                console.error('Error parsing monitor data:', err);
                setError('Failed to load monitors.');
            }
        };
        fetchMonitors();
    }, []);

    const handleMonitorClick = (monitor) => {
        setSelectedMonitor(monitor);
    };

    const handleMoveMonitor = (name, newX, newY) => {
        setMonitors((prev) => prev.map((m) => (m.name === name ? { ...m, x: newX, y: newY } : m)));

        if (selectedMonitor?.name === name) {
            setSelectedMonitor((prev) => ({
                ...prev,
                x: newX,
                y: newY,
            }));
        }
    };

    const toggleWorkspace = (workspaceNum) => {
        if (!selectedMonitor) return;

        const current = selectedMonitor.workspaces || [];
        const updated = current.includes(workspaceNum)
            ? current.filter((w) => w !== workspaceNum)
            : [...current, workspaceNum].sort();

        setMonitors((prev) =>
            prev.map((m) => (m.name === selectedMonitor.name ? { ...m, workspaces: updated } : m)),
        );
    };

    const generateMonitorLine = (m) => {
        return `monitor=${m.name},${m.width}x${m.height}@${m.refreshRate},${m.x}x${m.y},${m.scale},transform,${m.transform}`;
    };

    if (error) {
        return <p>{error}</p>;
    }
    useEffect(() => {
        if (selectedMonitor) {
            const updated = monitors.find((m) => m.name === selectedMonitor.name);
            if (updated && JSON.stringify(updated) !== JSON.stringify(selectedMonitor)) {
                setSelectedMonitor(updated);
            }
        }
    }, [monitors]);
    return (
        <div style={{ padding: '2rem' }}>
            <MonitorsCanvas
                monitors={monitors}
                selected={selectedMonitor}
                onSelect={handleMonitorClick}
                onMove={handleMoveMonitor}
            />

            {selectedMonitor && (
                <div>
                    <h2>{selectedMonitor.name}</h2>

                    {/* Mode selector */}
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

                    <br />
                    <br />

                    {/* Transform selector */}
                    <label>Rotation:</label>
                    <select
                        value={selectedMonitor.transform}
                        onChange={(e) =>
                            setSelectedMonitor((prev) => ({
                                ...prev,
                                transform: parseInt(e.target.value),
                            }))
                        }
                    >
                        <option value='0'>Normal (0°)</option>
                        <option value='1'>90°</option>
                        <option value='2'>180° (Upside Down)</option>
                        <option value='3'>270°</option>
                    </select>

                    <br />
                    <br />

                    {/* Workspace checkboxes */}
                    <label>Assigned Workspaces:</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                            <label key={n} style={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                    type='checkbox'
                                    checked={selectedMonitor.workspaces?.includes(n) || false}
                                    onChange={() => toggleWorkspace(n)}
                                />
                                &nbsp;{n}
                            </label>
                        ))}
                    </div>

                    <br />

                    <p>
                        <strong>Config Line:</strong>
                    </p>
                    <code>{generateMonitorLine(selectedMonitor)}</code>
                </div>
            )}

            <button
                onClick={async () => {
                    // 1. If there's a selectedMonitor, sync it back into monitors
                    const syncedMonitors = selectedMonitor
                        ? monitors.map((m) => (m.name === selectedMonitor.name ? selectedMonitor : m))
                        : monitors;

                    // 2. Generate monitor lines
                    const monitorLines = syncedMonitors.map(generateMonitorLine);

                    // 3. Generate workspace lines
                    const workspaceLines = syncedMonitors.flatMap((m) =>
                        (m.workspaces || []).map((ws) => `workspace=${ws},monitor:${m.name}`),
                    );

                    // 4. Join into final config
                    const config = [...monitorLines, ...workspaceLines].join('\n');

                    // 5. Write to file
                    const result = await WriteMonitorConfig(config);
                    alert(result);
                }}
                style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
            >
                Save to monitors.conf
            </button>
        </div>
    );
}

export default MonitorsView;
