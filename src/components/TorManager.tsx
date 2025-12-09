import React, { useState, useEffect, useRef } from 'react';
import { Shield, RefreshCw, Terminal, Globe, Server, Play, StopCircle, Activity, AlertTriangle, Wifi } from 'lucide-react';
import { TorStatus, Language } from './types';
import { translations } from '../i18n';

interface TorManagerProps {
    status: TorStatus;
    onRefresh: () => void;
    lang: Language;
}

const TorManager: React.FC<TorManagerProps> = ({ status, onRefresh, lang }) => {
    const [loading, setLoading] = useState(false);
    const [localLogs, setLocalLogs] = useState<string[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const t = translations[lang];

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [localLogs, status.logs]);

    const handleAction = async (action: 'deploy' | 'stop') => {
        setLoading(true);
        try {
            const res = await fetch(`/api/tor/${action}`, { method: 'POST' });
            const data = await res.json();
            if (data.logs) setLocalLogs(prev => [...prev, ...data.logs]);
            if (data.message) setLocalLogs(prev => [...prev, data.message]);
            onRefresh();
        } catch (e) {
            setLocalLogs(prev => [...prev, `Error: ${e}`]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (s: string) => {
        if (s === 'RUNNING') return { color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-900/20', icon: Shield, glow: 'shadow-[0_0_10px_rgba(16,185,129,0.2)]' };
        if (s === 'SYNCHRONIZING') return { color: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-900/20', icon: Activity, glow: 'shadow-[0_0_10px_rgba(245,158,11,0.2)]' };
        if (s === 'UNREACHABLE') return { color: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-900/20', icon: AlertTriangle, glow: '' };
        return { color: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-900/20', icon: Shield, glow: '' };
    };

    const config = getStatusConfig(status.status);
    const StatusIcon = config.icon;
    const isRunning = status.status === 'RUNNING' || status.status === 'SYNCHRONIZING';

    return (
        <div className={`bg-slate-800/80 backdrop-blur rounded-lg p-5 border ${config.border} shadow-xl flex flex-col h-full transition-all duration-500 ${config.glow}`}>
            <div className="flex justify-between items-center mb-5">
                <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${config.bg} mr-3`}>
                        <StatusIcon className={`w-5 h-5 ${config.color} ${status.status === 'SYNCHRONIZING' ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-100 leading-tight">{t.torNetwork}</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                             <div className={`w-1.5 h-1.5 rounded-full ${status.status === 'RUNNING' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div>
                             <span className={`text-xs font-mono font-bold ${config.color}`}>{status.status}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-slate-900/50 p-3 rounded border border-slate-700/50">
                    <div className="text-slate-500 text-[10px] uppercase font-bold mb-1 flex items-center gap-1">
                        <Server size={10} /> {t.platform}
                    </div>
                    <div className="font-mono text-sm text-slate-300 truncate" title={status.platform}>
                        {status.platform}
                    </div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded border border-slate-700/50">
                    <div className="text-slate-500 text-[10px] uppercase font-bold mb-1 flex items-center gap-1">
                        <Globe size={10} /> {t.circuitIp}
                    </div>
                    <div className="font-mono text-sm text-slate-300 flex items-center">
                        {status.ip ? <span className="text-blue-400">{status.ip}</span> : <span className="text-slate-600">---</span>}
                    </div>
                </div>
            </div>

            <div className="flex gap-3 mb-5">
                {!isRunning ? (
                    <button 
                        onClick={() => handleAction('deploy')}
                        disabled={loading}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {loading ? <RefreshCw className="animate-spin mr-2 w-4 h-4" /> : <Play className="mr-2 w-4 h-4 fill-current group-hover:scale-110 transition-transform" />}
                        {t.initNode}
                    </button>
                ) : (
                    <button 
                        onClick={() => handleAction('stop')}
                        disabled={loading}
                        className="flex-1 bg-red-600/90 hover:bg-red-500 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition-all shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <StopCircle className="mr-2 w-4 h-4" />
                        {t.terminate}
                    </button>
                )}
            </div>

            <div className="flex-1 min-h-[160px] bg-[#0c0c0c] rounded-md border border-slate-700/50 p-3 font-mono text-[11px] text-green-500 overflow-hidden flex flex-col shadow-inner">
                <div className="flex items-center justify-between text-slate-600 border-b border-slate-800 pb-2 mb-2 select-none">
                    <div className="flex items-center gap-2">
                        <Terminal size={12} />
                        <span>{t.daemonLog}</span>
                    </div>
                    <Wifi size={12} className={isRunning ? "text-green-500" : "text-slate-700"} />
                </div>
                <div className="overflow-y-auto flex-1 custom-scrollbar space-y-1">
                    {localLogs.length === 0 && !status.logs?.length && (
                        <span className="text-slate-700 italic opacity-50">{t.waiting}</span>
                    )}
                    {localLogs.map((log, i) => (
                        <div key={`local-${i}`} className="break-all border-l-2 border-transparent hover:border-slate-700 pl-1">
                            <span className="text-green-700 mr-2">{'>'}</span>{log}
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>
        </div>
    );
};

export default TorManager;