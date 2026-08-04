// User settings storage management
interface UserSettings {
	autoRefresh: {
		enabled: boolean;
		interval: number;
	};
	visibleColumns: Record<string, boolean>;
	visiblePlayerColumns: Record<string, boolean>;
	layoutMode?: 'fullPage' | 'tableOnly';
	// Future settings can be added here
	theme?: 'light' | 'dark' | 'auto';
	language?: string;
	pageSize?: number;
	[customSettings: string]: unknown;
}

const DEFAULT_SETTINGS: UserSettings = {
	autoRefresh: {
		enabled: false, // 默认关闭
		interval: 5
	},
	visibleColumns: {
		name: true,
		ipAddress: false,
		port: false,
		bots: false,
		country: false,
		mode: false,
		mapId: true,
		playerCount: true,
		playerList: true,
		comment: false,
		dedicated: false,
		mod: false,
		url: false,
		version: false,
		action: true
	},
	visiblePlayerColumns: {
		rowNumber: true,
		username: true,
		kills: true,
		deaths: true,
		score: true,
		kd: true,
		timePlayed: true,
		rankProgression: true,
		rankName: true,
		// Row actions (share, similar accounts) - matches the server table default
		action: true
	},
	layoutMode: 'fullPage' as const
};

const STORAGE_KEY = 'rwrs-user-settings';

class UserSettingsService {
	private settings: UserSettings;

	constructor() {
		this.settings = this.loadSettings();
	}

	// Load settings from localStorage
	private loadSettings(): UserSettings {
		if (typeof globalThis !== 'undefined' && !globalThis.window) {
			return DEFAULT_SETTINGS;
		}

		try {
			if (typeof localStorage === 'undefined') {
				return DEFAULT_SETTINGS;
			}

			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsedSettings = JSON.parse(stored);
				// Merge with defaults to ensure all properties exist
				return this.mergeSettings(DEFAULT_SETTINGS, parsedSettings);
			}
		} catch (error) {
			console.warn('Failed to load user settings from localStorage:', error);
		}

		return DEFAULT_SETTINGS;
	}

	// Save settings to localStorage
	private saveSettings(): void {
		try {
			if (typeof localStorage === 'undefined') {
				return;
			}

			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
		} catch (error) {
			console.warn('Failed to save user settings to localStorage:', error);
		}
	}

	// Merge settings with defaults
	private mergeSettings(defaults: UserSettings, stored: Partial<UserSettings>): UserSettings {
		const merged = { ...defaults };

		// Merge autoRefresh settings
		if (stored.autoRefresh) {
			merged.autoRefresh = {
				...defaults.autoRefresh,
				...stored.autoRefresh
			};
		}

		// Merge visibleColumns
		if (stored.visibleColumns) {
			merged.visibleColumns = {
				...defaults.visibleColumns,
				...stored.visibleColumns
			};
		}

		// Merge visiblePlayerColumns
		if (stored.visiblePlayerColumns) {
			merged.visiblePlayerColumns = {
				...defaults.visiblePlayerColumns,
				...stored.visiblePlayerColumns
			};
		}

		// Merge other properties
		Object.keys(stored).forEach((key) => {
			if (
				key !== 'autoRefresh' &&
				key !== 'visibleColumns' &&
				key !== 'visiblePlayerColumns' &&
				key in stored
			) {
				const mergedRecord = merged as Record<string, unknown>;
				const storedRecord = stored as Record<string, unknown>;
				mergedRecord[key] = storedRecord[key];
			}
		});

		return merged;
	}

	// Get all settings
	getSettings(): UserSettings {
		return { ...this.settings };
	}

	// Get specific setting value
	get<K extends keyof UserSettings>(key: K): UserSettings[K] {
		return this.settings[key];
	}

	// Set specific setting value
	set<K extends keyof UserSettings>(key: K, value: UserSettings[K]): void {
		this.settings[key] = value;
		this.saveSettings();
	}

	// Update nested setting
	updateNested<T extends Record<string, unknown>>(
		parentKey: keyof UserSettings,
		nestedKey: keyof T,
		value: T[keyof T]
	): void {
		const parent = this.settings[parentKey] as T;
		if (parent && typeof parent === 'object') {
			const parentRecord = parent as Record<PropertyKey, unknown>;
			parentRecord[nestedKey as PropertyKey] = value;
			this.saveSettings();
		}
	}

	// Reset all settings to defaults
	reset(): void {
		// Deep copy DEFAULT_SETTINGS to avoid reference issues
		this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
		this.saveSettings();
	}

	// Reset specific setting to default
	resetKey<K extends keyof UserSettings>(key: K): void {
		// Deep copy the specific setting to avoid reference issues
		this.settings[key] = JSON.parse(JSON.stringify(DEFAULT_SETTINGS[key]));
		this.saveSettings();
	}

	// Export settings (for backup/share)
	export(): string {
		return JSON.stringify(this.settings, null, 2);
	}

	// Import settings (for restore)
	import(settingsJson: string): boolean {
		try {
			const parsed = JSON.parse(settingsJson);
			this.settings = this.mergeSettings(DEFAULT_SETTINGS, parsed);
			this.saveSettings();
			return true;
		} catch (error) {
			console.error('Failed to import settings:', error);
			return false;
		}
	}
}

// Create singleton instance
export const userSettingsService = new UserSettingsService();

// Export types
export type { UserSettings };
