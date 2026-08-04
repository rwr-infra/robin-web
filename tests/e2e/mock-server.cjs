// Simple mock server for e2e tests
const http = require('http');
const { parse } = require('url');

// Sample server list XML response
const mockServerListResponse = `<?xml version="1.0" encoding="UTF-8"?>
<result>
  <server>
    <name>Test Server 1</name>
    <address>127.0.0.1</address>
    <port>1234</port>
    <map_id>map1</map_id>
    <map_name>Test Map 1</map_name>
    <bots>5</bots>
    <country>US</country>
    <current_players>10</current_players>
    <timeStamp>1234567890</timeStamp>
    <version>1</version>
    <dedicated>1</dedicated>
    <mod>0</mod>
    <player>Player1</player>
    <player>Player2</player>
    <comment>Test server comment</comment>
    <url>http://example.com</url>
    <max_players>32</max_players>
    <mode>Test Mode</mode>
    <realm>test</realm>
  </server>
  <server>
    <name>Test Server 2</name>
    <address>127.0.0.2</address>
    <port>5678</port>
    <map_id>map2</map_id>
    <map_name>Test Map 2</map_name>
    <bots>0</bots>
    <country>UK</country>
    <current_players>5</current_players>
    <timeStamp>1234567891</timeStamp>
    <version>1</version>
    <dedicated>1</dedicated>
    <mod>1</mod>
    <player>Player3</player>
    <comment>Another test server</comment>
    <url>http://example2.com</url>
    <max_players>16</max_players>
    <mode>Another Mode</mode>
    <realm>test</realm>
  </server>
</result>`;

// --- Player list mock -------------------------------------------------------
// Mirrors the quirks of rwr_stats/view_players.php that the app depends on:
// - `sort` values outside the known list produce an empty table
// - `sort=sid` orders rows by an id the response never contains
// - when `search` is present `start` is ignored and the window begins 10 rows
//   before the matched player; an unknown name silently falls back to rank 1
const MOCK_PLAYER_COUNT = 60;
const PLAYER_SORT_FIELDS = [
	'rank_progression',
	'username',
	'kills',
	'deaths',
	'kd',
	'score',
	'time_played',
	'teamkills',
	'longest_kill_streak',
	'targets_destroyed',
	'vehicles_destroyed',
	'soldiers_healed',
	'distance_moved',
	'shots_fired',
	'throwables_thrown',
	'sid'
];

const mockPlayers = Array.from({ length: MOCK_PLAYER_COUNT }, (_, i) => ({
	username: `MockPlayer${i + 1}`,
	kills: 1000 - i * 7,
	deaths: 500 - i * 3,
	score: 900 - i * 5,
	kd: (2 + (i % 10) / 10).toFixed(2),
	timePlayed: `${20 + i}h 10min`,
	longestKillStreak: 50 - (i % 20),
	targetsDestroyed: i % 7,
	vehiclesDestroyed: i % 5,
	soldiersHealed: i % 11,
	teamkills: i % 3,
	distanceMoved: `${100 + i}.5km`,
	shotsFired: 20000 - i * 13,
	throwablesThrown: i % 9,
	rankProgression: 9000 - i * 41,
	rankName: `Rank ${i % 12}`,
	// Never rendered: upstream only orders by it. Coprime step, so sid ordering is a
	// permutation that starts somewhere else than the default ordering.
	sid: ((i + 1) * 7) % MOCK_PLAYER_COUNT
}));

function orderMockPlayers(sort) {
	const ordered = [...mockPlayers];
	if (sort === 'sid') {
		return ordered.sort((a, b) => a.sid - b.sid);
	}
	if (sort === 'username') {
		return ordered.sort((a, b) => a.username.localeCompare(b.username));
	}
	if (sort && sort !== 'rank_progression') {
		return ordered.sort((a, b) => Number(b[sort] ?? 0) - Number(a[sort] ?? 0));
	}
	return ordered;
}

function renderPlayerRow(player, rowNumber, highlighted) {
	const cells = [
		rowNumber,
		player.username,
		player.kills,
		player.deaths,
		player.score,
		player.kd,
		player.timePlayed,
		player.longestKillStreak,
		player.targetsDestroyed,
		player.vehiclesDestroyed,
		player.soldiersHealed,
		player.teamkills,
		player.distanceMoved,
		player.shotsFired,
		player.throwablesThrown,
		player.rankProgression,
		player.rankName
	];
	const body = cells.map((value) => `<td>${value}</td>`).join('\n');
	return `<tr class="${highlighted ? 'highlight' : ''}">${body}
<td><img width="16" height="16" src="textures/hud_rank6.png" /></td>
</tr>`;
}

function buildPlayerListResponse(query) {
	const sort = typeof query.sort === 'string' ? query.sort : undefined;
	const search = typeof query.search === 'string' ? query.search.trim() : '';
	const size = Math.min(Math.max(parseInt(query.size, 10) || 100, 1), 100);
	const requestedStart = Math.max(parseInt(query.start, 10) || 0, 0);

	// Unknown sort field: upstream answers with a table that has no rows
	if (sort !== undefined && !PLAYER_SORT_FIELDS.includes(sort)) {
		return '<html><body><table>\n<tr><th>#</th></tr>\n</table></body></html>';
	}

	const ordered = orderMockPlayers(sort);

	let start = requestedStart;
	if (search) {
		// `start` is ignored while searching; unknown names fall back to the first page
		const hitIndex = ordered.findIndex(
			(player) => player.username.toLowerCase() === search.toLowerCase()
		);
		start = hitIndex === -1 ? 0 : Math.max(0, hitIndex - 10);
	}

	const window = ordered.slice(start, start + size);
	const rows = window
		.map((player, index) =>
			renderPlayerRow(
				player,
				start + index + 1,
				Boolean(search) && player.username.toLowerCase() === search.toLowerCase()
			)
		)
		.join('\n');

	const links = [
		start > 0 ? '<a href="?start=prev">Previous</a>' : '',
		start + size < ordered.length ? '<a href="?start=next">Next</a>' : ''
	]
		.filter(Boolean)
		.join('\n');

	return `<html><body><table>
<tr><th>#</th><th>Username</th><th>Kills</th></tr>
${rows}
</table>
${links}
</body></html>`;
}

// Create a simple HTTP server
function startMockServer(port = 5800) {
	const server = http.createServer((req, res) => {
		const parsedUrl = parse(req.url || '', true);
		const pathname = parsedUrl.pathname;

		console.log(`[Mock Server] Received request: ${req.method} ${pathname}`);

		// Handle server_list endpoint
		if (pathname === '/api/server_list') {
			res.setHeader('Content-Type', 'application/xml');
			res.writeHead(200);
			res.end(mockServerListResponse);
			return;
		}

		// Handle player_list endpoint
		if (pathname === '/api/player_list') {
			res.setHeader('Content-Type', 'text/html');
			res.writeHead(200);
			res.end(buildPlayerListResponse(parsedUrl.query || {}));
			return;
		}

		// Default response for unhandled routes
		res.writeHead(404);
		res.end('Not Found');
	});

	return new Promise((resolve) => {
		server.listen(port, () => {
			console.log(`[Mock Server] Server running at http://localhost:${port}`);
			resolve(server);
		});
	});
}

// Start the server if this file is run directly
if (require.main === module) {
	startMockServer().catch(console.error);
}

module.exports = { startMockServer };
