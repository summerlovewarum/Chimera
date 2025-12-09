
import { HarvestTarget, HarvestLog, HarvestedData, TorStatus } from '../components/types';

// --- CONSTANTS & DB KEYS ---
const DB_KEYS = {
    TARGETS: 'chimera_targets',
    LOGS: 'chimera_logs',
    DATA: 'chimera_data'
};

// --- DATABASE HELPERS (LocalStorage) ---
const getLS = <T>(key: string, defaultVal: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultVal;
    } catch (e) {
        console.error(`[MockDB] Error reading ${key}`, e);
        return defaultVal;
    }
};

const setLS = (key: string, value: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`[MockDB] Error writing ${key}`, e);
    }
};

// Seed Database if empty
if (!localStorage.getItem(DB_KEYS.TARGETS)) {
    console.log("[MockDB] Seeding initial targets...");
    setLS(DB_KEYS.TARGETS, [
        { id: 1, type: 'targeted', url: 'http://darkmarket.onion', keywords: 'credit cards, dumps', proxy_mode: 'tor', status: 'pending', last_run: null },
        { id: 2, type: 'global', keywords: 'leaked credentials', proxy_mode: 'tor', status: 'stopped', last_run: null }
    ]);
}

// --- TOR SERVICE STATE ---
// Store state in window to survive HMR (Hot Module Replacement)
const getTorState = (): TorStatus => {
    if (!(window as any).__MOCK_TOR_STATE__) {
        (window as any).__MOCK_TOR_STATE__ = {
            status: 'STOPPED',
            platform: 'WebAssembly (Simulated)',
            ip: undefined,
            logs: []
        };
    }
    return (window as any).__MOCK_TOR_STATE__;
};

let torBootstrapTimer: any = null;

const startTorSimulation = () => {
    const state = getTorState();
    if (state.status !== 'STOPPED') return;
    
    state.status = 'STARTING';
    state.logs = [...(state.logs || []), `[${new Date().toLocaleTimeString()}] Starting Tor daemon...`];
    
    let progress = 0;
    torBootstrapTimer = setInterval(() => {
        progress += 20; 
        
        if (progress === 20) state.logs?.push(`[${new Date().toLocaleTimeString()}] Bootstrapped 10%: Finishing handshake`);
        if (progress === 40) state.logs?.push(`[${new Date().toLocaleTimeString()}] Bootstrapped 50%: Loading relay descriptors`);
        
        if (progress >= 60 && state.status !== 'SYNCHRONIZING') {
            state.status = 'SYNCHRONIZING';
            state.logs?.push(`[${new Date().toLocaleTimeString()}] Bootstrapped 80%: Synchronizing consensus`);
        }
        
        if (progress >= 100) {
            state.status = 'RUNNING';
            state.ip = `10.2.${Math.floor(Math.random()*90)+10}.${Math.floor(Math.random()*255)}`;
            state.logs?.push(`[${new Date().toLocaleTimeString()}] [SUCCESS] Circuit established. Virtual IP: ${state.ip}`);
            clearInterval(torBootstrapTimer);
            torBootstrapTimer = null;
        }
    }, 800);
};

const stopTorSimulation = () => {
    if (torBootstrapTimer) clearInterval(torBootstrapTimer);
    const state = getTorState();
    state.status = 'STOPPED';
    state.ip = undefined;
    state.logs?.push(`[${new Date().toLocaleTimeString()}] Tor service stopped.`);
};

// --- BACKGROUND HARVESTER WORKER ---
// Singleton worker
if (!(window as any).__HARVESTER_WORKER_ACTIVE__) {
    (window as any).__HARVESTER_WORKER_ACTIVE__ = true;
    
    setInterval(() => {
        const targets = getLS<HarvestTarget[]>(DB_KEYS.TARGETS, []);
        const logs = getLS<HarvestLog[]>(DB_KEYS.LOGS, []);
        const data = getLS<HarvestedData[]>(DB_KEYS.DATA, []);
        let dbModified = false;

        targets.forEach(target => {
            if (target.status === 'processing') {
                if (Math.random() > 0.3) {
                    const msgs = [
                        "Scanning ports...", "Parsing HTML structure...", "Following onion route...", 
                        "Deciphering metadata...", "Heartbeat check: Active...", "Rotating proxy identity...",
                        "Analyzing DOM for keywords...", "Bypassing WAF protection...", "Extracting JS variables..."
                    ];
                    logs.push({
                        id: Date.now() + Math.random(),
                        target_id: target.id,
                        timestamp: new Date().toLocaleTimeString(),
                        level: 'INFO',
                        message: msgs[Math.floor(Math.random() * msgs.length)]
                    });
                    dbModified = true;
                }

                if (Math.random() > 0.92) {
                    const keyword = target.keywords.split(',')[0] || 'secret';
                    logs.push({
                        id: Date.now() + Math.random(),
                        target_id: target.id,
                        timestamp: new Date().toLocaleTimeString(),
                        level: 'SUCCESS',
                        message: `*** DATA ACQUIRED: Matched "${keyword}" ***`
                    });
                    
                    data.unshift({
                        id: Date.now(),
                        target_id: target.id,
                        url: target.url || `http://hidden-service-${Math.floor(Math.random()*999)}.onion`,
                        content_snippet: `Simulated captured content containing ${keyword}... Found user credentials and API keys in source code.`,
                        matched_keywords: keyword,
                        timestamp: new Date().toLocaleString(),
                        tags: 'sensitive,simulated,credentials'
                    });
                    
                    if (data.length > 50) data.pop();
                    setLS(DB_KEYS.DATA, data);
                    dbModified = true;
                }
            }
        });

        if (logs.length > 200) {
            logs.splice(0, logs.length - 200);
            dbModified = true;
        }

        if (dbModified) {
            setLS(DB_KEYS.LOGS, logs);
        }
    }, 1000);
}

// --- NETWORK INTERCEPTOR ---

export const initMockServer = () => {
    // 1. Capture original fetch ONCE
    if (!(window as any).__ORIGINAL_FETCH__) {
        (window as any).__ORIGINAL_FETCH__ = window.fetch;
    }
    const originalFetch = (window as any).__ORIGINAL_FETCH__;

    console.log("%c [MockBackend] Interceptor Attached ", "background: #22c55e; color: #000; font-weight: bold");

    // 2. Overwrite fetch (Always overwrite to support HMR updates)
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        
        let urlObj: URL;
        try {
            // Robust URL parsing
            const urlStr = input instanceof Request ? input.url : input.toString();
            urlObj = new URL(urlStr, window.location.origin); 
        } catch (e) {
            // Fallback for weird inputs
            return originalFetch(input, init);
        }

        const path = urlObj.pathname;

        // Pass through non-API requests
        if (!path.startsWith('/api/')) {
            return originalFetch(input, init);
        }

        // console.log(`[MockBackend] ${init?.method || 'GET'} ${path}`);
        
        // Simulate network latency
        await new Promise(r => setTimeout(r, 150));

        try {
            // --- API ROUTER ---

            // GET /api/status
            if (path === '/api/status') {
                return new Response(JSON.stringify({
                    tor: getTorState(),
                    system: {
                        cpu_percent: Math.floor(Math.random() * 30) + 10,
                        memory_percent: Math.floor(Math.random() * 40) + 20,
                        disk_usage: 42
                    }
                }), { status: 200 });
            }

            // TOR Control
            if (path.includes('/api/tor/deploy')) {
                startTorSimulation();
                return new Response(JSON.stringify({ message: "Tor starting" }), { status: 200 });
            }
            if (path.includes('/api/tor/stop')) {
                stopTorSimulation();
                return new Response(JSON.stringify({ message: "Tor stopped" }), { status: 200 });
            }

            // TARGETS CRUD
            if (path === '/api/targets') {
                if (init?.method === 'POST') {
                    // Safe Body Parsing
                    let bodyData;
                    if (typeof init.body === 'string') {
                        bodyData = JSON.parse(init.body);
                    } else {
                        // Handle case where body might be empty or object (shouldn't happen with correct usage)
                         bodyData = {}; 
                    }

                    const targets = getLS<HarvestTarget[]>(DB_KEYS.TARGETS, []);
                    const newTarget = {
                        ...bodyData,
                        id: Date.now(),
                        status: 'pending',
                        last_run: null
                    };
                    targets.unshift(newTarget);
                    setLS(DB_KEYS.TARGETS, targets);
                    console.log("[MockBackend] Target added:", newTarget);
                    return new Response(JSON.stringify({ success: true }), { status: 200 });
                }
                // GET
                return new Response(JSON.stringify(getLS(DB_KEYS.TARGETS, [])), { status: 200 });
            }

            // DELETE Target
            if (path.match(/^\/api\/targets\/\d+$/) && init?.method === 'DELETE') {
                const id = parseInt(path.split('/').pop()!);
                let targets = getLS<HarvestTarget[]>(DB_KEYS.TARGETS, []);
                targets = targets.filter(t => t.id !== id);
                setLS(DB_KEYS.TARGETS, targets);
                return new Response(JSON.stringify({ success: true }), { status: 200 });
            }

            // HARVEST CONTROL
            // Start
            if (path.match(/^\/api\/harvest\/\d+$/) && init?.method === 'POST') {
                const id = parseInt(path.split('/').pop()!);
                const targets = getLS<HarvestTarget[]>(DB_KEYS.TARGETS, []);
                const target = targets.find(t => t.id === id);
                
                if (target) {
                    target.status = 'processing';
                    target.last_run = new Date().toISOString();
                    
                    const logs = getLS<HarvestLog[]>(DB_KEYS.LOGS, []);
                    logs.push({
                        id: Date.now(),
                        target_id: target.id,
                        timestamp: new Date().toLocaleTimeString(),
                        level: 'INFO',
                        message: `[COMMAND] Initializing harvest protocol for ${target.url || target.keywords}...`
                    });
                    setLS(DB_KEYS.LOGS, logs);
                    setLS(DB_KEYS.TARGETS, targets);
                    
                    console.log("[MockBackend] Harvest started for:", id);
                    return new Response(JSON.stringify({ success: true }), { status: 200 });
                }
                return new Response(JSON.stringify({ error: "Target not found" }), { status: 404 });
            }
            
            // Stop
            if (path.match(/^\/api\/harvest\/\d+\/stop$/) && init?.method === 'POST') {
                const parts = path.split('/');
                const id = parseInt(parts[parts.length - 2]);
                const targets = getLS<HarvestTarget[]>(DB_KEYS.TARGETS, []);
                const target = targets.find(t => t.id === id);
                if (target) {
                    target.status = 'stopped';
                    const logs = getLS<HarvestLog[]>(DB_KEYS.LOGS, []);
                    logs.push({
                        id: Date.now(),
                        target_id: target.id,
                        timestamp: new Date().toLocaleTimeString(),
                        level: 'WARNING',
                        message: `[COMMAND] Process halted by user.`
                    });
                    setLS(DB_KEYS.LOGS, logs);
                    setLS(DB_KEYS.TARGETS, targets);
                }
                return new Response(JSON.stringify({ success: true }), { status: 200 });
            }

            // Logs
            if (path.match(/^\/api\/harvest\/\d+\/logs$/)) {
                const parts = path.split('/');
                const id = parseInt(parts[parts.length - 2]);
                const logs = getLS<HarvestLog[]>(DB_KEYS.LOGS, []);
                const targetLogs = logs.filter(l => l.target_id === id).sort((a,b) => a.id - b.id);
                return new Response(JSON.stringify(targetLogs), { status: 200 });
            }

            // DATA
            if (path.startsWith('/api/data')) {
                return new Response(JSON.stringify(getLS(DB_KEYS.DATA, [])), { status: 200 });
            }

            console.warn(`[MockBackend] 404 Not Found: ${path}`);
            return new Response(JSON.stringify({ error: 'Endpoint not found' }), { status: 404 });

        } catch (e) {
            console.error(`[MockBackend] Internal Error`, e);
            return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
        }
    };
};
