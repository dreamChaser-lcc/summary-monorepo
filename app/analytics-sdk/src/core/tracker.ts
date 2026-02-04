
import { TrackerConfig, ReportPayload } from '../types';
import { getVisitorId, sendRequest } from '../utils';

export class TrackerCore {
  private config: TrackerConfig;
  private uuid: string;

  constructor(config: TrackerConfig) {
    this.config = config;
    this.uuid = getVisitorId();
  }

  /**
   * Report a Page View
   */
  public trackPV() {
    this.report('pv', {});
  }

  /**
   * Report a custom event
   */
  public trackEvent(eventName: string, params: Record<string, any> = {}) {
    this.report('event', { eventName, params });
  }

  /**
   * Internal report method
   */
  private report(type: 'pv' | 'event', data: any) {
    const payload: ReportPayload = {
      appId: this.config.appId,
      uuid: this.uuid,
      type,
      url: window.location.href,
      referrer: document.referrer,
      timestamp: Date.now(),
      data,
      meta: {
        ua: navigator.userAgent,
        screen: `${window.screen.width}x${window.screen.height}`,
      },
    };

    if (this.config.debug) {
      console.log(`[AnalyticsSDK] Reporting ${type}:`, payload);
    }

    sendRequest(this.config.reportUrl, payload);
  }
}
