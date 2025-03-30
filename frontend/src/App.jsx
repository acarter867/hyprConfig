import { useState } from 'react';
import logo from './assets/images/logo-universal.png';
import './App.css';
import { ReadMonitors } from '../wailsjs/go/main/App';
import MonitorsView from './components/monitorView';
function App() {
    const handleGetMonitorConfig = async () => {
        const result = await ReadMonitors();
        console.log(result);
    };

    return (
        <div>
            <button onClick={handleGetMonitorConfig}>Read Monitor config</button>
            <MonitorsView></MonitorsView>
        </div>
    );
}

export default App;
