import { PlayerService } from '$lib/services/players';
import type { IPlayerItem, PlayerDatabase, PlayerSortField } from '$lib/models/player.model';
import { SID_SORT_FIELD, toPlayerSortField } from '$lib/models/player.model';

interface PlayerStats {
	totalPlayers: number;
	paginatedCount: number;
}

interface DerivedPlayerData {
	filteredPlayers: IPlayerItem[];
	totalPages: number;
	paginatedPlayers: IPlayerItem[];
	totalStats: PlayerStats;
	filteredStats: PlayerStats;
	mobilePaginatedPlayers: IPlayerItem[];
	mobileHasMore: boolean;
}

interface LoadPlayersOptions {
	searchQuery?: string;
	start?: number;
}

/**
 * Player state management composable
 * Extracted from +page.svelte for better separation of concerns
 */
export function createPlayerState(initialDb: PlayerDatabase = 'invasion' as PlayerDatabase) {
	// State
	let players = $state<IPlayerItem[]>([]);
	let playerDb = $state<PlayerDatabase>(initialDb);
	let loading = $state(false);
	const refreshing = $state(false);
	let error = $state<string | null>(null);
	let lastQueryTimestamp = $state<number | undefined>(undefined);

	// Pagination state from API
	let playerHasNext = $state(false);
	let playerHasPrevious = $state(false);

	// Local pagination state
	let playerPageSize = $state(20);
	let currentPage = $state(1);
	let mobilePlayerCurrentPage = $state(1);
	let mobilePlayerLoadingMore = $state(false);

	// Sort state
	let playerSortColumn = $state<string | null>(null);
	let playerSortDirection = $state<'asc' | 'desc' | null>(null);

	// "Similar accounts" (SID) neighbor mode state.
	// Upstream orders by Steam ID but never returns the value, so the window is positioned
	// by anchoring on a username: when `search` is present upstream ignores `start` and
	// answers with the window that begins 10 rows before the matched player.
	let sidAnchor = $state<string | null>(null);
	// Absolute start once the user shifts the window; overrides anchor positioning because
	// `start` only works when no `search` is sent.
	let sidWindowStart = $state<number | null>(null);
	// Upstream answers with the first page instead of an error when the anchor is unknown.
	let sidAnchorMissing = $state(false);

	// Calculate statistics
	const calculatePlayerStats = (
		playerList: IPlayerItem[],
		paginatedList?: IPlayerItem[]
	): PlayerStats => {
		return {
			totalPlayers: playerList.length,
			paginatedCount: paginatedList?.length ?? playerList.length
		};
	};

	/**
	 * Resolve the sort field sent to the API.
	 * Neighbor mode always sorts by SID; otherwise the column key is converted and
	 * validated, because an unknown sort value makes upstream return an empty table.
	 */
	function resolveSortParam(): PlayerSortField | undefined {
		if (sidAnchor !== null) {
			return SID_SORT_FIELD;
		}
		return playerSortColumn ? toPlayerSortField(playerSortColumn) : undefined;
	}

	/**
	 * Absolute start of the currently loaded window, derived from the upstream row numbers.
	 */
	function loadedWindowStart(): number {
		const firstRowNumber = players[0]?.rowNumber ?? 1;
		return Math.max(0, firstRowNumber - 1);
	}

	/**
	 * Load players from API
	 */
	async function loadPlayers(options: LoadPlayersOptions = {}): Promise<void> {
		const searchQuery = options.searchQuery ?? '';
		// The anchored request must not send `start` - upstream would ignore it anyway and
		// the window it picks is the whole point of the anchor.
		// Snapshot the anchor: concurrent loads may clear it before this request resolves
		const requestAnchor = sidWindowStart === null ? sidAnchor : null;
		const anchored = requestAnchor !== null;

		try {
			// Always use loading state for consistent UI
			loading = true;

			const sortParam = resolveSortParam();
			// Neighbor mode never forwards the user's search: any `search` value makes upstream
			// ignore `start`, which would snap the window back to the searched player
			const search = anchored
				? requestAnchor
				: sidAnchor !== null
					? undefined
					: searchQuery.trim() || undefined;
			const start = anchored
				? undefined
				: (sidWindowStart ?? options.start ?? (currentPage - 1) * playerPageSize);

			const result = await PlayerService.listWithPagination({
				db: playerDb,
				search,
				sort: sortParam,
				size: playerPageSize,
				start
			});

			players = result.players;
			playerHasNext = result.hasNext;
			playerHasPrevious = result.hasPrevious;
			mobilePlayerCurrentPage = 1;
			lastQueryTimestamp = Date.now();

			if (anchored) {
				const anchorLower = requestAnchor.toLowerCase();
				const anchorFound = result.players.some(
					(player) => (player.username ?? '').toLowerCase() === anchorLower
				);
				if (!anchorFound) {
					// Upstream silently fell back to the first page: leave neighbor mode and
					// surface it, the rows on screen are not this player's neighbors.
					sidAnchorMissing = true;
					sidAnchor = null;
					sidWindowStart = null;
				}
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load player data';
			console.error('Error loading players:', err);
		} finally {
			loading = false;
		}
	}

	/**
	 * Load more players for mobile infinite scroll
	 */
	async function loadPlayersMore(searchQuery: string = ''): Promise<void> {
		try {
			const inNeighborMode = sidAnchor !== null;
			// In neighbor mode the next slice is an absolute offset from the loaded window and
			// must be requested without `search`, otherwise upstream ignores `start`.
			const start = inNeighborMode
				? loadedWindowStart() + (mobilePlayerCurrentPage - 1) * playerPageSize
				: (mobilePlayerCurrentPage - 1) * playerPageSize;

			const sortParam = resolveSortParam();

			const result = await PlayerService.listWithPagination({
				db: playerDb,
				search: inNeighborMode ? undefined : searchQuery.trim() || undefined,
				sort: sortParam,
				size: playerPageSize,
				start
			});

			players = [...players, ...result.players];
			playerHasNext = result.hasNext;
			playerHasPrevious = result.hasPrevious;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load player data';
			console.error('Error loading players:', err);
		}
	}

	/**
	 * Handle sort column change
	 */
	function handleSort(column: string): void {
		// Sorting by a visible column leaves the SID neighbor window
		sidAnchor = null;
		sidWindowStart = null;

		// Toggle sort: if clicking same column, clear it; otherwise set to desc
		if (playerSortColumn === column) {
			playerSortColumn = null;
			playerSortDirection = null;
		} else {
			playerSortColumn = column;
			playerSortDirection = 'desc';
		}

		currentPage = 1;
		mobilePlayerCurrentPage = 1;
		mobilePlayerLoadingMore = false;
	}

	/**
	 * Enter "similar accounts" mode: order by SID and position the window on this player.
	 */
	function enterSidNeighborMode(username: string): void {
		sidAnchor = username;
		sidWindowStart = null;
		sidAnchorMissing = false;
		playerSortColumn = SID_SORT_FIELD;
		// Upstream accepts no direction for sid, so no arrow state is claimed
		playerSortDirection = null;
		currentPage = 1;
		mobilePlayerCurrentPage = 1;
		mobilePlayerLoadingMore = false;
	}

	/**
	 * Leave "similar accounts" mode and drop the SID ordering, which is meaningless on its own.
	 */
	function exitSidNeighborMode(): void {
		sidAnchor = null;
		sidWindowStart = null;
		sidAnchorMissing = false;
		if (playerSortColumn === SID_SORT_FIELD) {
			playerSortColumn = null;
			playerSortDirection = null;
		}
		currentPage = 1;
		mobilePlayerCurrentPage = 1;
		mobilePlayerLoadingMore = false;
	}

	/**
	 * Move the neighbor window one page up or down.
	 * Uses the absolute row numbers of the loaded window because the anchored request
	 * cannot be paginated (upstream ignores `start` while `search` is present).
	 */
	function shiftSidWindow(direction: 1 | -1): void {
		const nextStart = Math.max(0, loadedWindowStart() + direction * playerPageSize);
		sidWindowStart = nextStart;
		mobilePlayerCurrentPage = 1;
		mobilePlayerLoadingMore = false;
	}

	function dismissSidAnchorMissing(): void {
		sidAnchorMissing = false;
	}

	/**
	 * Handle page change
	 */
	function handlePageChange(page: number): void {
		currentPage = page;
	}

	/**
	 * Handle mobile "load more"
	 */
	async function handleLoadMore(searchQuery: string = ''): Promise<boolean> {
		if (!mobilePlayerLoadingMore && playerHasNext) {
			mobilePlayerLoadingMore = true;
			mobilePlayerCurrentPage++;
			await loadPlayersMore(searchQuery);
			mobilePlayerLoadingMore = false;
			return true;
		}
		return false;
	}

	/**
	 * Handle player database change
	 */
	function handlePlayerDbChange(db: PlayerDatabase): void {
		playerDb = db;
		// Row positions differ per database: re-anchor instead of keeping the old offset
		if (sidAnchor !== null) {
			sidWindowStart = null;
		}
	}

	/**
	 * Handle player page size change
	 */
	function handlePlayerPageSizeChange(size: number): void {
		playerPageSize = size;
		currentPage = 1;
		mobilePlayerCurrentPage = 1;
		mobilePlayerLoadingMore = false;
	}

	/**
	 * Reset pagination to page 1
	 */
	function resetPagination(): void {
		currentPage = 1;
		mobilePlayerCurrentPage = 1;
		mobilePlayerLoadingMore = false;
	}

	/**
	 * Get derived/computed player data
	 */
	function getDerivedData(): DerivedPlayerData {
		// Players are already filtered, sorted, and paginated by API
		const paginatedPlayers = players;

		const totalStats = calculatePlayerStats(players);
		const filteredStats = calculatePlayerStats(players, paginatedPlayers);

		// Use hasNext/hasPrevious from API response to determine total pages
		const totalPages = playerHasNext ? currentPage + 1 : currentPage;

		// For mobile, use current page data
		const mobilePaginatedPlayers = players;
		const mobileHasMore = playerHasNext;

		return {
			filteredPlayers: players,
			totalPages,
			paginatedPlayers,
			totalStats,
			filteredStats,
			mobilePaginatedPlayers,
			mobileHasMore
		};
	}

	/**
	 * Set players directly (useful for testing)
	 */
	function setPlayers(newPlayers: IPlayerItem[]): void {
		players = newPlayers;
	}

	/**
	 * Set sort state directly (useful for URL state sync)
	 */
	function setSortState(column: string | null, direction: 'asc' | 'desc' | null): void {
		// The `sort` URL parameter is shared with the server table, whose column keys the
		// player API rejects with an empty table - ignore anything it cannot sort by.
		if (column !== null && toPlayerSortField(column) === undefined) {
			playerSortColumn = null;
			playerSortDirection = null;
			return;
		}
		playerSortColumn = column;
		playerSortDirection = direction;
	}

	return {
		// State getters
		get players() {
			return players;
		},
		get playerDb() {
			return playerDb;
		},
		get loading() {
			return loading;
		},
		get refreshing() {
			return refreshing;
		},
		get error() {
			return error;
		},
		get playerHasNext() {
			return playerHasNext;
		},
		get playerHasPrevious() {
			return playerHasPrevious;
		},
		get playerPageSize() {
			return playerPageSize;
		},
		get currentPage() {
			return currentPage;
		},
		get mobilePlayerCurrentPage() {
			return mobilePlayerCurrentPage;
		},
		get mobilePlayerLoadingMore() {
			return mobilePlayerLoadingMore;
		},
		get playerSortColumn() {
			return playerSortColumn;
		},
		get playerSortDirection() {
			return playerSortDirection;
		},
		get lastQueryTimestamp() {
			return lastQueryTimestamp;
		},
		get sidAnchor() {
			return sidAnchor;
		},
		get sidNeighborMode() {
			return sidAnchor !== null;
		},
		get sidAnchorMissing() {
			return sidAnchorMissing;
		},

		// Methods
		loadPlayers,
		loadPlayersMore,
		handleSort,
		enterSidNeighborMode,
		exitSidNeighborMode,
		shiftSidWindow,
		dismissSidAnchorMissing,
		handlePageChange,
		handleLoadMore,
		handlePlayerDbChange,
		handlePlayerPageSizeChange,
		resetPagination,
		getDerivedData,
		setPlayers,
		setSortState
	};
}

export type PlayerState = ReturnType<typeof createPlayerState>;
