
export interface TrackerConfig {
  reportUrl: string;
  appId: string;
  autoTrack?: boolean; // PV
  autoClick?: boolean; // Click (Full Auto Track)
  debug?: boolean;
}

export interface EventData {
  eventName: string;
  params?: Record<string, any>;
  timestamp?: number;
}

export interface ReportPayload {
  appId: string;
  uuid: string; // User/Device ID
  type: 'pv' | 'event';
  url: string;
  referrer: string;
  timestamp: number;
  data?: any;
  meta: {
    ua: string;
    screen: string;
  };
}
