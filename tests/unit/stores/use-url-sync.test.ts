import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createUrlSync } from '$lib/stores/use-url-sync.svelte';
import type { UrlState } from '$lib/utils/url-state';
import { PlayerDatabase } from '$lib/models/player.model';
import type { ServerState } from '$lib/stores/use-server-state.svelte';
import type { PlayerState } from '$lib/stores/use-player-state.svelte';

describe('createUrlSync', () => {
	let urlSync: ReturnType<typeof createUrlSync>;
	let mockServerState: ServerState;
	let mockPlayerState: PlayerState;
	let mockOnViewChange: ReturnType<typeof vi.fn<(view: 'servers' | 'players') => void>>;
	let mockOnSearchChange: ReturnType<typeof vi.fn<(search: string) => void>>;

	beforeEach(() => {
		// Mock server state
		mockServerState = {
			setSortState: vi.fn(),
			setServers: vi.fn(),
			handleSort: vi.fn(),
			handlePageChange: vi.fn(),
			handleLoadMore: vi.fn(),
			resetPagination: vi.fn(),
			refreshList: vi.fn(),
			getDerivedData: vi.fn(() => ({
				filteredServers: [],
				totalPages: 0,
				paginatedServers: [],
				totalStats: { totalServers: 0, totalPlayers: 0 },
				filteredStats: { totalServers: 0, totalPlayers: 0 },
				mobilePaginatedServers: [],
				mobileHasMore: false
			})),
			get servers() {
				return [];
			},
			get loading() {
				return false;
			},
			get error() {
				return null;
			},
			get currentPage() {
				return 1;
			},
			get mobileServerCurrentPage() {
				return 1;
			},
			get mobileServerLoadingMore() {
				return false;
			},
			get sortColumn() {
				return null;
			},
			get sortDirection() {
				return null;
			}
		} as unknown as ServerState;

		// Mock player state
		mockPlayerState = {
			setPlayers: vi.fn(),
			handleSort: vi.fn(),
			handlePageChange: vi.fn(),
			handleLoadMore: vi.fn(),
			handlePlayerDbChange: vi.fn(),
			handlePlayerPageSizeChange: vi.fn(),
			resetPagination: vi.fn(),
			loadPlayers: vi.fn(),
			loadPlayersMore: vi.fn(),
			setSortState: vi.fn(),
			getDerivedData: vi.fn(() => ({
				filteredPlayers: [],
				totalPages: 0,
				paginatedPlayers: [],
				totalStats: { totalPlayers: 0, paginatedCount: 0 },
				filteredStats: { totalPlayers: 0, paginatedCount: 0 },
				mobilePaginatedPlayers: [],
				mobileHasMore: false
			})),
			get players() {
				return [];
			},
			get playerDb() {
				return PlayerDatabase.INVASION;
			},
			get loading() {
				return false;
			},
			get refreshing() {
				return false;
			},
			get error() {
				return null;
			},
			get playerHasNext() {
				return false;
			},
			get playerHasPrevious() {
				return false;
			},
			get playerPageSize() {
				return 20;
			},
			get currentPage() {
				return 1;
			},
			get mobilePlayerCurrentPage() {
				return 1;
			},
			get mobilePlayerLoadingMore() {
				return false;
			},
			get playerSortColumn() {
				return null;
			},
			get playerSortDirection() {
				return null;
			}
		} as unknown as PlayerState;

		mockOnViewChange = vi.fn();
		mockOnSearchChange = vi.fn();

		urlSync = createUrlSync({
			serverState: mockServerState,
			playerState: mockPlayerState,
			onViewChange: mockOnViewChange,
			onSearchChange: mockOnSearchChange
		});

		vi.clearAllMocks();
	});

	describe('initializeFromUrl', () => {
		it('should call onSearchChange when search is in URL state', () => {
			const urlState: UrlState = { search: 'test query' };
			urlSync.initializeFromUrl(urlState);

			expect(mockOnSearchChange).toHaveBeenCalledWith('test query');
		});

		it('should not call onSearchChange when search is undefined', () => {
			const urlState: UrlState = {};
			urlSync.initializeFromUrl(urlState);

			expect(mockOnSearchChange).not.toHaveBeenCalled();
		});

		it('should not call onSearchChange when onSearchChange is undefined', () => {
			const urlSyncWithoutCallback = createUrlSync({
				serverState: mockServerState,
				playerState: mockPlayerState,
				onViewChange: mockOnViewChange
			});

			const urlState: UrlState = { search: 'test' };
			urlSyncWithoutCallback.initializeFromUrl(urlState);

			expect(mockOnSearchChange).not.toHaveBeenCalled();
		});

		it('should return active quick filters from URL', () => {
			const urlState: UrlState = {
				quickFilters: ['invasion', 'dominance']
			};

			const result = urlSync.initializeFromUrl(urlState);

			expect(result.activeQuickFilters).toEqual(['invasion', 'dominance']);
		});

		it('should filter out invalid quick filters', () => {
			const urlState: UrlState = {
				quickFilters: ['invasion', 'invalid-filter-id', 'dominance']
			};

			const result = urlSync.initializeFromUrl(urlState);

			// Only valid filter IDs should be returned
			expect(result.activeQuickFilters).not.toContain('invalid-filter-id');
			expect(result.activeQuickFilters).toContain('invasion');
			expect(result.activeQuickFilters).toContain('dominance');
		});

		it('should return empty array for activeQuickFilters when none in URL', () => {
			const urlState: UrlState = {};
			const result = urlSync.initializeFromUrl(urlState);

			expect(result.activeQuickFilters).toEqual([]);
		});

		it('should set sort state on both server and player states', () => {
			const urlState: UrlState = {
				sortColumn: 'name',
				sortDirection: 'desc'
			};

			urlSync.initializeFromUrl(urlState);

			expect(mockServerState.setSortState).toHaveBeenCalledWith('name', 'desc');
			expect(mockPlayerState.setSortState).toHaveBeenCalledWith('name', 'desc');
		});

		it('should not set sort state when only sortColumn is provided', () => {
			const urlState: UrlState = {
				sortColumn: 'name'
			};

			urlSync.initializeFromUrl(urlState);

			expect(mockServerState.setSortState).not.toHaveBeenCalled();
			expect(mockPlayerState.setSortState).not.toHaveBeenCalled();
		});

		it('should return initialView from URL state', () => {
			const urlState: UrlState = { view: 'players' };
			const result = urlSync.initializeFromUrl(urlState);

			expect(result.initialView).toBe('players');
		});

		it('should return undefined initialView when not in URL', () => {
			const urlState: UrlState = {};
			const result = urlSync.initializeFromUrl(urlState);

			expect(result.initialView).toBeUndefined();
		});

		it('should return initialPlayerDb from URL state', () => {
			const urlState: UrlState = { playerDb: PlayerDatabase.PACIFIC };
			const result = urlSync.initializeFromUrl(urlState);

			expect(result.initialPlayerDb).toBe(PlayerDatabase.PACIFIC);
		});

		it('should return undefined initialPlayerDb when not in URL', () => {
			const urlState: UrlState = {};
			const result = urlSync.initializeFromUrl(urlState);

			expect(result.initialPlayerDb).toBeUndefined();
		});
	});

	describe('handleUrlStateChange', () => {
		it('should call onSearchChange when search changes', () => {
			const urlState: UrlState = { search: 'new search' };
			urlSync.handleUrlStateChange(urlState);

			expect(mockOnSearchChange).toHaveBeenCalledWith('new search');
		});

		it('should return quickFilters when they change', () => {
			const urlState: UrlState = { quickFilters: ['invasion'] };
			const result = urlSync.handleUrlStateChange(urlState);

			expect((result as any).quickFilters).toEqual(['invasion']);
		});

		it('should filter out invalid quick filters on change', () => {
			const urlState: UrlState = { quickFilters: ['invasion', 'invalid-id'] };
			const result = urlSync.handleUrlStateChange(urlState);

			expect((result as any).quickFilters).not.toContain('invalid-id');
		});

		it('should set sort state on both states when sortColumn changes', () => {
			const urlState: UrlState = {
				sortColumn: 'kills',
				sortDirection: 'asc'
			};
			urlSync.handleUrlStateChange(urlState);

			expect(mockServerState.setSortState).toHaveBeenCalledWith('kills', 'asc');
			expect(mockPlayerState.setSortState).toHaveBeenCalledWith('kills', 'asc');
		});

		it('should set sort state to null when direction is null', () => {
			const urlState: UrlState = {
				sortColumn: 'name',
				sortDirection: undefined
			};
			urlSync.handleUrlStateChange(urlState);

			expect(mockServerState.setSortState).toHaveBeenCalledWith('name', null);
			expect(mockPlayerState.setSortState).toHaveBeenCalledWith('name', null);
		});

		it('should clear sort state when the URL has no sort parameter', () => {
			// Browser Back to a URL without `sort` must not keep the previous sort
			urlSync.handleUrlStateChange({ search: 'test' });

			expect(mockServerState.setSortState).toHaveBeenCalledWith(null, null);
			expect(mockPlayerState.setSortState).toHaveBeenCalledWith(null, null);
		});

		it('should call onViewChange when view changes', () => {
			const urlState: UrlState = { view: 'players' };
			urlSync.handleUrlStateChange(urlState);

			expect(mockOnViewChange).toHaveBeenCalledWith('players');
		});

		it('should not call onViewChange when view is undefined', () => {
			const urlState: UrlState = {};
			urlSync.handleUrlStateChange(urlState);

			expect(mockOnViewChange).not.toHaveBeenCalled();
		});

		it('should call handlePlayerDbChange when playerDb changes', () => {
			const urlState: UrlState = { playerDb: PlayerDatabase.PACIFIC };
			urlSync.handleUrlStateChange(urlState);

			expect(mockPlayerState.handlePlayerDbChange).toHaveBeenCalledWith(PlayerDatabase.PACIFIC);
		});

		it('should call onViewChange when playerDb changes in players view', () => {
			const urlState: UrlState = {
				view: 'players',
				playerDb: PlayerDatabase.PACIFIC
			};
			urlSync.handleUrlStateChange(urlState);

			expect(mockOnViewChange).toHaveBeenCalledWith('players');
		});

		it('should return empty object when no quickFilters change', () => {
			const urlState: UrlState = { search: 'test' };
			const result = urlSync.handleUrlStateChange(urlState);

			expect(result).toEqual({});
		});
	});

	describe('createSyncFn', () => {
		it('should return a function', () => {
			const syncFn = urlSync.createSyncFn();
			expect(typeof syncFn).toBe('function');
		});

		it('should call handleUrlStateChange when invoked', () => {
			const syncFn = urlSync.createSyncFn();
			const urlState: UrlState = { search: 'test' };

			syncFn(urlState);

			expect(mockOnSearchChange).toHaveBeenCalledWith('test');
		});

		it('should pass urlState to handleUrlStateChange', () => {
			const syncFn = urlSync.createSyncFn();
			const urlState: UrlState = {
				search: 'query',
				view: 'players',
				sortColumn: 'name',
				sortDirection: 'desc'
			};

			syncFn(urlState);

			expect(mockOnSearchChange).toHaveBeenCalledWith('query');
			expect(mockOnViewChange).toHaveBeenCalledWith('players');
			expect(mockServerState.setSortState).toHaveBeenCalledWith('name', 'desc');
			expect(mockPlayerState.setSortState).toHaveBeenCalledWith('name', 'desc');
		});
	});
});
