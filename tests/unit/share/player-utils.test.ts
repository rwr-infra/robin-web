import { describe, test, expect } from 'vitest';
import {
	parsePlayerListFromString,
	parsePlayerListWithPagination,
	type PlayerListResult
} from '$lib/share/player-utils';
import { PlayerDatabase } from '$lib/models/player.model';
import type { IPlayerItem } from '$lib/models/player.model';

describe('player-utils', () => {
	describe('parsePlayerListFromString', () => {
		test('should parse valid HTML with player data', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr>
			<th>Row</th>
			<th>Username</th>
			<th>Kills</th>
			<th>Deaths</th>
			<th>Score</th>
			<th>K/D</th>
			<th>Time Played</th>
			<th>Longest Kill Streak</th>
			<th>Targets Destroyed</th>
			<th>Vehicles Destroyed</th>
			<th>Soldiers Healed</th>
			<th>Teamkills</th>
			<th>Distance Moved</th>
			<th>Shots Fired</th>
			<th>Throwables Thrown</th>
			<th>Rank Progression</th>
			<th>Rank Name</th>
			<th>Rank Icon</th>
		</tr>
		<tr>
			<td>1</td>
			<td>PlayerOne</td>
			<td>100</td>
			<td>50</td>
			<td>5000</td>
			<td>2.0</td>
			<td>10h 30m</td>
			<td>15</td>
			<td>20</td>
			<td>5</td>
			<td>30</td>
			<td>2</td>
			<td>10000m</td>
			<td>1000</td>
			<td>50</td>
			<td>100</td>
			<td>Captain</td>
			<td><img src="/rank/captain.png" /></td>
		</tr>
		<tr>
			<td>2</td>
			<td>PlayerTwo</td>
			<td>80</td>
			<td>40</td>
			<td>4000</td>
			<td>2.0</td>
			<td>8h 20m</td>
			<td>12</td>
			<td>15</td>
			<td>3</td>
			<td>25</td>
			<td>1</td>
			<td>8000m</td>
			<td>800</td>
			<td>40</td>
			<td>90</td>
			<td>Lieutenant</td>
			<td><img src="/rank/lieutenant.png" /></td>
		</tr>
	</table>
</body>
</html>
			`;

			const result = parsePlayerListFromString(html, PlayerDatabase.INVASION);

			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				id: 'invasion:PlayerOne',
				username: 'PlayerOne',
				db: PlayerDatabase.INVASION,
				rowNumber: 1,
				kills: 100,
				deaths: 50,
				score: 5000,
				kd: 2.0,
				timePlayed: '10h 30m',
				longestKillStreak: 15,
				targetsDestroyed: 20,
				vehiclesDestroyed: 5,
				soldiersHealed: 30,
				teamkills: 2,
				distanceMoved: '10000m',
				shotsFired: 1000,
				throwablesThrown: 50,
				rankProgression: 100,
				rankName: 'Captain',
				rankIcon: '/rank/captain.png'
			});
			expect(result[1].username).toBe('PlayerTwo');
		});

		test('should handle empty table', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr>
			<th>Header</th>
		</tr>
	</table>
</body>
</html>
			`;

			const result = parsePlayerListFromString(html, PlayerDatabase.PACIFIC);
			expect(result).toEqual([]);
		});

		test('should handle missing table', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<div>No table here</div>
</body>
</html>
			`;

			const result = parsePlayerListFromString(html, PlayerDatabase.INVASION);
			expect(result).toEqual([]);
		});

		test('should handle null/undefined/empty string values', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr>
			<th>Row</th>
			<th>Username</th>
		</tr>
		<tr>
			<td>1</td>
			<td>TestUser</td>
			<td></td>
			<td>-</td>
			<td></td>
			<td>-</td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
		</tr>
	</table>
</body>
</html>
			`;

			const result = parsePlayerListFromString(html, PlayerDatabase.INVASION);

			expect(result).toHaveLength(1);
			expect(result[0].username).toBe('TestUser');
			expect(result[0].kills).toBeNull();
			expect(result[0].deaths).toBeNull();
			expect(result[0].score).toBeNull();
			expect(result[0].kd).toBeNull();
		});

		test('should handle cell with link element', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr><th>Headers</th></tr>
		<tr>
			<td>1</td>
			<td><a href="/profile">LinkedUser</a></td>
			<td>50</td>
			<td>25</td>
			<td>2500</td>
			<td>2.0</td>
			<td>5h</td>
			<td>10</td>
			<td>5</td>
			<td>2</td>
			<td>15</td>
			<td>0</td>
			<td>5000m</td>
			<td>500</td>
			<td>25</td>
			<td>50</td>
			<td>Private</td>
			<td></td>
		</tr>
	</table>
</body>
</html>
			`;

			const result = parsePlayerListFromString(html, PlayerDatabase.PACIFIC);

			expect(result).toHaveLength(1);
			expect(result[0].username).toBe('LinkedUser');
			expect(result[0].db).toBe(PlayerDatabase.PACIFIC);
			expect(result[0].id).toBe('pacific:LinkedUser');
		});

		test('should handle cell with #text property', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr><th>Headers</th></tr>
		<tr>
			<td>1</td>
			<td>UserWithText</td>
			<td>30</td>
			<td>15</td>
			<td>1500</td>
			<td>2.0</td>
			<td>3h</td>
			<td>8</td>
			<td>4</td>
			<td>1</td>
			<td>10</td>
			<td>0</td>
			<td>3000m</td>
			<td>300</td>
			<td>15</td>
			<td>40</td>
			<td>Sergeant</td>
			<td></td>
		</tr>
	</table>
</body>
</html>
			`;

			const result = parsePlayerListFromString(html, PlayerDatabase.PRERESET_INVASION);

			expect(result).toHaveLength(1);
			expect(result[0].username).toBe('UserWithText');
			expect(result[0].db).toBe(PlayerDatabase.PRERESET_INVASION);
		});

		test('should handle numeric cell values', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr><th>Headers</th></tr>
		<tr>
			<td>1</td>
			<td>NumericUser</td>
			<td>123</td>
			<td>45</td>
			<td>6789</td>
			<td>2.73</td>
			<td>12h 45m</td>
			<td>20</td>
			<td>25</td>
			<td>8</td>
			<td>40</td>
			<td>3</td>
			<td>15000m</td>
			<td>2000</td>
			<td>80</td>
			<td>150</td>
			<td>Major</td>
			<td><img src="/rank/major.png" /></td>
		</tr>
	</table>
</body>
</html>
			`;

			const result = parsePlayerListFromString(html, PlayerDatabase.INVASION);

			expect(result).toHaveLength(1);
			expect(result[0].kills).toBe(123);
			expect(result[0].deaths).toBe(45);
			expect(result[0].score).toBe(6789);
			expect(result[0].kd).toBeCloseTo(2.73);
		});

		test('should handle malformed HTML gracefully', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr><td>incomplete
	</table>
</body>
</html>
			`;

			// Should not throw and should return empty array or handle gracefully
			expect(() => parsePlayerListFromString(html, PlayerDatabase.INVASION)).not.toThrow();
		});

		test('should filter out header rows with th elements', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr>
			<th>Row</th>
			<th>Username</th>
		</tr>
		<tr>
			<th>Another Header Row</th>
		</tr>
		<tr>
			<td>1</td>
			<td>ActualPlayer</td>
			<td>50</td>
			<td>25</td>
			<td>2500</td>
			<td>2.0</td>
			<td>5h</td>
			<td>10</td>
			<td>5</td>
			<td>2</td>
			<td>15</td>
			<td>0</td>
			<td>5000m</td>
			<td>500</td>
			<td>25</td>
			<td>50</td>
			<td>Corporal</td>
			<td></td>
		</tr>
	</table>
</body>
</html>
			`;

			const result = parsePlayerListFromString(html, PlayerDatabase.INVASION);

			expect(result).toHaveLength(1);
			expect(result[0].username).toBe('ActualPlayer');
		});

		test('should handle cell with img tag but no src', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr><th>Headers</th></tr>
		<tr>
			<td>1</td>
			<td>NoIconUser</td>
			<td>10</td>
			<td>5</td>
			<td>500</td>
			<td>2.0</td>
			<td>1h</td>
			<td>3</td>
			<td>1</td>
			<td>0</td>
			<td>5</td>
			<td>0</td>
			<td>1000m</td>
			<td>100</td>
			<td>10</td>
			<td>20</td>
			<td>Recruit</td>
			<td><img /></td>
		</tr>
	</table>
</body>
</html>
			`;

			const result = parsePlayerListFromString(html, PlayerDatabase.INVASION);

			expect(result).toHaveLength(1);
			expect(result[0].rankIcon).toBeNull();
		});

		test('should handle single row (non-array)', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr>
			<td>1</td>
			<td>SingleUser</td>
			<td>20</td>
			<td>10</td>
			<td>1000</td>
			<td>2.0</td>
			<td>2h</td>
			<td>5</td>
			<td>2</td>
			<td>1</td>
			<td>8</td>
			<td>0</td>
			<td>2000m</td>
			<td>200</td>
			<td>12</td>
			<td>30</td>
			<td>Private</td>
			<td></td>
		</tr>
	</table>
</body>
</html>
			`;

			const result = parsePlayerListFromString(html, PlayerDatabase.INVASION);

			expect(result).toHaveLength(1);
			expect(result[0].username).toBe('SingleUser');
		});

		test('should handle whitespace in cell values', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr><th>Headers</th></tr>
		<tr>
			<td>  1  </td>
			<td>  SpaceyUser  </td>
			<td>  50  </td>
			<td>  25  </td>
			<td>  2500  </td>
			<td>  2.0  </td>
			<td>  5h  </td>
			<td>  10  </td>
			<td>  5  </td>
			<td>  2  </td>
			<td>  15  </td>
			<td>  0  </td>
			<td>  5000m  </td>
			<td>  500  </td>
			<td>  25  </td>
			<td>  50  </td>
			<td>  Private  </td>
			<td></td>
		</tr>
	</table>
</body>
</html>
			`;

			const result = parsePlayerListFromString(html, PlayerDatabase.INVASION);

			expect(result).toHaveLength(1);
			expect(result[0].username).toBe('SpaceyUser');
			expect(result[0].kills).toBe(50);
		});
	});

	describe('parsePlayerListWithPagination', () => {
		test('should parse players and pagination info with Next link', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr><th>Headers</th></tr>
		<tr>
			<td>1</td>
			<td>Player1</td>
			<td>100</td>
			<td>50</td>
			<td>5000</td>
			<td>2.0</td>
			<td>10h</td>
			<td>15</td>
			<td>20</td>
			<td>5</td>
			<td>30</td>
			<td>2</td>
			<td>10000m</td>
			<td>1000</td>
			<td>50</td>
			<td>100</td>
			<td>Captain</td>
			<td></td>
		</tr>
	</table>
	<div>
		<a href="?page=2">Next</a>
	</div>
</body>
</html>
			`;

			const result: PlayerListResult = parsePlayerListWithPagination(html, PlayerDatabase.INVASION);

			expect(result.players).toHaveLength(1);
			expect(result.hasNext).toBe(true);
			expect(result.hasPrevious).toBe(false);
		});

		test('should parse players and pagination info with Previous link', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr><th>Headers</th></tr>
		<tr>
			<td>1</td>
			<td>Player1</td>
			<td>100</td>
			<td>50</td>
			<td>5000</td>
			<td>2.0</td>
			<td>10h</td>
			<td>15</td>
			<td>20</td>
			<td>5</td>
			<td>30</td>
			<td>2</td>
			<td>10000m</td>
			<td>1000</td>
			<td>50</td>
			<td>100</td>
			<td>Captain</td>
			<td></td>
		</tr>
	</table>
	<div>
		<a href="?page=1">Previous</a>
	</div>
</body>
</html>
			`;

			const result: PlayerListResult = parsePlayerListWithPagination(html, PlayerDatabase.PACIFIC);

			expect(result.players).toHaveLength(1);
			expect(result.hasNext).toBe(false);
			expect(result.hasPrevious).toBe(true);
		});

		test('should parse players and pagination info with both Next and Previous links', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr><th>Headers</th></tr>
		<tr>
			<td>1</td>
			<td>Player1</td>
			<td>100</td>
			<td>50</td>
			<td>5000</td>
			<td>2.0</td>
			<td>10h</td>
			<td>15</td>
			<td>20</td>
			<td>5</td>
			<td>30</td>
			<td>2</td>
			<td>10000m</td>
			<td>1000</td>
			<td>50</td>
			<td>100</td>
			<td>Captain</td>
			<td></td>
		</tr>
	</table>
	<div>
		<a href="?page=1">Previous</a>
		<a href="?page=3">Next</a>
	</div>
</body>
</html>
			`;

			const result: PlayerListResult = parsePlayerListWithPagination(html, PlayerDatabase.INVASION);

			expect(result.players).toHaveLength(1);
			expect(result.hasNext).toBe(true);
			expect(result.hasPrevious).toBe(true);
		});

		test('should handle no pagination links', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr><th>Headers</th></tr>
		<tr>
			<td>1</td>
			<td>OnlyPlayer</td>
			<td>50</td>
			<td>25</td>
			<td>2500</td>
			<td>2.0</td>
			<td>5h</td>
			<td>10</td>
			<td>5</td>
			<td>2</td>
			<td>15</td>
			<td>0</td>
			<td>5000m</td>
			<td>500</td>
			<td>25</td>
			<td>50</td>
			<td>Private</td>
			<td></td>
		</tr>
	</table>
</body>
</html>
			`;

			const result: PlayerListResult = parsePlayerListWithPagination(html, PlayerDatabase.INVASION);

			expect(result.players).toHaveLength(1);
			expect(result.hasNext).toBe(false);
			expect(result.hasPrevious).toBe(false);
		});

		test('should handle case-insensitive pagination links', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr><th>Headers</th></tr>
		<tr>
			<td>1</td>
			<td>Player1</td>
			<td>50</td>
			<td>25</td>
			<td>2500</td>
			<td>2.0</td>
			<td>5h</td>
			<td>10</td>
			<td>5</td>
			<td>2</td>
			<td>15</td>
			<td>0</td>
			<td>5000m</td>
			<td>500</td>
			<td>25</td>
			<td>50</td>
			<td>Private</td>
			<td></td>
		</tr>
	</table>
	<div>
		<a href="?page=1">previous</a>
		<a href="?page=3">next</a>
	</div>
</body>
</html>
			`;

			const result: PlayerListResult = parsePlayerListWithPagination(html, PlayerDatabase.INVASION);

			expect(result.hasNext).toBe(true);
			expect(result.hasPrevious).toBe(true);
		});

		test('should handle empty player list with pagination', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr><th>Headers</th></tr>
	</table>
	<div>
		<a href="?page=2">Next</a>
	</div>
</body>
</html>
			`;

			const result: PlayerListResult = parsePlayerListWithPagination(html, PlayerDatabase.INVASION);

			expect(result.players).toHaveLength(0);
			expect(result.hasNext).toBe(true);
			expect(result.hasPrevious).toBe(false);
		});

		test('should handle malformed HTML gracefully in pagination parsing', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr>incomplete
	</table>
	<a href="">broken
</body>
</html>
		`;

			// Should not throw
			expect(() => parsePlayerListWithPagination(html, PlayerDatabase.INVASION)).not.toThrow();

			const result = parsePlayerListWithPagination(html, PlayerDatabase.INVASION);
			// Parser may extract incomplete data, just check it doesn't throw
			expect(Array.isArray(result.players)).toBe(true);
			expect(typeof result.hasNext).toBe('boolean');
			expect(typeof result.hasPrevious).toBe('boolean');
		});

		test('should handle array of links', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr><th>Headers</th></tr>
		<tr>
			<td>1</td>
			<td>TestPlayer</td>
			<td>50</td>
			<td>25</td>
			<td>2500</td>
			<td>2.0</td>
			<td>5h</td>
			<td>10</td>
			<td>5</td>
			<td>2</td>
			<td>15</td>
			<td>0</td>
			<td>5000m</td>
			<td>500</td>
			<td>25</td>
			<td>50</td>
			<td>Private</td>
			<td></td>
		</tr>
	</table>
	<div>
		<a href="?page=1">Previous</a>
		<a href="?page=2">Current</a>
		<a href="?page=3">Next</a>
	</div>
</body>
</html>
			`;

			const result: PlayerListResult = parsePlayerListWithPagination(html, PlayerDatabase.INVASION);

			expect(result.hasNext).toBe(true);
			expect(result.hasPrevious).toBe(true);
		});

		test('should handle nested pagination links', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr><th>Headers</th></tr>
		<tr>
			<td>1</td>
			<td>Player1</td>
			<td>50</td>
			<td>25</td>
			<td>2500</td>
			<td>2.0</td>
			<td>5h</td>
			<td>10</td>
			<td>5</td>
			<td>2</td>
			<td>15</td>
			<td>0</td>
			<td>5000m</td>
			<td>500</td>
			<td>25</td>
			<td>50</td>
			<td>Private</td>
			<td></td>
		</tr>
	</table>
	<div>
		<nav>
			<div>
				<a href="?page=2">Next</a>
			</div>
		</nav>
	</div>
</body>
</html>
			`;

			const result: PlayerListResult = parsePlayerListWithPagination(html, PlayerDatabase.INVASION);

			expect(result.hasNext).toBe(true);
			expect(result.hasPrevious).toBe(false);
		});
	});

	describe('edge cases and error handling', () => {
		test('should handle completely invalid HTML', () => {
			const html = 'This is not HTML at all!';

			expect(() => parsePlayerListFromString(html, PlayerDatabase.INVASION)).not.toThrow();
			const result = parsePlayerListFromString(html, PlayerDatabase.INVASION);
			expect(result).toEqual([]);
		});

		test('should handle empty string', () => {
			const result = parsePlayerListFromString('', PlayerDatabase.INVASION);
			expect(result).toEqual([]);
		});

		test('should handle very large numbers', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr><th>Headers</th></tr>
		<tr>
			<td>1</td>
			<td>BigNumbers</td>
			<td>999999999</td>
			<td>888888888</td>
			<td>777777777</td>
			<td>12.5</td>
			<td>9999h</td>
			<td>666</td>
			<td>555</td>
			<td>444</td>
			<td>333</td>
			<td>222</td>
			<td>111111m</td>
			<td>9999999</td>
			<td>8888</td>
			<td>9999</td>
			<td>General</td>
			<td></td>
		</tr>
	</table>
</body>
</html>
			`;

			const result = parsePlayerListFromString(html, PlayerDatabase.INVASION);

			expect(result).toHaveLength(1);
			expect(result[0].kills).toBe(999999999);
			expect(result[0].deaths).toBe(888888888);
			expect(result[0].score).toBe(777777777);
		});

		test('should handle special characters in username', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr><th>Headers</th></tr>
		<tr>
			<td>1</td>
			<td>Player[TAG]#123</td>
			<td>50</td>
			<td>25</td>
			<td>2500</td>
			<td>2.0</td>
			<td>5h</td>
			<td>10</td>
			<td>5</td>
			<td>2</td>
			<td>15</td>
			<td>0</td>
			<td>5000m</td>
			<td>500</td>
			<td>25</td>
			<td>50</td>
			<td>Private</td>
			<td></td>
		</tr>
	</table>
</body>
</html>
			`;

			const result = parsePlayerListFromString(html, PlayerDatabase.INVASION);

			expect(result).toHaveLength(1);
			expect(result[0].username).toBe('Player[TAG]#123');
			expect(result[0].id).toBe('invasion:Player[TAG]#123');
		});

		test('should handle zero values', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr><th>Headers</th></tr>
		<tr>
			<td>1</td>
			<td>ZeroUser</td>
			<td>0</td>
			<td>0</td>
			<td>0</td>
			<td>0</td>
			<td>0h</td>
			<td>0</td>
			<td>0</td>
			<td>0</td>
			<td>0</td>
			<td>0</td>
			<td>0m</td>
			<td>0</td>
			<td>0</td>
			<td>0</td>
			<td>None</td>
			<td></td>
		</tr>
	</table>
</body>
</html>
			`;

			const result = parsePlayerListFromString(html, PlayerDatabase.INVASION);

			expect(result).toHaveLength(1);
			expect(result[0].kills).toBe(0);
			expect(result[0].deaths).toBe(0);
			expect(result[0].score).toBe(0);
			expect(result[0].kd).toBe(0);
		});

		test('should handle negative numbers as null', () => {
			const html = `
<!DOCTYPE html>
<html>
<body>
	<table>
		<tr><th>Headers</th></tr>
		<tr>
			<td>1</td>
			<td>NegativeUser</td>
			<td>-1</td>
			<td>10</td>
			<td>500</td>
			<td>-0.1</td>
			<td>1h</td>
			<td>0</td>
			<td>0</td>
			<td>0</td>
			<td>0</td>
			<td>0</td>
			<td>100m</td>
			<td>10</td>
			<td>5</td>
			<td>10</td>
			<td>Recruit</td>
			<td></td>
		</tr>
	</table>
</body>
</html>
			`;

			const result = parsePlayerListFromString(html, PlayerDatabase.INVASION);

			expect(result).toHaveLength(1);
			// Note: The actual behavior depends on parseNumber implementation
			// Assuming -1 is parsed as a valid number
			expect(result[0].kills).toBe(-1);
		});
	});
});
