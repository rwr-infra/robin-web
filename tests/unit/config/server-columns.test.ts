import { describe, test, expect } from 'vitest';
import { columns } from '$lib/config/server-columns';
import type { IDisplayServerItem } from '$lib/models/server.model';

describe('server-columns', () => {
	// Helper function to create a mock server
	const createMockServer = (overrides: Partial<IDisplayServerItem> = {}): IDisplayServerItem => ({
		id: 'test-server-1',
		name: 'Test Server',
		ipAddress: '127.0.0.1',
		port: 1234,
		mapId: 'media/packages/vanilla/maps/map1',
		mapName: 'Test Map',
		bots: 100,
		country: 'USA',
		currentPlayers: 10,
		timeStamp: Math.floor(Date.now() / 1000),
		version: '1.98.1',
		dedicated: true,
		mod: false,
		playerList: ['Player1', 'Player2', 'Player3'],
		comment: 'Test comment',
		url: 'https://test.com',
		maxPlayers: 32,
		mode: 'COOP',
		realm: 'official_invasion',
		...overrides
	});

	describe('column structure', () => {
		test('should export columns array', () => {
			expect(columns).toBeDefined();
			expect(Array.isArray(columns)).toBe(true);
			expect(columns.length).toBeGreaterThan(0);
		});

		test('each column should have required properties', () => {
			columns.forEach((column) => {
				expect(column).toHaveProperty('key');
				expect(column).toHaveProperty('label');
				expect(column).toHaveProperty('i18n');
				expect(typeof column.key).toBe('string');
				expect(typeof column.label).toBe('string');
				expect(typeof column.i18n).toBe('string');
			});
		});
	});

	describe('name column', () => {
		test('should get server name', () => {
			const column = columns.find((col) => col.key === 'name');
			expect(column).toBeDefined();

			const server = createMockServer({ name: 'TestServer123' });
			const value = column!.getValue!(server);
			expect(value).toBe('TestServer123');
		});

		test('should highlight server name with query', () => {
			const column = columns.find((col) => col.key === 'name');
			const server = createMockServer({ name: 'TestServer' });
			const highlighted = column!.getValueWithHighlight!(server, 'Test');

			expect(highlighted).toContain('Server');
			expect(highlighted).toContain('<mark');
		});
	});

	describe('ipAddress column', () => {
		test('should highlight IP address with query', () => {
			const column = columns.find((col) => col.key === 'ipAddress');
			const server = createMockServer({ ipAddress: '192.168.1.1' });
			const highlighted = column!.getValueWithHighlight!(server, '192');

			expect(highlighted).toContain('.168.1.1');
			expect(highlighted).toContain('<mark');
		});
	});

	describe('port column', () => {
		test('should have center alignment', () => {
			const column = columns.find((col) => col.key === 'port');
			expect(column?.alignment).toBe('center');
		});

		test('should highlight port with query', () => {
			const column = columns.find((col) => col.key === 'port');
			const server = createMockServer({ port: 9876 });
			const highlighted = column!.getValueWithHighlight!(server, '9876');

			expect(highlighted).toContain('9876');
		});
	});

	describe('bots column', () => {
		test('should highlight bots count with query', () => {
			const column = columns.find((col) => col.key === 'bots');
			const server = createMockServer({ bots: 150 });
			const highlighted = column!.getValueWithHighlight!(server, '150');

			expect(highlighted).toContain('150');
		});
	});

	describe('country column', () => {
		test('should highlight country with query', () => {
			const column = columns.find((col) => col.key === 'country');
			const server = createMockServer({ country: 'Germany' });
			const highlighted = column!.getValueWithHighlight!(server, 'Ger');

			expect(highlighted).toContain('many');
			expect(highlighted).toContain('<mark');
		});
	});

	describe('mode column', () => {
		test('should render mode with badge', () => {
			const column = columns.find((col) => col.key === 'mode');
			const server = createMockServer({ mode: 'COOP' });
			const value = column!.getValue!(server);

			expect(value).toContain('badge');
			expect(value).toContain('COOP');
			expect(value).toContain('data-mode="mode"');
		});

		test('should handle unknown mode', () => {
			const column = columns.find((col) => col.key === 'mode');
			const server = createMockServer({ mode: '' });
			const value = column!.getValue!(server);

			expect(value).toContain('Unknown');
		});

		test('should highlight mode with query', () => {
			const column = columns.find((col) => col.key === 'mode');
			const server = createMockServer({ mode: 'Dominance' });
			const highlighted = column!.getValueWithHighlight!(server, 'Dom');

			expect(highlighted).toContain('badge');
			expect(highlighted).toContain('inance');
			expect(highlighted).toContain('<mark');
		});
	});

	describe('mapId column', () => {
		test('should render map preview with badge', () => {
			const column = columns.find((col) => col.key === 'mapId');
			const server = createMockServer({ mapId: 'media/packages/vanilla/maps/map5' });
			const value = column!.getValue!(server);

			expect(value).toContain('badge');
			expect(value).toContain('map5');
		});

		test('should highlight map name with query', () => {
			const column = columns.find((col) => col.key === 'mapId');
			const server = createMockServer({ mapId: 'media/packages/vanilla/maps/island1' });
			const highlighted = column!.getValueWithHighlight!(server, 'island');

			expect(highlighted).toContain('badge');
			expect(highlighted).toContain('1');
			expect(highlighted).toContain('<mark');
		});

		test('should extract map name from path', () => {
			const column = columns.find((col) => col.key === 'mapId');
			const server = createMockServer({ mapId: 'media/packages/vanilla.desert/maps/map10' });
			const value = column!.getValue!(server);

			expect(value).toContain('map10');
			expect(value).not.toContain('media/packages');
		});
	});

	describe('playerCount column', () => {
		test('should have center alignment', () => {
			const column = columns.find((col) => col.key === 'playerCount');
			expect(column?.alignment).toBe('center');
		});

		test('should render empty server with gray badge', () => {
			const column = columns.find((col) => col.key === 'playerCount');
			const server = createMockServer({ currentPlayers: 0, maxPlayers: 32 });
			const value = column!.getValue!(server);

			expect(value).toContain('badge');
			expect(value).toContain('0/32');
			expect(value).toContain('gray');
			expect(value).toContain('Empty server');
		});

		test('should render full server with red badge', () => {
			const column = columns.find((col) => col.key === 'playerCount');
			const server = createMockServer({ currentPlayers: 32, maxPlayers: 32 });
			const value = column!.getValue!(server);

			expect(value).toContain('badge');
			expect(value).toContain('32/32');
			expect(value).toContain('red');
			expect(value).toContain('Full server');
		});

		test('should render 80%+ occupied server with orange badge', () => {
			const column = columns.find((col) => col.key === 'playerCount');
			const server = createMockServer({ currentPlayers: 26, maxPlayers: 32 }); // 81%
			const value = column!.getValue!(server);

			expect(value).toContain('badge');
			expect(value).toContain('26/32');
			expect(value).toContain('orange');
			expect(value).toContain('81% full');
		});

		test('should render 60-79% occupied server with yellow badge', () => {
			const column = columns.find((col) => col.key === 'playerCount');
			const server = createMockServer({ currentPlayers: 20, maxPlayers: 32 }); // 62.5%
			const value = column!.getValue!(server);

			expect(value).toContain('badge');
			expect(value).toContain('20/32');
			expect(value).toContain('amber');
			expect(value).toContain('63% full'); // Math.round(62.5) = 63
		});

		test('should render less than 60% occupied server with green badge', () => {
			const column = columns.find((col) => col.key === 'playerCount');
			const server = createMockServer({ currentPlayers: 10, maxPlayers: 32 }); // 31%
			const value = column!.getValue!(server);

			expect(value).toContain('badge');
			expect(value).toContain('10/32');
			expect(value).toContain('green');
			expect(value).toContain('31% full');
		});

		test('should handle exactly 80% occupancy', () => {
			const column = columns.find((col) => col.key === 'playerCount');
			const server = createMockServer({ currentPlayers: 16, maxPlayers: 20 }); // 80%
			const value = column!.getValue!(server);

			expect(value).toContain('orange');
			expect(value).toContain('80% full');
		});

		test('should handle exactly 60% occupancy', () => {
			const column = columns.find((col) => col.key === 'playerCount');
			const server = createMockServer({ currentPlayers: 12, maxPlayers: 20 }); // 60%
			const value = column!.getValue!(server);

			expect(value).toContain('amber');
			expect(value).toContain('60% full');
		});

		test('should handle maxPlayers of 0', () => {
			const column = columns.find((col) => col.key === 'playerCount');
			const server = createMockServer({ currentPlayers: 0, maxPlayers: 0 });
			const value = column!.getValue!(server);

			expect(value).toContain('0/0');
		});

		test('should handle currentPlayers exceeding maxPlayers', () => {
			const column = columns.find((col) => col.key === 'playerCount');
			const server = createMockServer({ currentPlayers: 35, maxPlayers: 32 });
			const value = column!.getValue!(server);

			expect(value).toContain('red');
			expect(value).toContain('Full server');
		});

		test('should highlight player count with query', () => {
			const column = columns.find((col) => col.key === 'playerCount');
			const server = createMockServer({ currentPlayers: 15, maxPlayers: 32 });
			const highlighted = column!.getValueWithHighlight!(server, '15');

			expect(highlighted).toContain('/32');
			expect(highlighted).toContain('<mark');
		});
	});

	describe('playerList column', () => {
		test('should have proper classes for wide column', () => {
			const column = columns.find((col) => col.key === 'playerList');
			expect(column?.headerClass).toBe('min-w-96');
			expect(column?.cellClass).toBe('min-w-96');
			expect(column?.alignment).toBe('top');
		});

		test('should render player list', () => {
			const column = columns.find((col) => col.key === 'playerList');
			const server = createMockServer({ playerList: ['Alice', 'Bob', 'Charlie'] });
			const value = column!.getValue!(server);

			expect(value).toBeDefined();
			expect(typeof value).toBe('string');
		});

		test('should render player list with highlighting', () => {
			const column = columns.find((col) => col.key === 'playerList');
			const server = createMockServer({ playerList: ['Alice', 'Bob', 'Charlie'] });
			const highlighted = column!.getValueWithHighlight!(server, 'Bob');

			expect(highlighted).toBeDefined();
			expect(typeof highlighted).toBe('string');
		});
	});

	describe('comment column', () => {
		test('should have comment label', () => {
			const column = columns.find((col) => col.key === 'comment');
			expect(column?.label).toBe('Comment');
			expect(column?.i18n).toBe('app.column.comment');
		});
	});

	describe('dedicated column', () => {
		test('should return "Yes" for dedicated server', () => {
			const column = columns.find((col) => col.key === 'dedicated');
			const server = createMockServer({ dedicated: true });
			const value = column!.getValue!(server);

			expect(value).toBe('Yes');
		});

		test('should return "No" for non-dedicated server', () => {
			const column = columns.find((col) => col.key === 'dedicated');
			const server = createMockServer({ dedicated: false });
			const value = column!.getValue!(server);

			expect(value).toBe('No');
		});
	});

	describe('mod column', () => {
		test('should return "Yes" for modded server', () => {
			const column = columns.find((col) => col.key === 'mod');
			const server = createMockServer({ mod: true });
			const value = column!.getValue!(server);

			expect(value).toBe('Yes');
		});

		test('should return "No" for vanilla server', () => {
			const column = columns.find((col) => col.key === 'mod');
			const server = createMockServer({ mod: false });
			const value = column!.getValue!(server);

			expect(value).toBe('No');
		});
	});

	describe('url column', () => {
		test('should have url label', () => {
			const column = columns.find((col) => col.key === 'url');
			expect(column?.label).toBe('URL');
			expect(column?.i18n).toBe('app.column.url');
		});
	});

	describe('version column', () => {
		test('should have version label', () => {
			const column = columns.find((col) => col.key === 'version');
			expect(column?.label).toBe('Version');
			expect(column?.i18n).toBe('app.column.version');
		});
	});

	describe('action column', () => {
		test('should have action label', () => {
			const column = columns.find((col) => col.key === 'action');
			expect(column?.label).toBe('Action');
			expect(column?.i18n).toBe('app.column.action');
		});
	});

	describe('edge cases', () => {
		test('should handle server with empty string mode', () => {
			const column = columns.find((col) => col.key === 'mode');
			const server = createMockServer({ mode: '' });
			const value = column!.getValue!(server);

			expect(value).toContain('Unknown');
		});

		test('should handle server with undefined mode', () => {
			const column = columns.find((col) => col.key === 'mode');
			const server = createMockServer({ mode: undefined as any });
			const value = column!.getValue!(server);

			expect(value).toContain('Unknown');
		});

		test('should handle server with null mode', () => {
			const column = columns.find((col) => col.key === 'mode');
			const server = createMockServer({ mode: null as any });
			const value = column!.getValue!(server);

			expect(value).toContain('Unknown');
		});

		test('should handle map path without slashes', () => {
			const column = columns.find((col) => col.key === 'mapId');
			const server = createMockServer({ mapId: 'simplemap' });
			const value = column!.getValue!(server);

			expect(value).toContain('simplemap');
		});

		test('should handle map path ending with slash', () => {
			const column = columns.find((col) => col.key === 'mapId');
			const server = createMockServer({ mapId: 'media/packages/maps/' });
			const value = column!.getValue!(server);

			expect(value).toBeDefined();
		});

		test('should handle single player in server', () => {
			const column = columns.find((col) => col.key === 'playerCount');
			const server = createMockServer({ currentPlayers: 1, maxPlayers: 32 });
			const value = column!.getValue!(server);

			expect(value).toContain('1/32');
			expect(value).toContain('green');
		});

		test('should handle exactly full server at 100%', () => {
			const column = columns.find((col) => col.key === 'playerCount');
			const server = createMockServer({ currentPlayers: 64, maxPlayers: 64 });
			const value = column!.getValue!(server);

			expect(value).toContain('64/64');
			expect(value).toContain('red');
			expect(value).toContain('Full server');
		});
	});

	describe('i18n keys', () => {
		test('all columns should have valid i18n keys', () => {
			const expectedI18nPrefix = 'app.column.';

			columns.forEach((column) => {
				expect(column.i18n).toContain(expectedI18nPrefix);
			});
		});
	});

	describe('column keys uniqueness', () => {
		test('all column keys should be unique', () => {
			const keys = columns.map((col) => col.key);
			const uniqueKeys = new Set(keys);

			expect(uniqueKeys.size).toBe(keys.length);
		});
	});
});
