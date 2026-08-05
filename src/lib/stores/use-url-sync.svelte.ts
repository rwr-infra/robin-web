import type { UrlState } from '$lib/utils/url-state';
import { filters as quickFilters } from '$lib/utils/quick-filters';
import type { PlayerDatabase } from '$lib/models/player.model';
import type { ServerState } from './use-server-state.svelte';
import type { PlayerState } from './use-player-state.svelte';

interface UrlSyncOptions {
	serverState: ServerState;
	playerState: PlayerState;
	onViewChange?: (view: 'servers' | 'players') => void;
	onSearchChange?: (search: string) => void;
}

/**
 * URL state synchronization composable
 * Extracted from +page.svelte for better separation of concerns
 *
 * Handles:
 * - Initializing state from URL parameters
 * - Subscribing to URL changes
 * - Syncing state with URL
 */
export function createUrlSync(options: UrlSyncOptions) {
	const { serverState, playerState, onViewChange, onSearchChange } = options;

	/**
	 * Initialize state from URL parameters on mount
	 */
	function initializeFromUrl(urlState: UrlState): {
		activeQuickFilters: string[];
		initialView: 'servers' | 'players' | undefined;
		initialPlayerDb: PlayerDatabase | undefined;
	} {
		// Initialize search query
		if (urlState.search !== undefined && onSearchChange) {
			onSearchChange(urlState.search);
		}

		// Initialize quick filters (will be returned for component to set)
		let activeQuickFilters: string[] = [];
		if (urlState.quickFilters && urlState.quickFilters.length > 0) {
			activeQuickFilters = urlState.quickFilters.filter((filterId) =>
				quickFilters.some((filter) => filter.id === filterId)
			);
		}

		// Initialize sort state - apply to both server and player states.
		// playerState drops values its API cannot sort by (e.g. server column keys).
		if (urlState.sortColumn && urlState.sortDirection) {
			serverState.setSortState(urlState.sortColumn, urlState.sortDirection);
			playerState.setSortState(urlState.sortColumn, urlState.sortDirection);
		}

		// Return the active filters for the component to set
		return {
			activeQuickFilters,
			initialView: urlState.view as 'servers' | 'players' | undefined,
			initialPlayerDb: urlState.playerDb as PlayerDatabase | undefined
		};
	}

	/**
	 * Handle URL state changes from browser back/forward
	 */
	function handleUrlStateChange(urlState: UrlState): { quickFilters?: string[] } | void {
		// Search query change
		if (urlState.search !== undefined && onSearchChange) {
			onSearchChange(urlState.search);
		}

		// Quick filters change - returned at the end so the remaining state still syncs
		// (the URL subscriber always sends a quickFilters array, so returning here would
		// make every state change below unreachable)
		const validFilters = urlState.quickFilters?.filter((filterId) =>
			quickFilters.some((filter) => filter.id === filterId)
		);

		// Sort state change - sync to both states. The URL is authoritative here, so a URL
		// without `sort` (e.g. after browser Back) has to clear the previous sort as well.
		serverState.setSortState(urlState.sortColumn ?? null, urlState.sortDirection || null);
		playerState.setSortState(urlState.sortColumn ?? null, urlState.sortDirection || null);

		// Similar accounts anchor change (browser back/forward on a shared window)
		if (urlState.sidAnchor) {
			if (urlState.sidAnchor !== playerState.sidAnchor) {
				playerState.enterSidNeighborMode(urlState.sidAnchor);
			}
		} else if (playerState.sidNeighborMode) {
			playerState.exitSidNeighborMode();
		}

		// View mode change
		if (urlState.view !== undefined && onViewChange) {
			onViewChange(urlState.view);
		}

		// Player database change
		if (urlState.playerDb !== undefined) {
			playerState.handlePlayerDbChange(urlState.playerDb);
			// Trigger load if in players view
			if (urlState.view === 'players' && onViewChange) {
				onViewChange('players');
			}
		}

		return validFilters !== undefined ? { quickFilters: validFilters } : {};
	}

	/**
	 * Create a sync function for URL subscriber
	 */
	function createSyncFn() {
		return (urlState: UrlState) => {
			handleUrlStateChange(urlState);
		};
	}

	return {
		initializeFromUrl,
		handleUrlStateChange,
		createSyncFn
	};
}

export type UrlSync = ReturnType<typeof createUrlSync>;
