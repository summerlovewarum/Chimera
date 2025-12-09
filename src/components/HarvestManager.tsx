
import React, { useState } from 'react';
import { Target, Plus, Trash2, Play, AlertCircle, CheckCircle, RefreshCw, Hash, Link as LinkIcon, Globe, Shield, Network, Settings, StopCircle, Info } from 'lucide-react';
import { HarvestTarget, Language } from './types';
import { translations } from '../i18n';

interface HarvestManagerProps {
    targets: HarvestTarget[];
    onUpdate: () => void;
    onSelectTarget: (target: HarvestTarget) => void;
    lang: Language;
}

const HarvestManager: React.FC<HarvestManagerProps> = ({ targets, onUpdate, onSelectTarget, lang }) => {
    const [url, setUrl] = useState('');
    const [keywords, setKeywords] = useState('');
    const [mode, setMode] = useState<'targeted' | 'global'>('targeted');
    const [proxyMode, setProxyMode] = useState<'tor' | 'direct' | 'custom'>('tor');
    const [proxyUrl, setProxyUrl] = useState('');
    const [loading, setLoading] = useState(false);
    
    const t = translations[lang];

    const addTarget = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { 
                url: mode === 'targeted' ? url : undefined, 
                keywords, 
                type: mode,
                proxy_mode: proxyMode,
                proxy_url: proxyMode === 'custom' ? proxyUrl : undefined
            };

            console.log("Adding target...", payload);

            const res = await fetch('/api/targets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setUrl('');
                setKeywords('');
                await onUpdate(); 
            } else {
                console.error("Add target failed", res.status);
                alert("Failed to add target. Check console.");
            }
        } catch (error) {
            console.error("Network Error adding target:", error);
            alert("Network error. Is the mock server running?");
        } finally {
            setLoading(false);
        }
    };

    const deleteTarget = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await fetch(`/api/targets/${id}`, { method: 'DELETE' });
            onUpdate();
        } catch (e) {
            console.error(e);
        }
    };

    const runHarvest = async (id: number) => {
        try {
            const res = await fetch(`/api/harvest/${id}`, { method: 'POST' });
            if (!res.ok) {
                const err = await res.json();
                alert(err.error || 'Failed to start task');
            } else {
                // Automatically open the logs window (Modal) for immediate feedback
                const target = targets.find(t => t.id === id);
                if (target) {
                    // Pass optimistic status so UI feels responsive
                    onSelectTarget({ ...target, status: 'processing' });
                }
            }
            onUpdate();
        } catch (e) {
            console.error(e);
            alert("Failed to connect to server.");
        }
    };
    
    const stopHarvest = async (id: number) => {
        try {
            await fetch(`/api/harvest/${id}/stop`, { method: 'POST' });
            onUpdate();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="bg-slate-800/80 backdrop-blur rounded-lg border border-slate-700 shadow-xl h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
                <h2 className="text-lg font-bold flex items-center text-slate-100">
                    <Target className="mr-2 text-blue-400 w-5 h-5" /> 
                    {t.targetAcquisition}
                </h2>
            </div>

            <div className="p-4 bg-slate-900/30 border-b border-slate-700/50">
                <form onSubmit={addTarget} className="space-y-4">
                    
                    {/* Mode Toggle */}
                    <div className="flex bg-slate-900 rounded p-1 border border-slate-700">
                        <button
                            type="button"
                            onClick={() => setMode('targeted')}
                            className={`flex-1 flex items-center justify-center text-xs py-2 rounded transition-all ${mode === 'targeted' ? 'bg-blue-600 text-white shadow-lg font-bold' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <LinkIcon size={12} className="mr-1.5" /> {t.modeTargeted}
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('global')}
                            className={`flex-1 flex items-center justify-center text-xs py-2 rounded transition-all ${mode === 'global' ? 'bg-purple-600 text-white shadow-lg font-bold' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Globe size={12} className="mr-1.5" /> {t.modeGlobal}
                        </button>
                    </div>

                    {mode === 'targeted' && (
                        <div className="relative group">
                            <LinkIcon className="absolute left-3 top-2.5 text-slate-500 w-4 h-4 group-focus-within:text-blue-400 transition-colors" />
                            <input
                                type="url"
                                placeholder={t.targetUrl}
                                required
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-slate-600"
                            />
                        </div>
                    )}
                    
                    <div className="relative group">
                        <Hash className="absolute left-3 top-2.5 text-slate-500 w-4 h-4 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="text"
                            placeholder={t.keywords}
                            required
                            value={keywords}
                            onChange={e => setKeywords(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-slate-600"
                        />
                    </div>

                    {/* Network Connection Selection */}
                    <div className="bg-slate-900/40 p-3 rounded border border-slate-700/50 space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                            <Network size={10} /> {t.proxyMode}
                        </label>
                        <div className="flex gap-2">
                            <button 
                                type="button" 
                                onClick={() => setProxyMode('tor')} 
                                className={`flex-1 py-1.5 px-2 text-[10px] rounded border transition-all flex items-center justify-center gap-1 ${proxyMode === 'tor' ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300 shadow-sm' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                            >
                                <Shield size={10} /> {t.proxyTor}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setProxyMode('direct')} 
                                className={`flex-1 py-1.5 px-2 text-[10px] rounded border transition-all flex items-center justify-center gap-1 ${proxyMode === 'direct' ? 'bg-blue-900/40 border-blue-500/50 text-blue-300 shadow-sm' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                            >
                                <Globe size={10} /> {t.proxyDirect}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setProxyMode('custom')} 
                                className={`flex-1 py-1.5 px-2 text-[10px] rounded border transition-all flex items-center justify-center gap-1 ${proxyMode === 'custom' ? 'bg-orange-900/40 border-orange-500/50 text-orange-300 shadow-sm' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                            >
                                <Settings size={10} /> {t.proxyCustom}
                            </button>
                        </div>
                        {proxyMode === 'custom' && (
                            <input 
                                type="text" 
                                value={proxyUrl}
                                onChange={e => setProxyUrl(e.target.value)}
                                placeholder={t.proxyUrlPlaceholder}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-600 focus:border-orange-500/50 focus:outline-none transition-colors"
                            />
                        )}
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full py-2 rounded font-bold transition-all shadow-lg text-white disabled:opacity-50 flex items-center justify-center gap-2 ${mode === 'global' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? <RefreshCw className="animate-spin" size={16} /> : <Plus size={16} />}
                        {t.add}
                    </button>
                </form>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {targets.length === 0 && (
                    <div className="text-center text-slate-600 py-10 flex flex-col items-center">
                        <Target className="w-10 h-10 mb-2 opacity-20" />
                        <span className="text-sm">{t.noTargets}</span>
                    </div>
                )}
                {targets.map(target => (
                    <div key={target.id} className="bg-slate-800/50 hover:bg-slate-700/50 p-3 rounded border border-slate-700/50 transition-colors group relative">
                        <div className="flex justify-between items-start mb-2">
                            <div className="overflow-hidden pr-2">
                                <div className="flex items-center gap-2 mb-1">
                                    {target.type === 'global' ? (
                                        <span className="text-[10px] bg-purple-900/50 text-purple-300 border border-purple-800 px-1.5 rounded uppercase font-bold">{t.modeGlobal}</span>
                                    ) : (
                                        <span className="text-[10px] bg-blue-900/50 text-blue-300 border border-blue-800 px-1.5 rounded uppercase font-bold">{t.modeTargeted}</span>
                                    )}
                                    <span className={`text-[10px] px-1.5 rounded uppercase font-bold border flex items-center gap-1 ${
                                        target.proxy_mode === 'tor' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' :
                                        target.proxy_mode === 'direct' ? 'bg-blue-900/30 text-blue-400 border-blue-800' :
                                        'bg-orange-900/30 text-orange-400 border-orange-800'
                                    }`}>
                                        {target.proxy_mode}
                                    </span>
                                </div>
                                <div className="font-mono text-sm text-slate-300 truncate font-semibold cursor-pointer hover:text-blue-400 transition-colors" onClick={() => onSelectTarget(target)} title={target.url || "Global Search"}>
                                    {target.url || `Search: ${target.keywords}`}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {target.status === 'processing' ? (
                                    <button 
                                        onClick={() => stopHarvest(target.id)}
                                        title={t.stopTask}
                                        className="p-1.5 bg-slate-700 hover:bg-red-600 text-red-400 hover:text-white rounded transition-all shadow shadow-slate-900/50"
                                    >
                                        <StopCircle size={14} className="fill-current" />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => runHarvest(target.id)}
                                        title={t.startTask}
                                        className="p-1.5 bg-slate-700 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded transition-all shadow shadow-slate-900/50"
                                    >
                                        <Play size={14} className="fill-current" />
                                    </button>
                                )}
                                <button 
                                    onClick={() => onSelectTarget(target)}
                                    title={t.details}
                                    className="p-1.5 bg-slate-700 hover:bg-blue-600 text-blue-400 hover:text-white rounded transition-all"
                                >
                                    <Info size={14} />
                                </button>
                                <button 
                                    onClick={() => deleteTarget(target.id)}
                                    title="Remove Target"
                                    className="p-1.5 bg-slate-700 hover:bg-red-600 text-red-400 hover:text-white rounded transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                            <div className="flex flex-wrap gap-1">
                                {target.keywords.split(',').slice(0, 3).map((k, i) => (
                                    <span key={i} className="text-[10px] bg-slate-900 text-slate-400 px-1.5 rounded border border-slate-700">
                                        {k.trim()}
                                    </span>
                                ))}
                            </div>
                            <div className="text-xs">
                                {target.status === 'pending' && <span className="text-slate-500 flex items-center gap-1"><AlertCircle size={12} /> {t.pending}</span>}
                                {target.status === 'completed' && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle size={12} /> {t.ready}</span>}
                                {target.status === 'processing' && <span className="text-blue-400 flex items-center gap-1"><RefreshCw size={12} className="animate-spin" /> {t.active}</span>}
                                {target.status === 'failed' && <span className="text-red-400 flex items-center gap-1"><AlertCircle size={12} /> {t.failed}</span>}
                                {target.status === 'stopped' && <span className="text-yellow-500 flex items-center gap-1"><StopCircle size={12} /> {t.stopped}</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HarvestManager;
