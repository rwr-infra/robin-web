import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPlayerState } from '$lib/stores/use-player-state.svelte';
import { PlayerService } from '$lib/services/players';
import type { IPlayerItem } from '$lib/models/player.model';
import { PlayerDatabase } from '$lib/models/player.model';

// Mock PlayerService
vi.mock('$lib/services/players', () => ({
	PlayerService: {
		listWithPagination: vi.fn()
	}
}));

/**
 * "Similar accounts" mode relies on two upstream behaviours:
 * - `sort=sid` orders by Steam ID but the response never contains the value
 * - while `search` is present `start` is ignored and the window starts 10 rows
 *   before the matched player; an unknown name silently returns the first page
 */
describe('createPlayerState - SID neighbor mode', () => {
	let playerState: ReturnType<typeof createPlayerState>;

	const createWindow = (firstRowNumber: number, usernames: string[]): IPlayerItem[] =>
		usernames.map((username, index) => ({
			id: `invasion:${username}`,
			username,
			db: PlayerDatabase.INVASION,
			rowNumber: firstRowNumber + index,
			rankProgression: 100,
			kills: 10,
			deaths: 5,
			kd: 2,
			score: 5,
			timePlayed: '1h',
			teamkills: 0,
			longestKillStreak: 1,
			targetsDestroyed: 0,
			vehiclesDestroyed: 0,
			soldiersHealed: 0,
			distanceMoved: '1km',
			shotsFired: 100,
			throwablesThrown: 0,
			rankName: 'Private',
			rankIcon: null
		}));

	const mockResponse = (players: IPlayerItem[], hasNext = true, hasPrevious = true) => {
		vi.mocked(PlayerService.listWithPagination).mockResolvedValue({
			players,
			hasNext,
			hasPrevious
		});
	};

	beforeEach(() => {
		playerState = createPlayerState();
		vi.clearAllMocks();
	});

	describe('enterSidNeighborMode', () => {
		it('should anchor the request on the username without sending start', async () => {
			mockResponse(createWindow(91, ['Other', 'Target', 'Another']));

			playerState.enterSidNeighborMode('Target');
			await playerState.loadPlayers({ searchQuery: 'ignored' });

			expect(PlayerService.listWithPagination).toHaveBeenCalledWith(
				expect.objectContaining({
					search: 'Target',
					sort: 'sid',
					start: undefined
				})
			);
			expect(playerState.sidNeighborMode).toBe(true);
			expect(playerState.sidAnchor).toBe('Target');
			expect(playerState.playerSortColumn).toBe('sid');
		});

		it('should claim no sort direction because upstream has none for sid', () => {
			playerState.enterSidNeighborMode('Target');
			expect(playerState.playerSortDirection).toBeNull();
		});

		it('should match the anchor case-insensitively', async () => {
			mockResponse(createWindow(1, ['target']));

			playerState.enterSidNeighborMode('TARGET');
			await playerState.loadPlayers();

			expect(playerState.sidAnchorMissing).toBe(false);
			expect(playerState.sidNeighborMode).toBe(true);
		});

		it('should leave neighbor mode and flag it when the anchor is missing', async () => {
			// Upstream fell back to rank 1 instead of erroring
			mockResponse(createWindow(1, ['Someone', 'SomeoneElse']));

			playerState.enterSidNeighborMode('UnknownPlayer');
			await playerState.loadPlayers();

			expect(playerState.sidAnchorMissing).toBe(true);
			expect(playerState.sidNeighborMode).toBe(false);
			expect(playerState.sidAnchor).toBeNull();
			// Rows on screen really are SID-ordered, so the ordering badge stays truthful
			expect(playerState.playerSortColumn).toBe('sid');
		});

		it('should clear the missing flag when dismissed', async () => {
			mockResponse(createWindow(1, ['Someone']));
			playerState.enterSidNeighborMode('UnknownPlayer');
			await playerState.loadPlayers();

			playerState.dismissSidAnchorMissing();

			expect(playerState.sidAnchorMissing).toBe(false);
		});
	});

	describe('shiftSidWindow', () => {
		beforeEach(async () => {
			mockResponse(createWindow(91, ['A', 'Target', 'C']));
			playerState.enterSidNeighborMode('Target');
			await playerState.loadPlayers();
			vi.mocked(PlayerService.listWithPagination).mockClear();
		});

		it('should request an absolute offset without search so start is honoured', async () => {
			mockResponse(createWindow(110, ['D', 'E']));

			playerState.shiftSidWindow(1);
			await playerState.loadPlayers({ searchQuery: 'ignored' });

			expect(PlayerService.listWithPagination).toHaveBeenCalledWith(
				expect.objectContaining({
					search: undefined,
					sort: 'sid',
					// window top (row 91 -> start 90) plus one page of 20
					start: 110
				})
			);
		});

		it('should keep the anchor so the player stays highlighted while browsing', async () => {
			mockResponse(createWindow(110, ['D', 'E']));

			playerState.shiftSidWindow(1);
			await playerState.loadPlayers();

			expect(playerState.sidAnchor).toBe('Target');
			expect(playerState.sidAnchorMissing).toBe(false);
		});

		it('should clamp backward shifts to the top of the list', async () => {
			mockResponse(createWindow(1, ['A']));

			playerState.shiftSidWindow(-1);
			await playerState.loadPlayers();

			expect(PlayerService.listWithPagination).toHaveBeenCalledWith(
				expect.objectContaining({ start: 70 })
			);

			playerState.shiftSidWindow(-1);
			playerState.shiftSidWindow(-1);
			await playerState.loadPlayers();

			expect(PlayerService.listWithPagination).toHaveBeenLastCalledWith(
				expect.objectContaining({ start: 0 })
			);
		});
	});

	describe('exitSidNeighborMode', () => {
		it('should drop the anchor and the sid ordering', async () => {
			mockResponse(createWindow(91, ['Target']));
			playerState.enterSidNeighborMode('Target');
			await playerState.loadPlayers();

			playerState.exitSidNeighborMode();

			expect(playerState.sidNeighborMode).toBe(false);
			expect(playerState.playerSortColumn).toBeNull();
			expect(playerState.playerSortDirection).toBeNull();
		});

		it('should keep a non-sid sort untouched', () => {
			playerState.handleSort('kills');
			playerState.exitSidNeighborMode();

			expect(playerState.playerSortColumn).toBe('kills');
		});
	});

	describe('interaction with other state', () => {
		it('should leave neighbor mode when a visible column is sorted', async () => {
			mockResponse(createWindow(91, ['Target']));
			playerState.enterSidNeighborMode('Target');
			await playerState.loadPlayers();

			playerState.handleSort('kills');
			await playerState.loadPlayers();

			expect(playerState.sidNeighborMode).toBe(false);
			expect(PlayerService.listWithPagination).toHaveBeenLastCalledWith(
				expect.objectContaining({ sort: 'kills', search: undefined, start: 0 })
			);
		});

		it('should re-anchor after a database change instead of reusing the offset', async () => {
			mockResponse(createWindow(91, ['A', 'Target']));
			playerState.enterSidNeighborMode('Target');
			await playerState.loadPlayers();
			playerState.shiftSidWindow(1);

			playerState.handlePlayerDbChange(PlayerDatabase.PACIFIC);
			mockResponse(createWindow(41, ['Target']));
			await playerState.loadPlayers();

			expect(PlayerService.listWithPagination).toHaveBeenLastCalledWith(
				expect.objectContaining({
					db: PlayerDatabase.PACIFIC,
					search: 'Target',
					start: undefined
				})
			);
		});

		it('should append the next absolute slice on mobile load more', async () => {
			mockResponse(createWindow(91, ['A', 'Target']));
			playerState.enterSidNeighborMode('Target');
			await playerState.loadPlayers();

			mockResponse(createWindow(111, ['B']));
			await playerState.handleLoadMore();

			expect(PlayerService.listWithPagination).toHaveBeenLastCalledWith(
				expect.objectContaining({ search: undefined, sort: 'sid', start: 110 })
			);
			expect(playerState.players).toHaveLength(3);
		});
	});

	describe('setSortState validation', () => {
		it('should keep sid coming from a shared URL', () => {
			playerState.setSortState('sid', null);
			expect(playerState.playerSortColumn).toBe('sid');
		});

		it('should keep valid player columns', () => {
			playerState.setSortState('rankProgression', 'desc');
			expect(playerState.playerSortColumn).toBe('rankProgression');
		});

		it('should drop values the player API would answer with an empty table', () => {
			playerState.setSortState('totalPlayers', 'desc');

			expect(playerState.playerSortColumn).toBeNull();
			expect(playerState.playerSortDirection).toBeNull();
		});

		it('should not send a dropped sort value to the API', async () => {
			mockResponse(createWindow(1, ['A']));
			playerState.setSortState('ipAddress', 'asc');

			await playerState.loadPlayers();

			expect(PlayerService.listWithPagination).toHaveBeenCalledWith(
				expect.objectContaining({ sort: undefined })
			);
		});
	});
});
