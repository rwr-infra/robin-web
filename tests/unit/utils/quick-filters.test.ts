import { describe, test, expect } from 'vitest';
import { filters } from '$lib/utils/quick-filters';
import type { IDisplayServerItem } from '$lib/models/server.model';

// Helper function to create mock server data
const createMockServer = (overrides: Partial<IDisplayServerItem> = {}): IDisplayServerItem => ({
	id: '1',
	name: 'Test Server',
	ipAddress: '192.168.1.1',
	port: 27015,
	mapId: 'test_map',
	mapName: 'Test Map',
	bots: 0,
	country: 'US',
	currentPlayers: 10,
	timeStamp: 1234567890,
	version: '1.0',
	dedicated: true,
	mod: false,
	playerList: [],
	comment: '',
	url: '',
	maxPlayers: 32,
	mode: 'COOP',
	realm: null,
	...overrides
});

describe('Quick Filters', () => {
	describe('filter definitions', () => {
		test('should have correct filter structure', () => {
			filters.forEach((filter) => {
				expect(filter).toHaveProperty('id');
				expect(filter).toHaveProperty('labelKey');
				expect(filter).toHaveProperty('defaultLabel');
				expect(filter).toHaveProperty('filter');
				expect(typeof filter.filter).toBe('function');
			});
		});

		test('should have unique filter IDs', () => {
			const filterIds = filters.map((f) => f.id);
			const uniqueIds = new Set(filterIds);
			expect(uniqueIds.size).toBe(filterIds.length);
		});
	});

	describe('invasion filter', () => {
		const invasionFilter = filters.find((f) => f.id === 'invasion')!;

		test('should match official invasion realm', () => {
			const server = createMockServer({ realm: 'official_invasion' });
			expect(invasionFilter.filter(server)).toBe(true);
		});

		test('should not match other realms', () => {
			const server1 = createMockServer({ realm: 'official_pacific' });
			const server2 = createMockServer({ realm: 'official_dominance' });
			const server3 = createMockServer({ realm: null });

			expect(invasionFilter.filter(server1)).toBe(false);
			expect(invasionFilter.filter(server2)).toBe(false);
			expect(invasionFilter.filter(server3)).toBe(false);
		});
	});

	describe('ww2_invasion filter', () => {
		const ww2Filter = filters.find((f) => f.id === 'ww2_invasion')!;

		test('should match official pacific realm', () => {
			const server = createMockServer({ realm: 'official_pacific' });
			expect(ww2Filter.filter(server)).toBe(true);
		});

		test('should not match other realms', () => {
			const server1 = createMockServer({ realm: 'official_invasion' });
			const server2 = createMockServer({ realm: 'official_dominance' });
			const server3 = createMockServer({ realm: null });

			expect(ww2Filter.filter(server1)).toBe(false);
			expect(ww2Filter.filter(server2)).toBe(false);
			expect(ww2Filter.filter(server3)).toBe(false);
		});
	});

	describe('dominance filter', () => {
		const dominanceFilter = filters.find((f) => f.id === 'dominance')!;

		test('should match official dominance realm', () => {
			const server = createMockServer({ realm: 'official_dominance' });
			expect(dominanceFilter.filter(server)).toBe(true);
		});

		test('should not match other realms', () => {
			const server1 = createMockServer({ realm: 'official_invasion' });
			const server2 = createMockServer({ realm: 'official_pacific' });
			const server3 = createMockServer({ realm: null });

			expect(dominanceFilter.filter(server1)).toBe(false);
			expect(dominanceFilter.filter(server2)).toBe(false);
			expect(dominanceFilter.filter(server3)).toBe(false);
		});
	});

	describe('castling filter', () => {
		const castlingFilter = filters.find((f) => f.id === 'castling')!;
		const realCastlingNames = [
			'[Castling-3][EZ][230%]',
			'[Castling-1][EZ][200%]',
			'[Castling-2][Normal][200%]',
			'[Castling-4][Normal][200%]',
			'[Castling][NetherLand LV4]'
		];

		test('should match castling servers with correct name format', () => {
			realCastlingNames.forEach((name) => {
				const server = createMockServer({
					mode: 'Castling',
					name
				});

				expect(castlingFilter.filter(server)).toBe(true);
			});
		});

		test('should not match servers with wrong mode', () => {
			const server = createMockServer({
				mode: 'COOP',
				name: '[Castling-1][EZ][200%]'
			});

			expect(castlingFilter.filter(server)).toBe(false);
		});

		test('should not match servers with wrong name format', () => {
			const server = createMockServer({
				mode: 'Castling',
				name: 'Regular Server Name'
			});

			expect(castlingFilter.filter(server)).toBe(false);
		});

		test('should handle case insensitive mode matching', () => {
			const server = createMockServer({
				mode: 'CASTLING',
				name: '[Castling-1][EZ][200%]'
			});

			expect(castlingFilter.filter(server)).toBe(true);
		});
	});

	describe('helldivers filter', () => {
		const helldiversFilter = filters.find((f) => f.id === 'helldivers')!;

		test('should match hell diver servers with correct name format', () => {
			const server1 = createMockServer({
				mode: 'HD',
				name: '[地狱潜兵] 挂机/抽卡/赛车服'
			});

			expect(helldiversFilter.filter(server1)).toBe(true);
		});

		test('should not match servers with wrong mode', () => {
			const server = createMockServer({
				mode: 'COOP',
				name: '[地狱潜兵] 挂机/抽卡/赛车服'
			});

			expect(helldiversFilter.filter(server)).toBe(false);
		});

		test('should not match servers with wrong name format', () => {
			const server = createMockServer({
				mode: 'HD',
				name: 'Regular Server Name'
			});

			expect(helldiversFilter.filter(server)).toBe(false);
		});

		test('should handle case insensitive mode matching', () => {
			const server = createMockServer({
				mode: 'hd',
				name: '[地狱潜兵] 挂机/抽卡/赛车服'
			});

			expect(helldiversFilter.filter(server)).toBe(true);
		});
	});

	describe('filter integration', () => {
		test('should handle servers with multiple potential matches', () => {
			const server = createMockServer({
				mode: 'Castling',
				name: '[Castling-1][EZ][200%]',
				realm: 'official_invasion'
			});

			const invasionFilter = filters.find((f) => f.id === 'invasion')!;
			const castlingFilter = filters.find((f) => f.id === 'castling')!;

			// Server should match both filters
			expect(invasionFilter.filter(server)).toBe(true);
			expect(castlingFilter.filter(server)).toBe(true);
		});

		test('should handle servers that match no filters', () => {
			const server = createMockServer({
				mode: 'COOP',
				name: 'Regular Server',
				realm: null
			});

			filters.forEach((filter) => {
				expect(filter.filter(server)).toBe(false);
			});
		});
	});

	describe('regex patterns edge cases', () => {
		test('should keep matching real castling server names when regex changes', () => {
			const testCases = [
				{
					name: '[Castling-3][EZ][230%]',
					mode: 'Castling',
					expected: true
				},
				{
					name: '[Castling-1][EZ][200%]',
					mode: 'Castling',
					expected: true
				},
				{
					name: '[Castling-2][Normal][200%]',
					mode: 'Castling',
					expected: true
				},
				{
					name: '[Castling-4][Normal][200%]',
					mode: 'Castling',
					expected: true
				},
				{
					name: '[Castling][NetherLand LV4]',
					mode: 'Castling',
					expected: true
				},
				{
					name: 'Server [Castling]',
					mode: 'Castling',
					expected: false
				}
			];

			const castlingFilter = filters.find((f) => f.id === 'castling')!;

			testCases.forEach(({ name, mode, expected }) => {
				const server = createMockServer({ name, mode });
				expect(castlingFilter.filter(server)).toBe(expected);
			});
		});
	});
});
