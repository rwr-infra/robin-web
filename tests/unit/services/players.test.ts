import { describe, test, expect, vi, beforeEach } from 'vitest';
import { PlayerService } from '$lib/services/players';
import { PlayerDatabase } from '$lib/models/player.model';
import type { IPlayerItem } from '$lib/models/player.model';

// Mock the request module
vi.mock('$lib/request', () => ({
	request: vi.fn()
}));

// Mock the player-utils module
vi.mock('$lib/share/player-utils', () => ({
	parsePlayerListFromString: vi.fn(),
	parsePlayerListWithPagination: vi.fn()
}));

import { request } from '$lib/request';
import { parsePlayerListFromString, parsePlayerListWithPagination } from '$lib/share/player-utils';

const mockRequest = vi.mocked(request);
const mockParsePlayerListFromString = vi.mocked(parsePlayerListFromString);
const mockParsePlayerListWithPagination = vi.mocked(parsePlayerListWithPagination);

describe('PlayerService', () => {
	const mockPlayers: IPlayerItem[] = [
		{
			id: 'invasion:player1',
			username: 'player1',
			db: PlayerDatabase.INVASION,
			rowNumber: 1,
			rankProgression: 100,
			kills: 50,
			deaths: 25,
			kd: 2.0,
			score: 1000,
			timePlayed: '10h',
			teamkills: 0,
			longestKillStreak: 5,
			targetsDestroyed: 3,
			vehiclesDestroyed: 2,
			soldiersHealed: 10,
			distanceMoved: '5000m',
			shotsFired: 500,
			throwablesThrown: 20,
			rankName: 'Captain',
			rankIcon: null
		},
		{
			id: 'invasion:player2',
			username: 'player2',
			db: PlayerDatabase.INVASION,
			rowNumber: 2,
			rankProgression: 90,
			kills: 40,
			deaths: 20,
			kd: 2.0,
			score: 800,
			timePlayed: '8h',
			teamkills: 1,
			longestKillStreak: 4,
			targetsDestroyed: 2,
			vehiclesDestroyed: 1,
			soldiersHealed: 8,
			distanceMoved: '4000m',
			shotsFired: 400,
			throwablesThrown: 15,
			rankName: 'Lieutenant',
			rankIcon: null
		}
	];

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('list method', () => {
		test('should fetch player list with default parameters', async () => {
			const mockHtmlResponse = '<html><body><table>...</table></body></html>';
			mockRequest.mockResolvedValue(mockHtmlResponse);
			mockParsePlayerListFromString.mockReturnValue(mockPlayers);

			const result = await PlayerService.list({});

			expect(mockRequest).toHaveBeenCalledWith(
				expect.stringContaining('/api/player_list?'),
				expect.objectContaining({}),
				'text'
			);
			expect(mockParsePlayerListFromString).toHaveBeenCalledWith(
				mockHtmlResponse,
				PlayerDatabase.INVASION
			);
			expect(result).toEqual(mockPlayers);
		});

		test('should fetch player list with custom parameters', async () => {
			const mockHtmlResponse = '<html><body><table>...</table></body></html>';
			mockRequest.mockResolvedValue(mockHtmlResponse);
			mockParsePlayerListFromString.mockReturnValue(mockPlayers);

			const params = {
				search: 'test',
				db: PlayerDatabase.PACIFIC as const,
				sort: 'score',
				start: 10,
				size: 50
			};

			const result = await PlayerService.list(params as any);

			expect(mockRequest).toHaveBeenCalledWith(
				expect.stringContaining('search=test&db=pacific&sort=score&start=10&size=50'),
				expect.objectContaining({}),
				'text'
			);
			expect(mockParsePlayerListFromString).toHaveBeenCalledWith(
				mockHtmlResponse,
				PlayerDatabase.PACIFIC
			);
			expect(result).toEqual(mockPlayers);
		});

		test('should add timestamp to request URL', async () => {
			const mockHtmlResponse = '<html><body><table>...</table></body></html>';
			mockRequest.mockResolvedValue(mockHtmlResponse);
			mockParsePlayerListFromString.mockReturnValue(mockPlayers);

			await PlayerService.list({ db: PlayerDatabase.INVASION });

			const callArgs = mockRequest.mock.calls[0];
			const url = callArgs[0] as string;
			expect(url).toMatch(/_t=\d+/);
		});

		test('should pass timeout option to request', async () => {
			const mockHtmlResponse = '<html><body><table>...</table></body></html>';
			mockRequest.mockResolvedValue(mockHtmlResponse);
			mockParsePlayerListFromString.mockReturnValue(mockPlayers);

			await PlayerService.list({ timeout: 5000 });

			expect(mockRequest).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({ timeout: 5000 }),
				'text'
			);
		});

		test('should handle empty player list', async () => {
			const mockHtmlResponse = '<html><body><table></table></body></html>';
			mockRequest.mockResolvedValue(mockHtmlResponse);
			mockParsePlayerListFromString.mockReturnValue([]);

			const result = await PlayerService.list({});

			expect(result).toEqual([]);
		});

		test('should handle API errors gracefully', async () => {
			const mockError = new Error('Network error');
			mockRequest.mockRejectedValue(mockError);

			await expect(PlayerService.list({})).rejects.toThrow('Network error');
		});

		test('should use correct default parameters', async () => {
			const mockHtmlResponse = '<html><body><table>...</table></body></html>';
			mockRequest.mockResolvedValue(mockHtmlResponse);
			mockParsePlayerListFromString.mockReturnValue(mockPlayers);

			await PlayerService.list({});

			const callArgs = mockRequest.mock.calls[0];
			const url = callArgs[0] as string;

			expect(url).toContain('db=invasion');
			expect(url).toContain('start=0');
			expect(url).toContain('size=20');
			// Sort parameter should not be included by default
			expect(url).not.toContain('sort=');
		});

		test('should not include search parameter if not provided', async () => {
			const mockHtmlResponse = '<html><body><table>...</table></body></html>';
			mockRequest.mockResolvedValue(mockHtmlResponse);
			mockParsePlayerListFromString.mockReturnValue(mockPlayers);

			await PlayerService.list({ db: PlayerDatabase.PACIFIC });

			const callArgs = mockRequest.mock.calls[0];
			const url = callArgs[0] as string;

			expect(url).not.toContain('search=');
		});

		test('should handle different databases', async () => {
			const mockHtmlResponse = '<html><body><table>...</table></body></html>';
			mockRequest.mockResolvedValue(mockHtmlResponse);
			mockParsePlayerListFromString.mockReturnValue([]);

			const databases: PlayerDatabase[] = [
				PlayerDatabase.INVASION,
				PlayerDatabase.PACIFIC,
				PlayerDatabase.PRERESET_INVASION
			];

			for (const db of databases) {
				await PlayerService.list({ db });

				const callArgs = mockRequest.mock.calls.at(-1);
				const url = callArgs?.[0] as string;
				expect(url).toContain(`db=${db}`);
			}
		});
	});

	describe('listWithPagination method', () => {
		test('should fetch player list with pagination info', async () => {
			const mockHtmlResponse = '<html><body><table>...</table></body></html>';
			const mockPaginationResult = {
				players: mockPlayers,
				hasNext: true,
				hasPrevious: false
			};

			mockRequest.mockResolvedValue(mockHtmlResponse);
			mockParsePlayerListWithPagination.mockReturnValue(mockPaginationResult);

			const result = await PlayerService.listWithPagination({});

			expect(mockRequest).toHaveBeenCalledWith(
				expect.stringContaining('/api/player_list?'),
				expect.objectContaining({}),
				'text'
			);
			expect(mockParsePlayerListWithPagination).toHaveBeenCalledWith(
				mockHtmlResponse,
				PlayerDatabase.INVASION
			);
			expect(result).toEqual(mockPaginationResult);
		});

		test('should fetch with custom pagination parameters', async () => {
			const mockHtmlResponse = '<html><body><table>...</table></body></html>';
			const mockPaginationResult = {
				players: mockPlayers,
				hasNext: false,
				hasPrevious: true
			};

			mockRequest.mockResolvedValue(mockHtmlResponse);
			mockParsePlayerListWithPagination.mockReturnValue(mockPaginationResult);

			const result = await PlayerService.listWithPagination({
				search: 'test',
				db: PlayerDatabase.PACIFIC,
				sort: 'kills',
				start: 20,
				size: 50
			});

			expect(mockRequest).toHaveBeenCalledWith(
				expect.stringContaining('search=test&db=pacific&sort=kills&start=20&size=50'),
				expect.objectContaining({}),
				'text'
			);
			expect(mockParsePlayerListWithPagination).toHaveBeenCalledWith(
				mockHtmlResponse,
				PlayerDatabase.PACIFIC
			);
			expect(result).toEqual(mockPaginationResult);
		});

		test('should add timestamp to request URL', async () => {
			const mockHtmlResponse = '<html><body><table>...</table></body></html>';
			const mockPaginationResult = {
				players: mockPlayers,
				hasNext: true,
				hasPrevious: false
			};

			mockRequest.mockResolvedValue(mockHtmlResponse);
			mockParsePlayerListWithPagination.mockReturnValue(mockPaginationResult);

			await PlayerService.listWithPagination({ db: PlayerDatabase.INVASION });

			const callArgs = mockRequest.mock.calls[0];
			const url = callArgs[0] as string;
			expect(url).toMatch(/_t=\d+/);
		});

		test('should pass timeout option to request', async () => {
			const mockHtmlResponse = '<html><body><table>...</table></body></html>';
			const mockPaginationResult = {
				players: mockPlayers,
				hasNext: true,
				hasPrevious: false
			};

			mockRequest.mockResolvedValue(mockHtmlResponse);
			mockParsePlayerListWithPagination.mockReturnValue(mockPaginationResult);

			await PlayerService.listWithPagination({ timeout: 3000 });

			expect(mockRequest).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({ timeout: 3000 }),
				'text'
			);
		});

		test('should handle empty result with pagination', async () => {
			const mockHtmlResponse = '<html><body><table></table></body></html>';
			const mockPaginationResult = {
				players: [],
				hasNext: false,
				hasPrevious: false
			};

			mockRequest.mockResolvedValue(mockHtmlResponse);
			mockParsePlayerListWithPagination.mockReturnValue(mockPaginationResult);

			const result = await PlayerService.listWithPagination({});

			expect(result.players).toEqual([]);
			expect(result.hasNext).toBe(false);
			expect(result.hasPrevious).toBe(false);
		});

		test('should handle API errors gracefully', async () => {
			const mockError = new Error('Network error');
			mockRequest.mockRejectedValue(mockError);

			await expect(PlayerService.listWithPagination({})).rejects.toThrow('Network error');
		});

		test('should use correct default parameters', async () => {
			const mockHtmlResponse = '<html><body><table>...</table></body></html>';
			const mockPaginationResult = {
				players: mockPlayers,
				hasNext: true,
				hasPrevious: false
			};

			mockRequest.mockResolvedValue(mockHtmlResponse);
			mockParsePlayerListWithPagination.mockReturnValue(mockPaginationResult);

			await PlayerService.listWithPagination({});

			const callArgs = mockRequest.mock.calls[0];
			const url = callArgs[0] as string;

			expect(url).toContain('db=invasion');
			expect(url).toContain('start=0');
			expect(url).toContain('size=20');
			// Sort parameter should not be included by default
			expect(url).not.toContain('sort=');
		});

		test('should return correct pagination structure', async () => {
			const mockHtmlResponse = '<html><body><table>...</table></body></html>';
			const mockPaginationResult = {
				players: [mockPlayers[0]],
				hasNext: true,
				hasPrevious: true
			};

			mockRequest.mockResolvedValue(mockHtmlResponse);
			mockParsePlayerListWithPagination.mockReturnValue(mockPaginationResult);

			const result = await PlayerService.listWithPagination({});

			expect(result).toHaveProperty('players');
			expect(result).toHaveProperty('hasNext');
			expect(result).toHaveProperty('hasPrevious');
			expect(Array.isArray(result.players)).toBe(true);
			expect(typeof result.hasNext).toBe('boolean');
			expect(typeof result.hasPrevious).toBe('boolean');
		});
	});

	describe('URL construction', () => {
		test('should construct correct URL with all parameters', async () => {
			const mockHtmlResponse = '<html><body><table>...</table></body></html>';
			mockRequest.mockResolvedValue(mockHtmlResponse);
			mockParsePlayerListFromString.mockReturnValue(mockPlayers);

			await PlayerService.list({
				search: 'player',
				db: PlayerDatabase.PACIFIC,
				sort: 'score',
				start: 5,
				size: 25
			});

			const callArgs = mockRequest.mock.calls[0];
			const url = callArgs[0] as string;

			expect(url).toContain('/api/player_list?');
			expect(url).toContain('search=player');
			expect(url).toContain('db=pacific');
			expect(url).toContain('sort=score');
			expect(url).toContain('start=5');
			expect(url).toContain('size=25');
		});

		test('should construct URL with minimal parameters', async () => {
			const mockHtmlResponse = '<html><body><table>...</table></body></html>';
			mockRequest.mockResolvedValue(mockHtmlResponse);
			mockParsePlayerListFromString.mockReturnValue(mockPlayers);

			await PlayerService.list({});

			const callArgs = mockRequest.mock.calls[0];
			const url = callArgs[0] as string;

			// Should have default params
			expect(url).toContain('/api/player_list?');
		});
	});

	describe('sid sort field', () => {
		test('should forward the undocumented sid sort field', async () => {
			mockRequest.mockResolvedValue('<html><body><table>...</table></body></html>');
			mockParsePlayerListWithPagination.mockReturnValue({
				players: mockPlayers,
				hasNext: true,
				hasPrevious: false
			});

			await PlayerService.listWithPagination({
				db: PlayerDatabase.INVASION,
				search: 'SGT.BONETRAIN',
				sort: 'sid',
				size: 20
			});

			const url = mockRequest.mock.calls[0][0] as string;
			expect(url).toContain('sort=sid');
			expect(url).toContain('search=SGT.BONETRAIN');
		});

		test('should still send start=0 when the caller omits it', async () => {
			// Harmless for anchored requests: upstream ignores `start` while `search` is present
			mockRequest.mockResolvedValue('<html><body><table>...</table></body></html>');
			mockParsePlayerListWithPagination.mockReturnValue({
				players: mockPlayers,
				hasNext: true,
				hasPrevious: false
			});

			await PlayerService.listWithPagination({ sort: 'sid', search: 'Someone' });

			const url = mockRequest.mock.calls[0][0] as string;
			expect(url).toContain('start=0');
		});
	});
});
