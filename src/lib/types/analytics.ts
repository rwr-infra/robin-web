/**
 * Analytics event types and type definitions for Google Analytics (gtag), Baidu Analytics (_hmt), and Umami tracking
 */

// Supported event names
export type AnalyticsEventName =
	// Navigation & View Events
	| 'view_switch'
	| 'theme_change'
	| 'language_change'
	| 'github_link_click'
	| 'discord_link_click'
	| 'steam_rwr1_link_click'
	| 'steam_rwr2_link_click'
	| 'layout_mode_change'
	// Search & Filter Events
	| 'search_triggered'
	| 'quick_filter_applied'
	| 'multi_select_toggle'
	| 'column_visibility_toggle'
	// Data Interaction Events
	| 'server_join_click'
	| 'map_preview_open'
	| 'column_sort'
	| 'pagination_change'
	| 'load_more_click'
	| 'auto_refresh_toggle'
	| 'player_database_change'
	| 'player_find_neighbors'
	| 'player_neighbors_shift'
	// Share Events
	| 'share_modal_open'
	| 'share_download'
	| 'share_copy'
	| 'server_share_modal_open'
	| 'server_share_download'
	| 'server_share_copy'
	// Engagement Events
	| 'refresh_click'
	| 'page_load'
	| 'session_start';

// Event parameters interface
export interface AnalyticsEventParams {
	// Common parameters
	view?: 'servers' | 'players';
	theme?: 'light' | 'dark' | 'system' | 'snow';
	language?: string;

	// Filter & search params
	filter_id?: string;
	filter_count?: number;
	is_multi_select?: boolean;

	// Sort params
	column_name?: string;
	sort_direction?: 'asc' | 'desc';

	// Pagination params
	page?: number;
	total_pages?: number;
	page_size?: number;

	// Player database
	player_database?: 'invasion' | 'pacific' | 'prereset_invasion';

	// Share params
	device_type?: 'desktop' | 'mobile';
	image_format?: 'png';
	success?: boolean;
	share_type?: 'player' | 'server';

	// Action params
	action?: string;
	method?: 'click' | 'keyboard' | 'clear' | 'scroll' | 'auto';
	visible?: boolean;
	enabled?: boolean;

	// Custom params
	[key: string]: string | number | boolean | undefined;
}

// Configuration interface
export interface AnalyticsConfig {
	enabled?: boolean;
	debug?: boolean;
	trackPageViews?: boolean;
}

// gtag global interface (also added to app.d.ts for global access)
export interface GTag {
	(command: 'config' | 'js', target: string, config?: unknown): void;
	(command: 'event' | 'js', eventName: string, eventParams?: AnalyticsEventParams): void;
	(command: 'set', target: 'user_properties', config: Record<string, unknown>): void;
	(command: 'consent', consent: 'update' | 'default', config: Record<string, string>): void;
}

// Baidu Analytics _hmt interface
export interface HMT {
	push: (command: unknown[]) => void;
}

// Event mapping for Baidu Analytics
export interface BaiduEventCategory {
	navigation: string;
	search: string;
	data: string;
	engagement: string;
}

// Baidu event type
export interface BaiduEvent {
	category: string;
	action: string;
	opt_label?: string;
	opt_value?: number;
}

// Umami Analytics interface
export interface Umami {
	track: (eventName: string, data?: Record<string, string | number | boolean>) => void;
	trackView: (url?: string, name?: string) => void;
}
