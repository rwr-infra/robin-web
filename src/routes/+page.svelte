<script lang="ts">
	import { onMount } from 'svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { userSettingsService, type UserSettings } from '$lib/services/user-settings';
	import type { IColumn, IDisplayServerItem } from '$lib/models/server.model';
	import { columns } from '$lib/config/server-columns';
	import { getMaps, type MapData } from '$lib/services/maps';
	import type { IPlayerColumn, PlayerDatabase, PlayerSortField } from '$lib/models/player.model';
	import { SID_SORT_FIELD } from '$lib/models/player.model';
	import { playerColumns } from '$lib/config/player-columns';
	import { PlayerService } from '$lib/services/players';
	import {
		getUrlState,
		updateUrlState,
		createUrlStateSubscriber,
		type UrlState
	} from '$lib/utils/url-state';
	import analytics from '$lib/utils/analytics';

	// State stores
	import { createServerState } from '$lib/stores/use-server-state.svelte';
	import { createPlayerState } from '$lib/stores/use-player-state.svelte';
	import { createUrlSync } from '$lib/stores/use-url-sync.svelte';
	import { getLayoutMode, setLayoutMode } from '$lib/stores/layout-mode.svelte';

	// Components
	import ControlBar from '$lib/components/ControlBar.svelte';
	import StatsBar from '$lib/components/StatsBar.svelte';
	import ServerView from '$lib/components/ServerView.svelte';
	import PlayerView from '$lib/components/PlayerView.svelte';
	import MapPreview from '$lib/components/MapPreview.svelte';
	import PlayerShareModal from '$lib/components/PlayerShareModal.svelte';
	import ServerShareModal from '$lib/components/ServerShareModal.svelte';
	import GlobalKeyboardSearch from '$lib/components/GlobalKeyboardSearch.svelte';

	// Create state stores
	const serverState = createServerState();
	const playerState = createPlayerState('invasion' as PlayerDatabase);

	// View mode state
	let currentView = $state<'servers' | 'players'>('servers');

	// Local state (not in stores)
	let maps = $state<MapData[]>([]);
	let searchQuery = $state('');
	let searchInputRef = $state<HTMLInputElement | null>(null);
	let mapPreviewData = $state<MapData | undefined>(undefined);
	let mapPreviewShow = $state(false);
	let mapPreviewPosition = $state({ x: 0, y: 0 });

	// Player share modal state
	let playerShareData = $state<import('$lib/models/player.model').IPlayerItem | undefined>(undefined);
	let playerShareShow = $state(false);

	// Server share modal state
	let serverShareData = $state<import('$lib/models/server.model').IDisplayServerItem | undefined>(undefined);
	let serverShareShow = $state(false);
	let serverShareTimestamp = $state<number | undefined>(undefined);

	// Quick filter state
	let activeQuickFilters = $state<string[]>([]);
	let isMultiSelectFilter = $state(false);

	// Mobile expanded cards state
	let mobileExpandedCards = $state<Record<string, boolean>>({});

	// Highlighted username for search results
	let highlightedUsername = $state<string | undefined>(undefined);

	// Update highlighted username when search changes
	// The SID anchor wins: in neighbor mode the anchored player is what the window is about
	$effect(() => {
		if (currentView !== 'players') {
			highlightedUsername = undefined;
		} else if (playerState.sidAnchor) {
			highlightedUsername = playerState.sidAnchor;
		} else if (searchQuery) {
			highlightedUsername = searchQuery.trim();
		} else {
			highlightedUsername = undefined;
		}
	});

	// A missing anchor left neighbor mode, so drop it from the URL as well - otherwise a
	// shared link would keep re-entering a window that cannot be positioned
	$effect(() => {
		if (playerState.sidAnchorMissing) {
			updateUrlState({ sidAnchor: undefined }, true);
		}
	});

	// User settings from localStorage
	const userSettings = $state<UserSettings>(userSettingsService.getSettings());
	let autoRefreshEnabled = $state(userSettings.autoRefresh.enabled);
	let layoutMode = $derived(getLayoutMode());
	const tableOnlyLayoutClasses = 'md:flex-1 md:overflow-hidden md:min-h-0';

	// Visible columns (from user settings)
	let visibleColumns = $state<Record<string, boolean>>({ ...userSettings.visibleColumns });

	// Visible player columns - load from user settings with defaults fallback
	let visiblePlayerColumns = $state<Record<string, boolean>>({ ...userSettings.visiblePlayerColumns });

	// URL sync setup
	const urlSync = createUrlSync({
		serverState,
		playerState,
		onViewChange: (view) => {
			currentView = view;
			if (view === 'players') {
				playerState.loadPlayers({ searchQuery });
			} else {
				serverState.refreshList();
			}
		},
		onSearchChange: (search) => {
			searchQuery = search;
		}
	});

	// Derived server data - uses store's getDerivedData method
	const derivedServerData = $derived(
		serverState.getDerivedData(searchQuery, activeQuickFilters)
	);

	// Derived player data - uses store's getDerivedData method
	const derivedPlayerData = $derived(playerState.getDerivedData());

	// Handle search query changes - reset pagination in stores
	$effect(() => {
		serverState.resetPagination();
		playerState.resetPagination();
	});

	function handleSearchInput(value: string) {
		searchQuery = value;
		serverState.resetPagination();
		playerState.resetPagination();
		updateUrlState({ search: value.trim() || undefined }, true);
		analytics.trackSearch('keyboard');
	}

	/**
	 * A user-driven search replaces the SID anchor: both position the same window upstream,
	 * so keeping neighbor mode would silently ignore what was typed.
	 */
	function leaveSidModeForSearch(): boolean {
		if (!playerState.sidNeighborMode) return false;
		playerState.exitSidNeighborMode();
		updateUrlState({ sidAnchor: undefined, sortColumn: undefined, sortDirection: undefined }, true);
		return true;
	}

	function handleSearchEnter(value: string) {
		if (currentView === 'players') {
			searchQuery = value;
			leaveSidModeForSearch();
			serverState.resetPagination();
			playerState.resetPagination();
			updateUrlState({ search: value.trim() || undefined }, true);
			playerState.loadPlayers({ searchQuery: value });
		}
		analytics.trackSearch('click');
	}

	function handleGlobalSearch(query: string) {
		searchQuery = query;
		serverState.resetPagination();
		playerState.resetPagination();
		handleSearchInput(query);
	}

	function handleSearchClear() {
		searchQuery = '';
		const leftSidMode = leaveSidModeForSearch();
		serverState.resetPagination();
		playerState.resetPagination();
		updateUrlState({ search: undefined }, true);
		// Leaving neighbor mode changes the ordering, so the visible rows are now stale
		if (leftSidMode) {
			playerState.loadPlayers({ searchQuery: '' });
		}
		analytics.trackSearch('click');
	}

	function handlePageChange(page: number) {
		if (currentView === 'servers') {
			serverState.handlePageChange(page);
		} else {
			playerState.handlePageChange(page);
			playerState.loadPlayers({ searchQuery });
		}
		const totalPages = currentView === 'servers' ? derivedServerData.totalPages : derivedPlayerData.totalPages;
		analytics.trackPagination(page, totalPages);
	}

	async function handleLoadMore() {
		if (currentView === 'players') {
			await playerState.handleLoadMore(searchQuery);
		} else {
			serverState.handleLoadMore();
		}
		analytics.trackLoadMore();
	}

	function handleJoin(server: IDisplayServerItem) {
		const url = `steam://rungameid/270150//server_address=${server.ipAddress} server_port=${server.port}`;
		window.open(url, '_blank');
	}

	function onRowAction(event: { item: IDisplayServerItem; action: string }) {
		if (event.action === 'join') {
			handleJoin(event.item);
			analytics.trackServerJoin();
		}
	}

	function onColumnToggle(column: IColumn | IPlayerColumn, visible: boolean) {
		// Use current view to determine which visibility map to update (player/server both have an "action" key)
		if (currentView === 'players') {
			visiblePlayerColumns[column.key as string] = visible;
			userSettingsService.updateNested('visiblePlayerColumns', column.key as string, visible);
		} else {
			visibleColumns[column.key] = visible;
			userSettingsService.updateNested('visibleColumns', column.key, visible);
		}
		analytics.trackColumnVisibility(column.key as string, visible);
	}

	function handleAutoRefreshToggle(enabled: boolean) {
		autoRefreshEnabled = enabled;
		userSettingsService.updateNested('autoRefresh', 'enabled', enabled);
		analytics.trackAutoRefreshToggle(enabled);
	}

	function handleLayoutModeChange(mode: 'fullPage' | 'tableOnly') {
		setLayoutMode(mode);
		analytics.trackEvent('layout_mode_change', { mode });
	}

	function handleQuickFilter(filterId: string) {
		if (isMultiSelectFilter) {
			if (activeQuickFilters.includes(filterId)) {
				activeQuickFilters = activeQuickFilters.filter((id) => id !== filterId);
			} else {
				activeQuickFilters = [...activeQuickFilters, filterId];
			}
		} else {
			activeQuickFilters = activeQuickFilters.includes(filterId) ? [] : [filterId];
		}
		serverState.resetPagination();
		updateUrlState({ quickFilters: activeQuickFilters.length > 0 ? activeQuickFilters : [] }, true);
		analytics.trackQuickFilter(filterId, activeQuickFilters.length);
	}

	function handleMultiSelectChange(checked: boolean) {
		isMultiSelectFilter = checked;
		if (!checked && activeQuickFilters.length > 1) {
			activeQuickFilters = activeQuickFilters.slice(0, 1);
		}
		analytics.trackMultiSelectToggle(checked);
	}

	function handleSort(column: string) {
		serverState.handleSort(column);
		const direction = serverState.sortDirection || 'asc';
		updateUrlState(
			{
				sortColumn: serverState.sortColumn || undefined,
				sortDirection: direction
			},
			true
		);
		analytics.trackColumnSort(column, direction);
	}

	function handlePlayerSort(column: string) {
		playerState.handleSort(column);
		// Clear both sort column and direction from URL when sorting is cleared
		if (playerState.playerSortColumn === null) {
			updateUrlState(
				{
					sortColumn: undefined,
					sortDirection: undefined
				},
				true
			);
		} else {
			updateUrlState(
				{
					sortColumn: playerState.playerSortColumn,
					sortDirection: playerState.playerSortDirection!
				},
				true
			);
		}
		playerState.loadPlayers({ searchQuery });
		analytics.trackColumnSort(column, playerState.playerSortDirection || 'asc');
	}

	/**
	 * Enter "similar accounts" mode for a player: SID ordering anchored on their row.
	 */
	function handleFindNeighbors(player: import('$lib/models/player.model').IPlayerItem) {
		playerState.enterSidNeighborMode(player.username);
		updateUrlState(
			{
				sortColumn: playerState.playerSortColumn ?? undefined,
				sortDirection: undefined,
				sidAnchor: player.username,
				page: undefined
			},
			true
		);
		playerState.loadPlayers({ searchQuery });
		analytics.trackEvent('player_find_neighbors', { player_database: playerState.playerDb });
	}

	function handleExitSidMode() {
		playerState.exitSidNeighborMode();
		updateUrlState(
			{
				sortColumn: undefined,
				sortDirection: undefined,
				sidAnchor: undefined,
				page: undefined
			},
			true
		);
		playerState.loadPlayers({ searchQuery });
	}

	function handleShiftSidWindow(direction: 1 | -1) {
		playerState.shiftSidWindow(direction);
		playerState.loadPlayers({ searchQuery });
		analytics.trackEvent('player_neighbors_shift', {
			action: direction > 0 ? 'next' : 'previous'
		});
	}

	function handleDismissSidAnchorMissing() {
		playerState.dismissSidAnchorMissing();
	}

	function toggleMobileCard(id: string) {
		mobileExpandedCards[id] = !mobileExpandedCards[id];
	}

	function handleMapView(mapData: MapData) {
		mapPreviewData = mapData;
		mapPreviewShow = true;
		mapPreviewPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
		analytics.trackMapPreview();
	}

	function handleMapPreviewClose() {
		mapPreviewShow = false;
	}

	function handlePlayerShare(player: import('$lib/models/player.model').IPlayerItem) {
		playerShareData = player;
		playerShareShow = true;
	}

	function handlePlayerShareClose() {
		playerShareShow = false;
	}

	function handleServerShare(server: import('$lib/models/server.model').IDisplayServerItem) {
		serverShareData = server;
		serverShareShow = true;
		serverShareTimestamp = Date.now();
	}

	function handleServerShareClose() {
		serverShareShow = false;
	}

	/**
	 * Fetch player rankings for all sortable fields
	 * Concurrently queries the Player API for each sort field in descending order,
	 * then finds the row number where the target player appears.
	 */
	async function fetchPlayerRankings(
		player: import('$lib/models/player.model').IPlayerItem
	): Promise<Record<string, number>> {
		// Map of camelCase column keys to snake_case API sort fields
		const sortableFields: Array<{ key: string; sortField: PlayerSortField }> = [
			{ key: 'kills', sortField: 'kills' },
			{ key: 'deaths', sortField: 'deaths' },
			{ key: 'score', sortField: 'score' },
			{ key: 'kd', sortField: 'kd' },
			{ key: 'timePlayed', sortField: 'time_played' },
			{ key: 'longestKillStreak', sortField: 'longest_kill_streak' },
			{ key: 'targetsDestroyed', sortField: 'targets_destroyed' },
			{ key: 'vehiclesDestroyed', sortField: 'vehicles_destroyed' },
			{ key: 'soldiersHealed', sortField: 'soldiers_healed' },
			{ key: 'teamkills', sortField: 'teamkills' },
			{ key: 'distanceMoved', sortField: 'distance_moved' },
			{ key: 'shotsFired', sortField: 'shots_fired' },
			{ key: 'throwablesThrown', sortField: 'throwables_thrown' },
			{ key: 'rankProgression', sortField: 'rank_progression' }
		];

		// Helper function to find player's ranking for a single field
		async function getRankingForField(
			sortField: PlayerSortField
		): Promise<{ key: string; rank: number | null }> {
			const maxRetries = 3;

			for (let attempt = 0; attempt < maxRetries; attempt++) {
				try {
					// Query API with descending sort and username search
					const result = await PlayerService.listWithPagination({
						db: player.db,
						search: player.username,
						sort: sortField,
						size: 20
					});

					// Find the player's position in the results
					const playerIndex = result.players.findIndex((p) => p.username === player.username);

					if (playerIndex !== -1) {
						// SUCCESS: Found the player with valid rank
						const foundPlayer = result.players[playerIndex];
						return { key: sortFieldToKey(sortField), rank: foundPlayer.rowNumber };
					}

					// Player not found in results - retry immediately if attempts remain
					// Don't return null yet, try again
					continue;

				} catch (error: unknown) {
					// Check if this is a retryable error
					const isRetryable = isRetryableError(error);

					if (!isRetryable || attempt === maxRetries - 1) {
						// Last attempt or non-retryable error
						console.error(`Error fetching ranking for ${sortField}:`, error);
						return { key: sortFieldToKey(sortField), rank: null };
					}

					// Immediately retry (no delay)
					continue;
				}
			}

			// All retries exhausted, player genuinely not found
			return { key: sortFieldToKey(sortField), rank: null };
		}

		// Helper function to determine if an error is retryable
		function isRetryableError(error: unknown): boolean {
			// Network errors (TypeError with "Failed to fetch")
			if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
				return true;
			}

			// Timeout errors (AbortError)
			if (error instanceof Error && error.name === 'AbortError') {
				return true;
			}

			// HTTP errors with status code
			if (typeof error === 'object' && error !== null && 'status' in error) {
				const status = (error as { status?: unknown }).status;
				if (typeof status !== 'number') {
					return false;
				}
				// Retry on: 408 (Request Timeout), 429 (Rate Limited), 5xx (Server Errors)
				return status === 408 || status === 429 || status >= 500;
			}

			// Default: don't retry on unknown errors
			return false;
		}

		// Convert snake_case sort field to camelCase key
		function sortFieldToKey(sortField: PlayerSortField): string {
			const keyMap: Record<PlayerSortField, string> = {
				kills: 'kills',
				deaths: 'deaths',
				kd: 'kd',
				score: 'score',
				time_played: 'timePlayed',
				teamkills: 'teamkills',
				longest_kill_streak: 'longestKillStreak',
				targets_destroyed: 'targetsDestroyed',
				vehicles_destroyed: 'vehiclesDestroyed',
				soldiers_healed: 'soldiersHealed',
				distance_moved: 'distanceMoved',
				shots_fired: 'shotsFired',
				throwables_thrown: 'throwablesThrown',
				rank_progression: 'rankProgression',
				username: 'username',
				// SID has no column and no meaningful ranking, it is never queried here
				sid: 'sid'
			};
			return keyMap[sortField] || sortField;
		}

		// Fetch all rankings concurrently
		const rankingsPromises = sortableFields.map((field) => getRankingForField(field.sortField));
		const rankingsResults = await Promise.all(rankingsPromises);

		// Build rankings object, excluding null values
		const rankings: Record<string, number> = {};
		for (const result of rankingsResults) {
			if (result.rank !== null) {
				rankings[result.key] = result.rank;
			}
		}

		return rankings;
	}

	async function loadMaps() {
		try {
			maps = await getMaps();
		} catch (err) {
			console.error('Error loading maps:', err);
		}
	}

	function handleViewChange(view: 'servers' | 'players') {
		currentView = view;
		searchQuery = '';
		// Dropping the SID ordering in state must drop it from the URL too, otherwise a
		// reload or a shared link restores a mode the user just left
		const leavingSidMode = playerState.playerSortColumn === SID_SORT_FIELD;
		playerState.exitSidNeighborMode();
		updateUrlState(
			{
				view,
				search: undefined,
				sidAnchor: undefined,
				...(leavingSidMode ? { sortColumn: undefined, sortDirection: undefined } : {})
			},
			true
		);
		serverState.resetPagination();
		playerState.resetPagination();
		if (view === 'players') {
			playerState.loadPlayers();
		} else {
			serverState.refreshList();
		}
		analytics.trackViewSwitch(view);
	}

	async function handleManualRefresh() {
		if (currentView === 'servers') {
			await serverState.refreshList(true);
		} else {
			await playerState.loadPlayers({ searchQuery });
		}
	}

	async function handleAutoRefresh() {
		if (currentView === 'servers') {
			await serverState.refreshList(false);
		} else {
			await playerState.loadPlayers({ searchQuery });
		}
	}

	function handlePlayerDbChange(db: PlayerDatabase) {
		playerState.handlePlayerDbChange(db);
		updateUrlState({ playerDb: db }, true);
		playerState.loadPlayers({ searchQuery });
		analytics.trackPlayerDatabaseChange(db);
	}

	function handlePlayerPageSizeChange(size: number) {
		playerState.handlePlayerPageSizeChange(size);
		playerState.loadPlayers({ searchQuery });
	}

	function initializeFromUrl() {
		const urlState = getUrlState();

		// Use URL sync to initialize state
		const urlInit = urlSync.initializeFromUrl(urlState);

		// Set local state from URL init results
		if (urlInit.activeQuickFilters) {
			activeQuickFilters = urlInit.activeQuickFilters;
		}
		if (urlInit.initialView) {
			currentView = urlInit.initialView;
		}
		if (urlInit.initialPlayerDb) {
			playerState.handlePlayerDbChange(urlInit.initialPlayerDb);
		}
		// A shared "similar accounts" link restores the anchored SID window
		if (urlState.sidAnchor) {
			playerState.enterSidNeighborMode(urlState.sidAnchor);
		}
	}

	onMount(() => {
		initializeFromUrl();

		const loadData = async () => {
			await loadMaps();
			if (currentView === 'players') {
				await playerState.loadPlayers({ searchQuery });
			} else {
				await serverState.refreshList();
			}
		};
		loadData();

		// Track session start with the actual view from URL
		analytics.trackEvent('session_start', { view: currentView });

		const unsubscribe = createUrlStateSubscriber((urlState: UrlState) => {
			// Handle search changes
			if (urlState.search !== undefined && searchQuery !== (urlState.search || '')) {
				searchQuery = urlState.search || '';
			}

			// Handle quick filter changes
			if (urlState.quickFilters !== undefined) {
				const result = urlSync.handleUrlStateChange(urlState);
				if (result && 'quickFilters' in result && result.quickFilters) {
					activeQuickFilters = result.quickFilters;
				}
			}

			// Handle other URL state changes through urlSync
			urlSync.handleUrlStateChange(urlState);
		});

		return () => {
			unsubscribe?.();
		};
	});
</script>

<section aria-label="Server List" class={`flex flex-col items-center ${layoutMode === 'tableOnly' ? 'md:flex-1 md:min-h-0' : ''}`}>
	<div class={`container flex flex-col px-4 py-2 md:py-3 ${layoutMode === 'tableOnly' ? tableOnlyLayoutClasses : ''}`}>
		<!-- View Tabs -->
		<div role="tablist" class="tabs tabs-border mb-2 md:mb-3 border-mil">
			<button
				role="tab"
				class="tab md:tabs-sm text-mil-secondary"
				class:tab-active={currentView === 'servers'}
				onclick={() => handleViewChange('servers')}
			>
				{m['app.viewMode.servers']()}
			</button>
			<button
				role="tab"
				class="tab md:tabs-sm text-mil-secondary"
				class:tab-active={currentView === 'players'}
				onclick={() => handleViewChange('players')}
			>
				{m['app.viewMode.players']()}
			</button>
		</div>

		<!-- Control Bar -->
		<ControlBar
			{currentView}
			playerDb={playerState.playerDb}
			{searchQuery}
			searchPlaceholder={m['app.search.placeholder']()}
			{autoRefreshEnabled}
			{layoutMode}
			{columns}
			{playerColumns}
			{visibleColumns}
			{visiblePlayerColumns}
			isRefreshing={serverState.manualRefreshLoading}
			onPlayerDbChange={handlePlayerDbChange}
			onRefresh={handleManualRefresh}
			onAutoRefresh={handleAutoRefresh}
			onAutoRefreshToggle={handleAutoRefreshToggle}
			onLayoutModeChange={handleLayoutModeChange}
			onSearchInput={handleSearchInput}
			onSearchEnter={handleSearchEnter}
			onColumnToggle={onColumnToggle}
			onSearchRef={(input) => (searchInputRef = input)}
			onSearchClear={handleSearchClear}
		/>

		<!-- Statistics Bar -->
		<StatsBar
			{currentView}
			serverTotalStats={derivedServerData.totalStats}
			serverFilteredStats={derivedServerData.filteredStats}
			playerTotalStats={derivedPlayerData.totalStats}
			playerFilteredStats={derivedPlayerData.filteredStats}
			{searchQuery}
		/>

		<!-- Content Area -->
		{#if currentView === 'servers'}
			<ServerView
				loading={serverState.loading && serverState.servers.length === 0}
				refreshing={serverState.loading && serverState.servers.length > 0}
				error={serverState.error}
				{searchQuery}
				paginatedServers={derivedServerData.paginatedServers}
				mobilePaginatedServers={derivedServerData.mobilePaginatedServers}
				mobileHasMore={derivedServerData.mobileHasMore}
				mobileLoadingMore={serverState.mobileServerLoadingMore}
				totalPages={derivedServerData.totalPages}
				filteredServersCount={derivedServerData.filteredServers.length}
				{columns}
				{maps}
				{visibleColumns}
				activeFilters={activeQuickFilters}
				isMultiSelect={isMultiSelectFilter}
				currentPage={serverState.currentPage}
				sortColumn={serverState.sortColumn}
				sortDirection={serverState.sortDirection}
				{mobileExpandedCards}
				{layoutMode}
				isManualRefresh={serverState.isManualRefresh}
				onQuickFilter={handleQuickFilter}
				onMultiSelectChange={handleMultiSelectChange}
				onSort={handleSort}
				onPageChange={handlePageChange}
				onLoadMore={handleLoadMore}
				onRowAction={onRowAction}
				onColumnToggle={onColumnToggle}
				onToggleMobileCard={toggleMobileCard}
				onMapView={handleMapView}
				onMapPreviewClose={handleMapPreviewClose}
				onShare={handleServerShare}
			/>
		{:else}
			<PlayerView
				loading={playerState.loading}
				error={playerState.error}
				{searchQuery}
				{highlightedUsername}
				paginatedPlayers={derivedPlayerData.paginatedPlayers}
				mobilePaginatedPlayers={derivedPlayerData.mobilePaginatedPlayers}
				mobileHasMore={derivedPlayerData.mobileHasMore}
				mobileLoadingMore={playerState.mobilePlayerLoadingMore}
				{playerColumns}
				visibleColumns={visiblePlayerColumns}
				currentPage={playerState.currentPage}
				pageSize={playerState.playerPageSize}
				sortColumn={playerState.playerSortColumn}
				{mobileExpandedCards}
				{layoutMode}
				hasNext={playerState.playerHasNext}
				hasPrevious={playerState.playerHasPrevious}
				sidAnchor={playerState.sidAnchor}
				sidSortActive={playerState.playerSortColumn === SID_SORT_FIELD}
				sidAnchorMissing={playerState.sidAnchorMissing}
				onSort={handlePlayerSort}
				onPageChange={handlePageChange}
				onPageSizeChange={handlePlayerPageSizeChange}
				onLoadMore={handleLoadMore}
				onToggleMobileCard={toggleMobileCard}
				onShare={handlePlayerShare}
				onFindNeighbors={handleFindNeighbors}
				onExitSidMode={handleExitSidMode}
				onShiftSidWindow={handleShiftSidWindow}
				onDismissSidAnchorMissing={handleDismissSidAnchorMissing}
			/>
		{/if}
	</div>

	<!-- Global keyboard search -->
	<GlobalKeyboardSearch searchInput={searchInputRef} onSearch={handleGlobalSearch} />

	<!-- Map preview -->
	<MapPreview
		mapData={mapPreviewData}
		show={mapPreviewShow}
		position={mapPreviewPosition}
		key={mapPreviewData?.path}
		onClose={handleMapPreviewClose}
	/>

	<!-- Player share modal -->
	<PlayerShareModal
		player={playerShareData}
		show={playerShareShow}
		onClose={handlePlayerShareClose}
		queryTimestamp={playerState.lastQueryTimestamp}
		onFetchRankings={() => playerShareData ? fetchPlayerRankings(playerShareData) : Promise.resolve({})}
	/>

	<!-- Server share modal -->
	<ServerShareModal
		server={serverShareData}
		maps={maps}
		show={serverShareShow}
		onClose={handleServerShareClose}
		queryTimestamp={serverShareTimestamp}
	/>
</section>
