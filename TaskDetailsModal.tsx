import React, { useEffect, useState, useRef } from 'react';
import { X, Play, StopCircle, Download, Terminal, Clock, Shield, Globe } from 'lucide-react';
import { HarvestTarget, HarvestLog, Language } from '../types';
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

    // Poll logs while open
    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 2000);
        return () => clearInterval(interval);
    }, [target.id]);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    const handleAction = async (action: 'start' | 'stop') => {
        const endpoint = action === 'start' ? `/api/harvest/${target.id}` : `/api/harvest/${target.id}/stop`;
        await fetch(endpoint, { method: 'POST' });
        setLocalStatus(action === 'start' ? 'processing' : 'stopped');
        onUpdate();
        setTimeout(fetchLogs, 500); // Immediate refresh
    };

    const handleExport = () => {
        window.open(`/api/harvest/${target.id}/logs/export`, '_blank');
    };

    const getLogColor = (level: string) => {
        switch (level) {
            case 'ERROR': return 'text-red-400';
            case 'WARNING': return 'text-yellow-400';
            case 'SUCCESS': return 'text-emerald-400';
            default: return 'text-slate-300';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded ${target.type === 'global' ? 'bg-purple-900/30 text-purple-400' : 'bg-blue-900/30 text-blue-400'}`}>
                            {target.type === 'global' ? <Globe size={20} /> : <Globe size={20} />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                {t.taskDetails} <span className="text-slate-500">#{target.id}</span>
                            </h2>
                            <p className="text-xs text-slate-400 font-mono">{target.url || target.keywords}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col md:flex-row min-h-0">
                    
                    {/* Sidebar Info */}
                    <div className="w-full md:w-64 bg-slate-900/50 border-r border-slate-800 p-4 space-y-4 overflow-y-auto">
                        
                        <div className="bg-slate-800/50 p-3 rounded border border-slate-700/50">
                            <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">{t.proxyMode}</span>
                            <div className="flex items-center gap-2">
                                <Shield size={14} className={target.proxy_mode === 'tor' ? 'text-emerald-400' : 'text-slate-500'} />
                                <span className="font-mono text-sm capitalize text-slate-200">{target.proxy_mode}</span>
                            </div>
                        </div>

                        <div className="bg-slate-800/50 p-3 rounded border border-slate-700/50">
                            <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Status</span>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${localStatus === 'processing' ? 'bg-blue-500 animate-pulse' : localStatus === 'completed' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                                <span className="font-mono text-sm capitalize text-slate-200">{localStatus}</span>
                            </div>
                        </div>

                        <div className="space-y-2 pt-4">
                            {localStatus === 'processing' ? (
                                <button 
                                    onClick={() => handleAction('stop')}
                                    className="w-full py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800/50 rounded flex items-center justify-center gap-2 transition-all"
                                >
                                    <StopCircle size={16} /> {t.stopTask}
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleAction('start')}
                                    className="w-full py-2 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-800/50 rounded flex items-center justify-center gap-2 transition-all"
                                >
                                    <Play size={16} /> {t.startTask}
                                </button>
                            )}
                            <button 
                                onClick={handleExport}
                                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded flex items-center justify-center gap-2 transition-all"
                            >
                                <Download size={16} /> {t.exportLogs}
                            </button>
                        </div>
                    </div>

                    {/* Log Viewer */}
                    <div className="flex-1 flex flex-col bg-black min-h-0">
                        <div className="p-2 border-b border-slate-800 flex items-center gap-2 text-slate-500 text-xs uppercase font-bold select-none">
                            <Terminal size={12} /> {t.logs}
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 custom-scrollbar">
                            {logs.length === 0 && (
                                <div className="text-slate-700 italic flex items-center gap-2">
                                    <Clock size={12} /> {t.logWaiting}
                                </div>
                            )}
                            {logs.map(log => (
                                <div key={log.id} className="flex gap-2 break-all hover:bg-slate-900/50 -mx-2 px-2 py-0.5 rounded">
                                    <span className="text-slate-600 min-w-[130px] shrink-0">{log.timestamp}</span>
                                    <span className={`font-bold min-w-[60px] shrink-0 ${getLogColor(log.level)}`}>[{log.level}]</span>
                                    <span className="text-slate-300">{log.message}</span>
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailsModal;