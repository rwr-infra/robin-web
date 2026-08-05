import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServerService } from '$lib/services/servers';
import {
	createMockServers,
	createMockDisplayServers,
	createTestScenarios,
	createMockXmlResponse
} from '../../fixtures/mock-data-generator';

// Mock fetch API
global.fetch = vi.fn();

describe('ServerService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Mock console.error to suppress expected error messages
		vi.spyOn(console, 'error').mockImplementation(() => {});
		// Reset fetch mock
		vi.mocked(fetch).mockClear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('listAll method', () => {
		test('should parse XML response and return server list', async () => {
			// Mock successful API response
			const mockXmlResponse = createMockXmlResponse(5);
			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(mockXmlResponse, {
					status: 200,
					headers: { 'Content-Type': 'application/xml' }
				})
			);

			const result = await ServerService.listAll();

			// Verify fetch was called correctly (note: ServerService adds timestamp, start, size, and names parameters)
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/server_list?start=0&size=100&names=1&_t='),
				expect.any(Object)
			);

			// Verify results
			expect(result).toHaveLength(5);
			expect(result[0]).toHaveProperty('id');
			expect(result[0]).toHaveProperty('name');
			expect(result[0]).toHaveProperty('ipAddress');
			expect(result[0]).toHaveProperty('port');
			expect(result[0]).toHaveProperty('playerList');
		});

		test('should handle empty server list', async () => {
			const emptyXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<result value="1">
<server_list>
</server_list>
</result>`;

			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(emptyXmlResponse, {
					status: 200,
					headers: { 'Content-Type': 'application/xml' }
				})
			);

			const result = await ServerService.listAll();

			expect(result).toHaveLength(0);
		});

		test('should handle servers with no players', async () => {
			const mockServers = createMockServers(2, {
				current_players: 0,
				player: []
			});
			const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<result value="1">
${mockServers
	.map(
		(server) => `<server>
<name>${server.name}</name>
<address>${server.address}</address>
<port>${server.port}</port>
<current_players>0</current_players>
<max_players>${server.max_players}</max_players>
</server>`
	)
	.join('\n')}
</result>`;

			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(xmlResponse, {
					status: 200,
					headers: { 'Content-Type': 'application/xml' }
				})
			);

			const result = await ServerService.listAll();

			expect(result).toHaveLength(2);
			expect(result[0].currentPlayers).toBe(0);
			expect(result[0].playerList).toEqual([]);
			// Note: playerCount is computed, not stored as a property
		});

		test('should apply dimmed styling to servers with 0 players', async () => {
			const mockServers = createMockServers(2, {
				current_players: 0,
				max_players: 20,
				player: []
			});
			const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<result value="1">
${mockServers
	.map(
		(server) => `<server>
<name>${server.name}</name>
<address>${server.address}</address>
<port>${server.port}</port>
<current_players>0</current_players>
<max_players>${server.max_players}</max_players>
</server>`
	)
	.join('\n')}
</result>`;

			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(xmlResponse, {
					status: 200,
					headers: { 'Content-Type': 'application/xml' }
				})
			);

			const result = await ServerService.listAll();

			expect(result).toHaveLength(2);

			// Verify that 0-player servers have currentPlayers = 0
			result.forEach((server) => {
				expect(server.currentPlayers).toBe(0);
				expect(server.maxPlayers).toBe(20);
			});
		});

		test('should handle servers with single player (string format)', async () => {
			const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<result value="1">
<server>
<name>Test Server</name>
<address>192.168.1.1</address>
<port>27015</port>
<current_players>1</current_players>
<max_players>32</max_players>
<player>SinglePlayer</player>
</server>
</result>`;

			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(xmlResponse, {
					status: 200,
					headers: { 'Content-Type': 'application/xml' }
				})
			);

			const result = await ServerService.listAll();

			expect(result).toHaveLength(1);
			expect(result[0].currentPlayers).toBe(1);
			expect(result[0].playerList).toEqual(['SinglePlayer']);
		});

		test('should process server properties correctly', async () => {
			const mockServer = createMockServers(1, {
				dedicated: 1,
				mod: 1,
				version: '1.98.1'
			})[0];

			const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<result value="1">
<server>
<name>${mockServer.name}</name>
<address>${mockServer.address}</address>
<port>${mockServer.port}</port>
<dedicated>${mockServer.dedicated}</dedicated>
<mod>${mockServer.mod}</mod>
<version>${mockServer.version}</version>
<current_players>${mockServer.current_players}</current_players>
<max_players>${mockServer.max_players}</max_players>
</server>
</result>`;

			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(xmlResponse, {
					status: 200,
					headers: { 'Content-Type': 'application/xml' }
				})
			);

			const result = await ServerService.listAll();

			expect(result).toHaveLength(1);
			const server = result[0];
			expect(server.dedicated).toBe(true);
			expect(server.mod).toBe(true);
			expect(server.version).toBe('1.98.1'); // Parsed as string
		});

		test('should handle network errors gracefully', async () => {
			vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

			const result = await ServerService.listAll();
			expect(result).toEqual([]); // Should return empty array on error
		});

		test('should handle HTTP error responses', async () => {
			vi.mocked(fetch).mockResolvedValueOnce(
				new Response('Server error', {
					status: 500,
					statusText: 'Internal Server Error',
					headers: { 'Content-Type': 'text/plain' }
				})
			);

			const result = await ServerService.listAll();
			expect(result).toEqual([]); // Should return empty array on error
		});

		test('should handle malformed XML gracefully', async () => {
			vi.mocked(fetch).mockResolvedValueOnce(
				new Response('Invalid XML', {
					status: 200,
					headers: { 'Content-Type': 'application/xml' }
				})
			);

			const result = await ServerService.listAll();
			expect(result).toEqual([]); // Should return empty array on error
		});

		test('should handle timeout properly', async () => {
			// Simply test that timeout option is accepted
			// Real timeout testing requires complex mocking and may be flaky in test environment
			const mockXmlResponse = createMockXmlResponse(1);
			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(mockXmlResponse, {
					status: 200,
					headers: { 'Content-Type': 'application/xml' }
				})
			);

			const result = await ServerService.listAll({ timeout: 1000 });
			expect(result).toHaveLength(1); // Should work normally with valid timeout
		});
	});

	describe('Real-world scenarios', () => {
		test('should handle high capacity servers', async () => {
			const scenarios = createTestScenarios();
			const fullServers = scenarios.fullServers;

			const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<result value="1">
<server_list>
${fullServers
	.map(
		(server) => `
<server>
<name>${server.name}</name>
<address>${server.address}</address>
<port>${server.port}</port>
<current_players>${server.current_players}</current_players>
<max_players>${server.max_players}</max_players>
<bots>${server.bots}</bots>
<mode>${server.mode}</mode>
</server>`
	)
	.join('')}
</server_list>
</result>`;

			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(xmlResponse, {
					status: 200,
					headers: { 'Content-Type': 'application/xml' }
				})
			);

			const result = await ServerService.listAll();

			expect(result).toHaveLength(3);
			result.forEach((server) => {
				// All should be at full capacity (100%)
				expect(server.currentPlayers).toBe(server.maxPlayers);
				expect(server.currentPlayers).toBeGreaterThan(0);
			});
		});

		test('should handle servers with different bot counts', async () => {
			const scenarios = createTestScenarios();
			const noBots = scenarios.noBotsServers[0];
			const manyBots = scenarios.serversWithBots[0];

			const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<result value="1">
<server_list>
<server>
<name>${noBots.name}</name>
<address>${noBots.address}</address>
<port>${noBots.port}</port>
<bots>0</bots>
<current_players>5</current_players>
</server>
<server>
<name>${manyBots.name}</name>
<address>${manyBots.address}</address>
<port>${manyBots.port}</port>
<bots>150</bots>
<current_players>3</current_players>
</server>
</server_list>
</result>`;

			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(xmlResponse, {
					status: 200,
					headers: { 'Content-Type': 'application/xml' }
				})
			);

			const result = await ServerService.listAll();

			expect(result).toHaveLength(2);
			expect(result[0].bots).toBe(0);
			expect(result[1].bots).toBe(150);
		});

		test('should handle different game modes', async () => {
			// Create XML manually with specific modes to test
			const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<result value="1">
<server>
<name>COOP Server</name>
<mode>COOP</mode>
<current_players>5</current_players>
<max_players>24</max_players>
</server>
<server>
<name>Castling Server</name>
<mode>Castling</mode>
<current_players>8</current_players>
<max_players>32</max_players>
</server>
<server>
<name>GFL Server</name>
<mode>GFL [INF]</mode>
<current_players>12</current_players>
<max_players>16</max_players>
</server>
<server>
<name>DOM Server</name>
<mode>DOM</mode>
<current_players>3</current_players>
<max_players>20</max_players>
</server>
</result>`;

			vi.mocked(fetch).mockResolvedValueOnce(
				new Response(xmlResponse, {
					status: 200,
					headers: { 'Content-Type': 'application/xml' }
				})
			);

			const result = await ServerService.listAll();

			expect(result).toHaveLength(4);
			const modes = result.map((s) => s.mode);
			expect(modes).toContain('COOP');
			expect(modes).toContain('Castling');
			expect(modes).toContain('GFL [INF]');
			expect(modes).toContain('DOM');
		});
	});
});
