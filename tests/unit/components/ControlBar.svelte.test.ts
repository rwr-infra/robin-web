/// <reference types="@testing-library/jest-dom" />
import { render, screen, fireEvent } from '@testing-library/svelte/svelte5';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ControlBar from '$lib/components/ControlBar.svelte';
import type { IColumn } from '$lib/models/server.model';
import type { IPlayerColumn } from '$lib/models/player.model';
import { PlayerDatabase } from '$lib/models/player.model';

// Mock child components
vi.mock('$lib/components/TranslatedText.svelte', () => ({
	default: (props: { key: string; fallback?: string }) => {
		const keyToText: Record<string, string> = {
			'app.button.refresh': 'Refresh',
			'app.search.placeholderPlayers': 'Search players...'
		};
		return props.fallback || keyToText[props.key] || props.key;
	}
}));

// Mock SearchInput - minimal mock
vi.mock('$lib/components/SearchInput.svelte', () => ({
	default: (props: any) => {
		return {
			render: () => ({ type: 'div', props: { class: 'search-input-mock' } })
		};
	}
}));

// Mock PlayerDatabaseSelector - minimal mock
vi.mock('$lib/components/PlayerDatabaseSelector.svelte', () => ({
	default: () => ({
		render: () => ({ type: 'div', props: { class: 'db-selector-mock' } })
	})
}));

// Mock ColumnsToggle - minimal mock
vi.mock('$lib/components/ColumnsToggle.svelte', () => ({
	default: () => ({
		render: () => ({ type: 'div', props: { class: 'columns-toggle-mock' } })
	})
}));

// Mock AutoRefresh - minimal mock
vi.mock('$lib/components/AutoRefresh.svelte', () => ({
	default: () => ({
		render: () => ({ type: 'div', props: { class: 'auto-refresh-mock' } })
	})
}));

// Mock messages
vi.mock('$lib/paraglide/messages.js', () => ({
	m: new Proxy(
		{},
		{
			get: (target, prop) => () => prop
		}
	)
}));

describe('ControlBar Component', () => {
	let mockOnPlayerDbChange: ReturnType<typeof vi.fn<(db: PlayerDatabase) => void>>;
	let mockOnRefresh: ReturnType<typeof vi.fn<() => Promise<void>>>;
	let mockOnAutoRefresh: ReturnType<typeof vi.fn<() => Promise<void>>>;
	let mockOnAutoRefreshToggle: ReturnType<typeof vi.fn<(enabled: boolean) => void>>;
	let mockOnLayoutModeChange: ReturnType<typeof vi.fn<(mode: 'fullPage' | 'tableOnly') => void>>;
	let mockOnSearchInput: ReturnType<typeof vi.fn<(value: string) => void>>;
	let mockOnSearchEnter: ReturnType<typeof vi.fn<(value: string) => void>>;
	let mockOnColumnToggle: ReturnType<
		typeof vi.fn<(column: IColumn | IPlayerColumn, visible: boolean) => void>
	>;

	const mockColumns: IColumn[] = [
		{ key: 'name', label: 'Name' },
		{ key: 'score', label: 'Score' }
	];

	const mockPlayerColumns: IPlayerColumn[] = [
		{ key: 'username', label: 'Username' },
		{ key: 'kills', label: 'Kills' }
	];

	const mockVisibleColumns: Record<string, boolean> = {
		name: true,
		score: true
	};

	const mockVisiblePlayerColumns: Record<string, boolean> = {
		username: true,
		kills: true
	};

	beforeEach(() => {
		mockOnPlayerDbChange = vi.fn();
		mockOnRefresh = vi.fn().mockResolvedValue(undefined);
		mockOnAutoRefresh = vi.fn().mockResolvedValue(undefined);
		mockOnAutoRefreshToggle = vi.fn();
		mockOnLayoutModeChange = vi.fn();
		mockOnSearchInput = vi.fn();
		mockOnSearchEnter = vi.fn();
		mockOnColumnToggle = vi.fn();
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('should render with default props for servers view', async () => {
			const { container } = render(ControlBar, {
				props: {
					currentView: 'servers',
					playerDb: PlayerDatabase.INVASION,
					searchQuery: '',
					searchPlaceholder: 'Search servers...',
					autoRefreshEnabled: false,
					layoutMode: 'fullPage',
					columns: mockColumns,
					playerColumns: mockPlayerColumns,
					visibleColumns: mockVisibleColumns,
					visiblePlayerColumns: mockVisiblePlayerColumns,
					onPlayerDbChange: mockOnPlayerDbChange,
					onRefresh: mockOnRefresh,
					onAutoRefresh: mockOnAutoRefresh,
					onAutoRefreshToggle: mockOnAutoRefreshToggle,
					onLayoutModeChange: mockOnLayoutModeChange,
					onSearchInput: mockOnSearchInput,
					onColumnToggle: mockOnColumnToggle
				}
			});

			const wrapper = container.querySelector('.mb-4');
			expect(wrapper).toBeInTheDocument();
		});

		it('should render with default props for players view', async () => {
			const { container } = render(ControlBar, {
				props: {
					currentView: 'players',
					playerDb: PlayerDatabase.INVASION,
					searchQuery: '',
					searchPlaceholder: 'Search servers...',
					autoRefreshEnabled: false,
					layoutMode: 'fullPage',
					columns: mockColumns,
					playerColumns: mockPlayerColumns,
					visibleColumns: mockVisibleColumns,
					visiblePlayerColumns: mockVisiblePlayerColumns,
					onPlayerDbChange: mockOnPlayerDbChange,
					onRefresh: mockOnRefresh,
					onAutoRefresh: mockOnAutoRefresh,
					onAutoRefreshToggle: mockOnAutoRefreshToggle,
					onLayoutModeChange: mockOnLayoutModeChange,
					onSearchInput: mockOnSearchInput,
					onColumnToggle: mockOnColumnToggle
				}
			});

			const wrapper = container.querySelector('.mb-4');
			expect(wrapper).toBeInTheDocument();
		});

		it('should render refresh button', async () => {
			const { container } = render(ControlBar, {
				props: {
					currentView: 'servers',
					playerDb: PlayerDatabase.INVASION,
					searchQuery: '',
					searchPlaceholder: 'Search...',
					autoRefreshEnabled: false,
					layoutMode: 'fullPage',
					columns: mockColumns,
					playerColumns: mockPlayerColumns,
					visibleColumns: mockVisibleColumns,
					visiblePlayerColumns: mockVisiblePlayerColumns,
					onPlayerDbChange: mockOnPlayerDbChange,
					onRefresh: mockOnRefresh,
					onAutoRefresh: mockOnAutoRefresh,
					onAutoRefreshToggle: mockOnAutoRefreshToggle,
					onLayoutModeChange: mockOnLayoutModeChange,
					onSearchInput: mockOnSearchInput,
					onColumnToggle: mockOnColumnToggle
				}
			});

			const button = container.querySelector('.btn-tactical');
			expect(button).toBeInTheDocument();
		});

		it('should have proper layout classes', async () => {
			const { container } = render(ControlBar, {
				props: {
					currentView: 'servers',
					playerDb: PlayerDatabase.INVASION,
					searchQuery: '',
					searchPlaceholder: 'Search...',
					autoRefreshEnabled: false,
					layoutMode: 'fullPage',
					columns: mockColumns,
					playerColumns: mockPlayerColumns,
					visibleColumns: mockVisibleColumns,
					visiblePlayerColumns: mockVisiblePlayerColumns,
					onPlayerDbChange: mockOnPlayerDbChange,
					onRefresh: mockOnRefresh,
					onAutoRefresh: mockOnAutoRefresh,
					onAutoRefreshToggle: mockOnAutoRefreshToggle,
					onLayoutModeChange: mockOnLayoutModeChange,
					onSearchInput: mockOnSearchInput,
					onColumnToggle: mockOnColumnToggle
				}
			});

			const wrapper = container.querySelector('.mb-4');
			expect(wrapper).toHaveClass('flex', 'flex-col', 'items-stretch', 'gap-4');
		});
	});

	describe('User Interactions', () => {
		it('should call onRefresh when refresh button clicked', async () => {
			const { container } = render(ControlBar, {
				props: {
					currentView: 'servers',
					playerDb: PlayerDatabase.INVASION,
					searchQuery: '',
					searchPlaceholder: 'Search...',
					autoRefreshEnabled: false,
					layoutMode: 'fullPage',
					columns: mockColumns,
					playerColumns: mockPlayerColumns,
					visibleColumns: mockVisibleColumns,
					visiblePlayerColumns: mockVisiblePlayerColumns,
					onPlayerDbChange: mockOnPlayerDbChange,
					onRefresh: mockOnRefresh,
					onAutoRefresh: mockOnAutoRefresh,
					onAutoRefreshToggle: mockOnAutoRefreshToggle,
					onLayoutModeChange: mockOnLayoutModeChange,
					onSearchInput: mockOnSearchInput,
					onColumnToggle: mockOnColumnToggle
				}
			});

			const refreshButton = container.querySelector('.btn-tactical');
			if (refreshButton) {
				await fireEvent.click(refreshButton);
			}

			expect(mockOnRefresh).toHaveBeenCalledTimes(1);
		});
	});

	describe('Conditional Rendering', () => {
		it('should render without errors in servers view', async () => {
			const { container } = render(ControlBar, {
				props: {
					currentView: 'servers',
					playerDb: PlayerDatabase.INVASION,
					searchQuery: '',
					searchPlaceholder: 'Search...',
					autoRefreshEnabled: true,
					layoutMode: 'fullPage',
					columns: mockColumns,
					playerColumns: mockPlayerColumns,
					visibleColumns: mockVisibleColumns,
					visiblePlayerColumns: mockVisiblePlayerColumns,
					onPlayerDbChange: mockOnPlayerDbChange,
					onRefresh: mockOnRefresh,
					onAutoRefresh: mockOnAutoRefresh,
					onAutoRefreshToggle: mockOnAutoRefreshToggle,
					onLayoutModeChange: mockOnLayoutModeChange,
					onSearchInput: mockOnSearchInput,
					onColumnToggle: mockOnColumnToggle
				}
			});

			const wrapper = container.querySelector('.mb-4');
			expect(wrapper).toBeInTheDocument();
		});

		it('should render without errors in players view', async () => {
			const { container } = render(ControlBar, {
				props: {
					currentView: 'players',
					playerDb: PlayerDatabase.INVASION,
					searchQuery: '',
					searchPlaceholder: 'Search...',
					autoRefreshEnabled: false,
					layoutMode: 'fullPage',
					columns: mockColumns,
					playerColumns: mockPlayerColumns,
					visibleColumns: mockVisibleColumns,
					visiblePlayerColumns: mockVisiblePlayerColumns,
					onPlayerDbChange: mockOnPlayerDbChange,
					onRefresh: mockOnRefresh,
					onAutoRefresh: mockOnAutoRefresh,
					onAutoRefreshToggle: mockOnAutoRefreshToggle,
					onLayoutModeChange: mockOnLayoutModeChange,
					onSearchInput: mockOnSearchInput,
					onColumnToggle: mockOnColumnToggle
				}
			});

			const wrapper = container.querySelector('.mb-4');
			expect(wrapper).toBeInTheDocument();
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty columns array', async () => {
			const { container } = render(ControlBar, {
				props: {
					currentView: 'servers',
					playerDb: PlayerDatabase.INVASION,
					searchQuery: '',
					searchPlaceholder: 'Search...',
					autoRefreshEnabled: false,
					layoutMode: 'fullPage',
					columns: [],
					playerColumns: [],
					visibleColumns: {},
					visiblePlayerColumns: {},
					onPlayerDbChange: mockOnPlayerDbChange,
					onRefresh: mockOnRefresh,
					onAutoRefresh: mockOnAutoRefresh,
					onAutoRefreshToggle: mockOnAutoRefreshToggle,
					onLayoutModeChange: mockOnLayoutModeChange,
					onSearchInput: mockOnSearchInput,
					onColumnToggle: mockOnColumnToggle
				}
			});

			const wrapper = container.querySelector('.mb-4');
			expect(wrapper).toBeInTheDocument();
		});
	});
});
