function MonitorsCanvas({ monitors, onSelect, selected }) {
    // Get bounding box of all monitors to normalize scale
    const bounds = monitors.reduce(
        (acc, m) => ({
            minX: Math.min(acc.minX, m.x),
            minY: Math.min(acc.minY, m.y),
            maxX: Math.max(acc.maxX, m.x + m.width),
            maxY: Math.max(acc.maxY, m.y + m.height),
        }),
        { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
    );

    const canvasWidth = 800;
    const canvasHeight = 400;

    const scaleX = canvasWidth / (bounds.maxX - bounds.minX);
    const scaleY = canvasHeight / (bounds.maxY - bounds.minY);
    const scale = Math.min(scaleX, scaleY);

    return (
        <div
            style={{
                position: 'relative',
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                border: '2px dashed gray',
                background: '#fdfdfd',
            }}
        >
            {monitors.map((m, idx) => {
                const left = (m.x - bounds.minX) * scale;
                const top = (m.y - bounds.minY) * scale;
                const width = m.width * scale;
                const height = m.height * scale;
                return (
                    <div
                        key={idx}
                        onClick={() => onSelect(m)}
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
                            cursor: 'pointer',
                        }}
                    >
                        {m.name}
                    </div>
                );
            })}
        </div>
    );
}
