export type Language = 'en' | 'zh';

export interface TorStatus {
    status: string;
    platform: string;
    ip?: string;
    logs?: string[];
}

export interface HarvestTarget {
    id: number;
    type: 'targeted' | 'global';
    url?: string;
    keywords: string;
    proxy_mode: 'tor' | 'custom' | 'direct';
    proxy_url?: string;
    last_run: string | null;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'stopped';
}

export interface HarvestLog {
    id: number;
    target_id: number;
    timestamp: string;
    level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
    message: string;
}

export interface HarvestedData {
    id: number;
    target_id: number;
    url: string;
    content_snippet: string;
    matched_keywords: string;
    timestamp: string;
    video_url?: string; // Optional, might not always be present
    video_title?: string;
    tags?: string;
}

export interface SystemStatus {
    cpu_percent: number;
    memory_percent: number;
    disk_usage: number;
}