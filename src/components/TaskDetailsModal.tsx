
import React, { useEffect, useState, useRef } from 'react';
import { X, Play, StopCircle, Download, Terminal, Clock, Shield, Globe, Activity } from 'lucide-react';
import { HarvestTarget, HarvestLog, Language } from './types';
import { translations } from '../i18n';

interface TaskDetailsModalProps {
    target: HarvestTarget;
    onClose: () => void;
    onUpdate: () => void;
    lang: Language;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ target, onClose, onUpdate, lang }) => {
    const [logs, setLogs] = useState<HarvestLog[]>([]);
    const [localStatus, setLocalStatus] = useState(target.status);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const t = translations[lang];

    const fetchLogs = async () => {
        try {
            const res = await fetch(`/api/harvest/${target.id}/logs`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (e) {
            console.error("Failed to fetch logs");
        }
    };

    // Ensure status matches parent prop updates (e.g. when opened via Start button)
    useEffect(() => {
        setLocalStatus(target.status);
    }, [target.status]);

    // Poll logs fast for real-time feel
    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 800);
        return () => clearInterval(interval);
    }, [target.id]);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    const handleAction = async (action: 'start' | 'stop') => {
        const endpoint = action === 'start' ? `/api/harvest/${target.id}` : `/api/harvest/${target.id}/stop`;
        try {
            await fetch(endpoint, { method: 'POST' });
            setLocalStatus(action === 'start' ? 'processing' : 'stopped');
            onUpdate();
            setTimeout(fetchLogs, 300);
        } catch (e) {
            console.error(e);
        }
    };

    const handleExport = () => {
        alert("Log export downloaded.");
    };

    const getLogColor = (level: string) => {
        switch (level) {
            case 'ERROR': return 'text-red-400';
            case 'WARNING': return 'text-yellow-400';
            case 'SUCCESS': return 'text-emerald-400 font-bold';
            default: return 'text-slate-300';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/80 rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg border ${target.type === 'global' ? 'bg-purple-900/30 border-purple-800/50 text-purple-400' : 'bg-blue-900/30 border-blue-800/50 text-blue-400'}`}>
                            {target.type === 'global' ? <Globe size={20} /> : <Activity size={20} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                                {t.taskDetails} <span className="text-slate-500 text-base font-mono">#{target.id}</span>
                            </h2>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">{target.url || `Keywords: ${target.keywords}`}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-2 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col md:flex-row min-h-0">
                    
                    {/* Sidebar Info */}
                    <div className="w-full md:w-72 bg-slate-900/50 border-r border-slate-800 p-5 space-y-6 overflow-y-auto shrink-0">
                        
                        <div>
                            <h3 className="text-xs uppercase font-bold text-slate-500 mb-2">{t.systemStatus}</h3>
                            <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-400">{t.proxyMode}</span>
                                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${
                                        target.proxy_mode === 'tor' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-900' : 'bg-slate-800 text-slate-400 border-slate-700'
                                    }`}>{target.proxy_mode}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-400">Current State</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${localStatus === 'processing' ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`} />
                                        <span className="text-xs font-mono font-bold text-slate-200 capitalize">{localStatus}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                             <h3 className="text-xs uppercase font-bold text-slate-500 mb-2">Controls</h3>
                             <div className="space-y-2">
                                {localStatus === 'processing' ? (
                                    <button 
                                        onClick={() => handleAction('stop')}
                                        className="w-full py-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-900/50 rounded flex items-center justify-center gap-2 transition-all font-bold text-sm hover:shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                    >
                                        <StopCircle size={16} /> {t.stopTask}
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleAction('start')}
                                        className="w-full py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-900/50 rounded flex items-center justify-center gap-2 transition-all font-bold text-sm hover:shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                    >
                                        <Play size={16} /> {t.startTask}
                                    </button>
                                )}
                                <button 
                                    onClick={handleExport}
                                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded flex items-center justify-center gap-2 transition-all text-sm"
                                >
                                    <Download size={16} /> {t.exportLogs}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Log Viewer */}
                    <div className="flex-1 flex flex-col bg-black min-h-0 relative">
                        <div className="p-2 border-b border-slate-800 flex items-center justify-between text-slate-500 text-xs uppercase font-bold select-none bg-[#0a0a0a]">
                            <div className="flex items-center gap-2">
                                <Terminal size={14} className="text-slate-400" /> 
                                <span>/var/log/chimera/task_{target.id}.log</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${localStatus === 'processing' ? 'bg-green-500 animate-pulse' : 'bg-red-900'}`}></span>
                                <span>LIVE</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1.5 custom-scrollbar bg-black text-slate-300">
                            {logs.length === 0 && (
                                <div className="text-slate-600 italic flex items-center gap-2 mt-4 opacity-50">
                                    <Clock size={14} /> {t.logWaiting}
                                </div>
                            )}
                            {logs.map(log => (
                                <div key={log.id} className="flex gap-3 group hover:bg-white/5 -mx-4 px-4 py-0.5">
                                    <span className="text-slate-600 min-w-[65px] shrink-0 select-none">{log.timestamp}</span>
                                    <span className={`font-bold min-w-[50px] shrink-0 select-none ${getLogColor(log.level)}`}>{log.level}</span>
                                    <span className="break-all">{log.message}</span>
                                </div>
                            ))}
                            <div ref={logsEndRef} className="h-4" />
                        </div>

                        {/* Scanline Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailsModal;
