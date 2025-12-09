import { useEffect, useState, useCallback } from 'react';
import { LayoutDashboard, Radio, Languages } from 'lucide-react';
import TorManager from './components/TorManager';
import HarvestManager from './components/HarvestManager';
import DataViewer from './components/DataViewer';
import SystemMonitor from './components/SystemMonitor';
import TaskDetailsModal from './components/TaskDetailsModal';
import { TorStatus, HarvestTarget, HarvestedData, SystemStatus, Language } from './components/types';
import { translations } from './i18n';

function App() {
  const [torStatus, setTorStatus] = useState<TorStatus>({ status: 'STOPPED', platform: 'Initializing...' });
  const [systemStats, setSystemStats] = useState<SystemStatus>({ cpu_percent: 0, memory_percent: 0, disk_usage: 0 });
  const [targets, setTargets] = useState<HarvestTarget[]>([]);
  const [data, setData] = useState<HarvestedData[]>([]);
  const [lang, setLang] = useState<Language>('zh');
  const [selectedTarget, setSelectedTarget] = useState<HarvestTarget | null>(null);

  const t = translations[lang];

  const fetchData = useCallback(async () => {
    try {
      // Parallel requests to the virtual backend
      const [statusRes, targetsRes, dataRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/targets'),
        fetch('/api/data')
      ]);

      if (statusRes.ok) {
        const statusJson = await statusRes.json();
        setTorStatus(statusJson.tor);
        setSystemStats(statusJson.system);
      }
      
      if (targetsRes.ok) {
        const targetsJson = await targetsRes.json();
        // Check if data actually changed to avoid unnecessary re-renders
        setTargets(targetsJson);
        
        if (selectedTarget) {
            const updated = targetsJson.find((t: HarvestTarget) => t.id === selectedTarget.id);
            if (updated) setSelectedTarget(updated);
        }
      }

      if (dataRes.ok) {
        const dataJson = await dataRes.json();
        setData(dataJson);
      }
    } catch (error) {
      console.error("Virtual Backend Error:", error);
    }
  }, [selectedTarget]);

  useEffect(() => {
    // Initial fetch
    fetchData();
    // Poll every 2 seconds for responsive UI updates
    const interval = setInterval(fetchData, 2000); 
    return () => clearInterval(interval);
  }, [fetchData]);

  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Background Gradient Effect */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0 pointer-events-none"></div>

      <div className="relative z-10 max-w-[1600px] mx-auto p-4 md:p-6 flex flex-col h-screen overflow-hidden">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 blur-lg opacity-20 animate-pulse"></div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-700 shadow-xl relative">
                <LayoutDashboard size={24} className="text-emerald-500" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                {t.appTitle}
              </h1>
              <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">{t.appSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <SystemMonitor stats={systemStats} lang={lang} />
            
            <div className="hidden md:flex flex-col items-end gap-2">
                <button 
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1 rounded text-xs font-bold text-slate-300 transition-colors"
                >
                    <Languages size={14} />
                    {lang === 'en' ? '中文' : 'ENGLISH'}
                </button>
                <div className="flex items-center justify-end gap-2 bg-slate-900/50 px-3 py-1.5 rounded border border-slate-800">
                    <Radio className={`w-3 h-3 ${torStatus.status === 'RUNNING' ? 'text-emerald-500 animate-pulse' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold tracking-wider text-slate-400">
                      {torStatus.status === 'RUNNING' ? t.online : 'STANDBY'}
                    </span>
                </div>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          
          {/* Left Control Column */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 min-h-0">
            <div className="flex-[0.4] min-h-[300px]">
              <TorManager status={torStatus} onRefresh={fetchData} lang={lang} />
            </div>
            <div className="flex-[0.6] min-h-0">
              <HarvestManager targets={targets} onUpdate={fetchData} onSelectTarget={setSelectedTarget} lang={lang} />
            </div>
          </div>

          {/* Right Data Column */}
          <div className="lg:col-span-8 xl:col-span-9 min-h-0 flex flex-col">
            <DataViewer data={data} lang={lang} />
          </div>

        </div>
      </div>

      {selectedTarget && (
        <TaskDetailsModal 
            target={selectedTarget} 
            onClose={() => setSelectedTarget(null)} 
            onUpdate={fetchData}
            lang={lang}
        />
      )}
    </div>
  );
}

export default App;