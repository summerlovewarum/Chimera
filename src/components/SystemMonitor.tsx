import React from 'react';
import { Cpu, HardDrive, Activity } from 'lucide-react';
import { SystemStatus, Language } from './types';
import { translations } from '../i18n';

interface SystemMonitorProps {
    stats: SystemStatus;
    lang: Language;
}

const ProgressBar: React.FC<{ value: number; colorClass: string }> = ({ value, colorClass }) => (
    <div className="h-1.5 w-full bg-slate-700/50 rounded-full mt-2 overflow-hidden">
        <div 
            className={`h-full rounded-full transition-all duration-500 ${colorClass}`} 
            style={{ width: `${Math.min(value, 100)}%` }}
        />
    </div>
);

const MetricItem: React.FC<{ 
    icon: React.ElementType; 
    label: string; 
    value: number; 
    color: string;
    unit: string;
}> = ({ icon: Icon, label, value, color, unit }) => {
    // Determine color classes based on prop
    const textClass = color === 'blue' ? 'text-blue-400' : color === 'purple' ? 'text-purple-400' : 'text-orange-400';
    const bgClass = color === 'blue' ? 'bg-blue-500' : color === 'purple' ? 'bg-purple-500' : 'bg-orange-500';

    return (
        <div className="flex-1 flex flex-col justify-center px-4 border-r border-slate-700/50 last:border-0">
            <div className="flex justify-between items-end mb-1">
                <div className="flex items-center gap-2">
                    <Icon size={16} className={textClass} />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                </div>
                <span className="text-lg font-mono font-bold text-slate-200">
                    {value}<span className="text-xs text-slate-500 ml-0.5">{unit}</span>
                </span>
            </div>
            <ProgressBar value={value} colorClass={bgClass} />
        </div>
    );
};

const SystemMonitor: React.FC<SystemMonitorProps> = ({ stats, lang }) => {
    const t = translations[lang];
    return (
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-lg p-3 shadow-lg flex flex-col md:flex-row gap-4 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-700/50">
            <MetricItem 
                icon={Cpu} 
                label={t.cpu} 
                value={stats.cpu_percent} 
                color="blue" 
                unit="%" 
            />
            <MetricItem 
                icon={Activity} 
                label={t.memory} 
                value={stats.memory_percent} 
                color="purple" 
                unit="%" 
            />
            <MetricItem 
                icon={HardDrive} 
                label={t.storage} 
                value={stats.disk_usage} 
                color="orange" 
                unit="%" 
            />
        </div>
    );
};

export default SystemMonitor;