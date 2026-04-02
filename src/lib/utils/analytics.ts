/**
 * Multi-platform analytics tracking utility for RWR Server Browser
 *
 * Supports:
 * - Google Analytics (gtag)
 * - Baidu Analytics (_hmt)
 * - Umami Analytics
 *
 * Features:
 * - Safe integration with external script detection
 * - Type-safe event tracking
 * - Privacy-preserving search tracking (no query content)
 * - No consent required (auto-enabled)
 * - Debug mode support
 * - Svelte 5 ready
 */

import { browser } from '$app/environment';
import type {
	AnalyticsEventName,
	AnalyticsEventParams,
	AnalyticsConfig
} from '$lib/types/analytics';

// Event category mapping for Baidu Analytics
const BAIDU_CATEGORIES = {
	view_switch: 'navigation',
	theme_change: 'navigation',
	language_change: 'navigation',
	github_link_click: 'navigation',
	discord_link_click: 'navigation',
	steam_rwr1_link_click: 'navigation',
	steam_rwr2_link_click: 'navigation',
	layout_mode_change: 'navigation',
	search_triggered: 'search',
	quick_filter_applied: 'search',
	multi_select_toggle: 'search',
	column_visibility_toggle: 'search',
	server_join_click: 'data',
	map_preview_open: 'data',
	column_sort: 'data',
	pagination_change: 'data',
	load_more_click: 'data',
	auto_refresh_toggle: 'data',
	player_database_change: 'data',
	share_modal_open: 'share',
	share_download: 'share',
	share_copy: 'share',
	server_share_modal_open: 'share',
	server_share_download: 'share',
	server_share_copy: 'share',
	refresh_click: 'engagement',
	page_load: 'engagement',
	session_start: 'engagement'
} as const;

class Analytics {
	private config: AnalyticsConfig;
	private initialized = false;
	private sessionStartTime: number | null = null;

	constructor(config: AnalyticsConfig = {}) {
		this.config = {
			enabled: true,
			debug: import.meta.env.VITE_ANALYTICS_DEBUG === 'true',
			trackPageViews: true,
			...config
		};

		if (browser) {
			this.initialize();
		}
	}

	/**
	 * Check if gtag is available (externally injected script)
	 */
	private isGtagAvailable(): boolean {
		return typeof window !== 'undefined' && typeof window.gtag === 'function';
	}

	/**
	 * Check if _hmt is available (Baidu Analytics)
	 */
	private isHmtAvailable(): boolean {
		return typeof window !== 'undefined' && Array.isArray(window._hmt);
	}

	/**
	 * Check if umami is available (Umami Analytics)
	 */
	private isUmamiAvailable(): boolean {
		return (
			typeof window !== 'undefined' &&
			typeof window.umami === 'object' &&
			typeof window.umami.track === 'function'
		);
	}

	/**
	 * Check if any analytics platform is available
	 */
	private isAnyAvailable(): boolean {
		return this.isGtagAvailable() || this.isHmtAvailable() || this.isUmamiAvailable();
	}

	/**
	 * Initialize analytics tracking
	 */
	private initialize(): void {
		if (this.initialized || !this.config.enabled) {
			return;
		}

		// Only initialize if at least one platform is available
		if (this.isAnyAvailable()) {
			this.initialized = true;
			this.sessionStartTime = Date.now();

			if (this.config.debug) {
				const platforms = [];
				if (this.isGtagAvailable()) platforms.push('gtag');
				if (this.isHmtAvailable()) platforms.push('_hmt');
				if (this.isUmamiAvailable()) platforms.push('umami');
				console.log(`[Analytics] Initialized successfully with: ${platforms.join(', ')}`);
			}
		} else if (this.config.debug) {
			console.warn('[Analytics] No analytics platform available - external scripts not loaded');
		}
	}

	/**
	 * Sanitize event parameters to remove sensitive data
	 * Specifically removes search query content
	 */
	private sanitizeParams(params: AnalyticsEventParams): AnalyticsEventParams {
		const sanitized = { ...params };

		// Remove any potentially sensitive fields
		// Search content should NEVER be sent
		const temp = sanitized as Partial<AnalyticsEventParams>;
		delete temp.search_query;
		delete temp.query;
		delete temp.q;
		delete temp.search;

		return sanitized;
	}

	/**
	 * Convert event name and params to Baidu format
	 */
	private toBaiduEvent(
		eventName: AnalyticsEventName,
		params: AnalyticsEventParams
	): {
		category: string;
		action: string;
		opt_label?: string;
		opt_value?: number;
	} {
		const category = BAIDU_CATEGORIES[eventName] || 'engagement';
		const action = eventName;

		// Build label from params
		const labelParts: string[] = [];
		if (params.view) labelParts.push(`view:${params.view}`);
		if (params.theme) labelParts.push(`theme:${params.theme}`);
		if (params.language) labelParts.push(`lang:${params.language}`);
		if (params.filter_id) labelParts.push(`filter:${params.filter_id}`);
		if (params.column_name) labelParts.push(`col:${params.column_name}`);
		if (params.sort_direction) labelParts.push(`dir:${params.sort_direction}`);
		if (params.player_database) labelParts.push(`db:${params.player_database}`);
		if (params.device_type) labelParts.push(`device:${params.device_type}`);
		if (params.image_format) labelParts.push(`format:${params.image_format}`);
		if (params.share_type) labelParts.push(`type:${params.share_type}`);
		if (params.method) labelParts.push(`method:${params.method}`);

		return {
			category,
			action,
			opt_label: labelParts.length > 0 ? labelParts.join(' | ') : undefined,
			opt_value: params.page ?? params.filter_count ?? undefined
		};
	}

	/**
	 * Track a custom event to all available platforms
	 * @param eventName - The name of the event to track
	 * @param params - Event parameters (without sensitive data)
	 */
	trackEvent(eventName: AnalyticsEventName, params: AnalyticsEventParams = {}): void {
		if (!this.config.enabled || !this.isAnyAvailable()) {
			if (this.config.debug) {
				console.log(`[Analytics] Skipped event: ${eventName}`, params);
			}
			return;
		}

		// Sanitize params to ensure no sensitive data
		const sanitizedParams = this.sanitizeParams(params);

		// Track to Google Analytics (with separate error handling)
		if (this.isGtagAvailable()) {
			try {
				window.gtag!('event', eventName, sanitizedParams);
			} catch (error) {
				console.error('[Analytics] gtag error:', error);
			}
		}

		// Track to Baidu Analytics (with separate error handling)
		if (this.isHmtAvailable()) {
			try {
				const baiduEvent = this.toBaiduEvent(eventName, sanitizedParams);
				window._hmt!.push([
					'_trackEvent',
					baiduEvent.category,
					baiduEvent.action,
					baiduEvent.opt_label,
					baiduEvent.opt_value
				]);
			} catch (error) {
				console.error('[Analytics] _hmt error:', error);
			}
		}

		// Track to Umami Analytics (with separate error handling)
		if (this.isUmamiAvailable()) {
			try {
				// Convert params to umami format (flatten to simple key-value pairs)
				const umamiData: Record<string, string | number | boolean> = {};
				for (const [key, value] of Object.entries(sanitizedParams)) {
					if (value !== undefined) {
						umamiData[key] = value;
					}
				}
				window.umami!.track(eventName, umamiData);
			} catch (error) {
				console.error('[Analytics] umami error:', error);
			}
		}

		if (this.config.debug) {
			console.log(`[Analytics] Tracked: ${eventName}`, sanitizedParams);
		}
	}

	/**
	 * Track page view (for SPA navigation)
	 * @param pagePath - Current page path
	 * @param pageTitle - Current page title
	 */
	trackPageView(pagePath: string, pageTitle?: string): void {
		if (!this.config.trackPageViews || !this.isAnyAvailable()) {
			return;
		}

		// Track to Google Analytics (with separate error handling)
		if (this.isGtagAvailable()) {
			try {
				window.gtag!('event', 'page_view', {
					page_path: pagePath,
					page_title: pageTitle || (typeof document !== 'undefined' ? document.title : '')
				});
			} catch (error) {
				console.error('[Analytics] gtag error:', error);
			}
		}

		// Track to Baidu Analytics (with separate error handling)
		if (this.isHmtAvailable()) {
			try {
				window._hmt!.push(['_trackPageview', pagePath]);
			} catch (error) {
				console.error('[Analytics] _hmt error:', error);
			}
		}

		// Track to Umami Analytics (with separate error handling)
		if (this.isUmamiAvailable()) {
			try {
				window.umami!.trackView(pagePath, pageTitle);
			} catch (error) {
				console.error('[Analytics] umami error:', error);
			}
		}

		if (this.config.debug) {
			console.log('[Analytics] Page view tracked:', pagePath);
		}
	}

	/**
	 * Track view switch between servers and players
	 */
	trackViewSwitch(view: 'servers' | 'players'): void {
		this.trackEvent('view_switch', { view });
	}

	/**
	 * Track theme change
	 */
	trackThemeChange(theme: 'light' | 'dark' | 'system' | 'snow'): void {
		this.trackEvent('theme_change', { theme });
	}

	/**
	 * Track language change
	 */
	trackLanguageChange(language: string): void {
		this.trackEvent('language_change', { language });
	}

	/**
	 * Track search triggered (without query content)
	 */
	trackSearch(method: 'click' | 'keyboard' | 'clear' = 'click'): void {
		this.trackEvent('search_triggered', { method });
	}

	/**
	 * Track quick filter applied
	 */
	trackQuickFilter(filterId: string, activeCount: number): void {
		this.trackEvent('quick_filter_applied', {
			filter_id: filterId,
			filter_count: activeCount
		});
	}

	/**
	 * Track multi-select filter mode toggle
	 */
	trackMultiSelectToggle(enabled: boolean): void {
		this.trackEvent('multi_select_toggle', {
			is_multi_select: enabled
		});
	}

	/**
	 * Track column visibility toggle
	 */
	trackColumnVisibility(columnName: string, visible: boolean): void {
		this.trackEvent('column_visibility_toggle', {
			column_name: columnName,
			visible
		});
	}

	/**
	 * Track server join click
	 */
	trackServerJoin(): void {
		this.trackEvent('server_join_click', {
			action: 'join_server'
		});
	}

	/**
	 * Track map preview open
	 */
	trackMapPreview(): void {
		this.trackEvent('map_preview_open', {
			action: 'view_map'
		});
	}

	/**
	 * Track column sort
	 */
	trackColumnSort(columnName: string, direction: 'asc' | 'desc'): void {
		this.trackEvent('column_sort', {
			column_name: columnName,
			sort_direction: direction
		});
	}

	/**
	 * Track pagination change
	 */
	trackPagination(page: number, totalPages: number): void {
		this.trackEvent('pagination_change', {
			page,
			total_pages: totalPages
		});
	}

	/**
	 * Track load more click (mobile infinite scroll)
	 */
	trackLoadMore(method: 'click' | 'scroll' = 'click'): void {
		this.trackEvent('load_more_click', { method });
	}

	/**
	 * Track auto-refresh toggle
	 */
	trackAutoRefreshToggle(enabled: boolean): void {
		this.trackEvent('auto_refresh_toggle', {
			enabled
		});
	}

	/**
	 * Track player database change
	 */
	trackPlayerDatabaseChange(database: 'invasion' | 'pacific' | 'prereset_invasion'): void {
		this.trackEvent('player_database_change', {
			player_database: database
		});
	}

	/**
	 * Track refresh button click
	 */
	trackRefresh(): void {
		this.trackEvent('refresh_click', {
			action: 'manual_refresh'
		});
	}

	/**
	 * Track GitHub link click
	 */
	trackGitHubClick(): void {
		this.trackEvent('github_link_click', {
			action: 'external_link'
		});
	}

	/**
	 * Track Discord link click
	 */
	trackDiscordClick(): void {
		this.trackEvent('discord_link_click', {
			action: 'external_link'
		});
	}

	/**
	 * Track Steam RWR1 link click
	 */
	trackSteamRwr1Click(): void {
		this.trackEvent('steam_rwr1_link_click', {
			action: 'external_link'
		});
	}

	/**
	 * Track Steam RWR2 link click
	 */
	trackSteamRwr2Click(): void {
		this.trackEvent('steam_rwr2_link_click', {
			action: 'external_link'
		});
	}

	/**
	 * Track share modal open
	 */
	trackShareModalOpen(deviceType: 'desktop' | 'mobile'): void {
		this.trackEvent('share_modal_open', {
			device_type: deviceType
		});
	}

	/**
	 * Track share image download
	 */
	trackShareDownload(deviceType: 'desktop' | 'mobile', success: boolean): void {
		this.trackEvent('share_download', {
			device_type: deviceType,
			image_format: 'png',
			success
		});
	}

	/**
	 * Track share image copy to clipboard
	 */
	trackShareCopy(deviceType: 'desktop' | 'mobile', success: boolean): void {
		this.trackEvent('share_copy', {
			device_type: deviceType,
			image_format: 'png',
			success,
			share_type: 'player'
		});
	}

	/**
	 * Track server share modal open
	 */
	trackServerShareModalOpen(deviceType: 'desktop' | 'mobile'): void {
		this.trackEvent('server_share_modal_open', {
			device_type: deviceType,
			share_type: 'server'
		});
	}

	/**
	 * Track server share image download
	 */
	trackServerShareDownload(deviceType: 'desktop' | 'mobile', success: boolean): void {
		this.trackEvent('server_share_download', {
			device_type: deviceType,
			image_format: 'png',
			success,
			share_type: 'server'
		});
	}

	/**
	 * Track server share image copy to clipboard
	 */
	trackServerShareCopy(deviceType: 'desktop' | 'mobile', success: boolean): void {
		this.trackEvent('server_share_copy', {
			device_type: deviceType,
			image_format: 'png',
			success,
			share_type: 'server'
		});
	}

	/**
	 * Get session duration in seconds
	 */
	getSessionDuration(): number | null {
		if (!this.sessionStartTime) return null;
		return Math.floor((Date.now() - this.sessionStartTime) / 1000);
	}

	/**
	 * Enable/disable analytics
	 */
	setEnabled(enabled: boolean): void {
		this.config.enabled = enabled;
	}

	/**
	 * Set debug mode
	 */
	setDebug(debug: boolean): void {
		this.config.debug = debug;
	}

	/**
	 * Check if analytics is available and ready
	 */
	isReady(): boolean {
		return this.initialized && this.isAnyAvailable();
	}
}

// Create singleton instance
const analytics = new Analytics();

// Export instance and class
export { analytics, Analytics };
export default analytics;
