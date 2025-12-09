import React, { useState, useMemo } from 'react';
import { Database, Download, ExternalLink, Film, Tag, FileText, Search, Filter } from 'lucide-react';
import { HarvestedData, Language } from './types';
import { translations } from '../i18n';

interface DataViewerProps {
    data: HarvestedData[];
    lang: Language;
}

const DataViewer: React.FC<DataViewerProps> = ({ data, lang }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const t = translations[lang];

    const handleExport = () => {
        window.open('/api/data?export=json', '_blank');
    };

    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        const term = searchTerm.toLowerCase();
        return data.filter(item => 
            item.url.toLowerCase().includes(term) ||
            item.content_snippet.toLowerCase().includes(term) ||
            item.matched_keywords.toLowerCase().includes(term) ||
            (item.video_title && item.video_title.toLowerCase().includes(term)) ||
            (item.tags && item.tags.toLowerCase().includes(term))
        );
    }, [data, searchTerm]);

    return (
        <div className="bg-slate-800/80 backdrop-blur rounded-lg border border-slate-700 shadow-xl flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-800/50">
                <h2 className="text-lg font-bold flex items-center text-slate-100">
                    <Database className="mr-2 text-purple-400 w-5 h-5" /> 
                    {t.intelligenceStore}
                    <span className="ml-2 bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">{filteredData.length}</span>
                </h2>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-2.5 top-2 text-slate-500 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder={t.search} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-md pl-9 pr-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 placeholder-slate-500 transition-all"
                        />
                    </div>
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-md text-xs font-bold text-slate-200 transition-colors border border-slate-600"
                    >
                        <Download size={14} />
                        {t.exportJson}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto relative custom-scrollbar">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="text-xs uppercase bg-slate-900/80 text-slate-400 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                        <tr>
                            <th className="px-4 py-3 font-semibold tracking-wider w-32">{t.timestamp}</th>
                            <th className="px-4 py-3 font-semibold tracking-wider">{t.source}</th>
                            <th className="px-4 py-3 font-semibold tracking-wider">{t.matches}</th>
                            <th className="px-4 py-3 font-semibold tracking-wider w-1/3">{t.preview}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {filteredData.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-12 text-center text-slate-600">
                                    <div className="flex flex-col items-center justify-center">
                                        <Filter className="w-8 h-8 mb-2 opacity-20" />
                                        <span>{t.noData}</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {filteredData.map(item => (
                            <tr key={item.id} className="hover:bg-slate-700/20 transition-colors group">
                                <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-500 align-top pt-4">
                                    {item.timestamp}
                                </td>
                                <td className="px-4 py-3 align-top max-w-[250px]">
                                    <div className="font-bold text-slate-200 mb-1.5 flex items-start gap-2">
                                        <div className="mt-0.5 min-w-[16px]">
                                            {item.video_url ? <Film size={16} className="text-blue-400" /> : <FileText size={16} className="text-slate-500" />}
                                        </div>
                                        <span className="leading-tight">{item.video_title || 'Untitled Resource'}</span>
                                    </div>
                                    <div className="flex flex-col gap-1.5 pl-6">
                                        <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-blue-400 truncate transition-colors">
                                            <ExternalLink size={10} /> 
                                            <span className="truncate">{item.url}</span>
                                        </a>
                                    </div>
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {item.matched_keywords.split(',').filter(Boolean).map((k, i) => (
                                            <span key={i} className="bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-medium border border-emerald-800/50 shadow-sm">
                                                {k.trim()}
                                            </span>
                                        ))}
                                    </div>
                                    {item.tags && (
                                        <div className="flex flex-wrap gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                            {item.tags.split(',').map((tag, i) => (
                                                <span key={`tag-${i}`} className="flex items-center text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/50">
                                                    <Tag size={8} className="mr-1 opacity-50" /> {tag.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-slate-300 font-mono text-[11px] align-top leading-relaxed">
                                    <div className="line-clamp-3 opacity-80 bg-slate-900/30 p-2 rounded border border-slate-800">
                                        {item.content_snippet || <span className="text-slate-600 italic">No text content extracted.</span>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataViewer;