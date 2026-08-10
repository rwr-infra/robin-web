import { describe, it, expect } from 'vitest';
import * as components from '$lib/components';

describe('components barrel file', () => {
	const expectedExports = [
		'AutoRefresh',
		'ColumnsToggle',
		'GlobalKeyboardSearch',
		'LanguageSwitcher',
		'MapPreview',
		'ServerTable',
		'PlayerTable',
		'MobileInfiniteScroll',
		'Pagination',
		'QuickFilterButtons',
		'SearchInput',
		'ThemeToggle',
		'TranslatedText',
		'DataField',
		'ModalShell',
		'PlayerDatabaseSelector',
		'ControlBar',
		'StatsBar',
		'ServerView',
		'PlayerView'
	];

	it('should export all expected components', () => {
		expectedExports.forEach((exportName) => {
			expect(components).toHaveProperty(exportName);
		});
	});

	it('all exports should be functions (Svelte components)', () => {
		Object.values(components).forEach((exported) => {
			// Svelte components are functions
			expect(typeof exported).toBe('function');
		});
	});

	it('should export AutoRefresh component', () => {
		expect(components.AutoRefresh).toBeDefined();
		expect(typeof components.AutoRefresh).toBe('function');
	});

	it('should export ServerTable component', () => {
		expect(components.ServerTable).toBeDefined();
		expect(typeof components.ServerTable).toBe('function');
	});

	it('should export PlayerTable component', () => {
		expect(components.PlayerTable).toBeDefined();
		expect(typeof components.PlayerTable).toBe('function');
	});

	it('should export MapPreview component', () => {
		expect(components.MapPreview).toBeDefined();
		expect(typeof components.MapPreview).toBe('function');
	});

	it('should export TranslatedText component', () => {
		expect(components.TranslatedText).toBeDefined();
		expect(typeof components.TranslatedText).toBe('function');
	});
});
