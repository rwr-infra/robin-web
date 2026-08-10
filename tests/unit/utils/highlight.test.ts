import { describe, test, expect } from 'vitest';
import {
	highlightMatch,
	highlightInBadge,
	renderPlayerListWithHighlight
} from '$lib/utils/highlight';

describe('highlightMatch', () => {
	test('should return original text if query is empty', () => {
		expect(highlightMatch('Hello World', '')).toBe('Hello World');
		expect(highlightMatch('Hello World', '   ')).toBe('Hello World');
	});

	test('should return original text if text is empty', () => {
		expect(highlightMatch('', 'test')).toBe('');
	});

	test('should highlight simple match', () => {
		const result = highlightMatch('Hello World', 'World');
		expect(result).toContain('<mark class="bg-warning/25 rounded px-1 font-semibold">World</mark>');
	});

	test('should be case insensitive', () => {
		expect(highlightMatch('Hello World', 'world')).toContain('<mark');
		expect(highlightMatch('Hello World', 'WORLD')).toContain('<mark');
		expect(highlightMatch('Hello World', 'WoRlD')).toContain('<mark');
	});

	test('should highlight multiple occurrences', () => {
		const result = highlightMatch('test test test', 'test');
		const matches = result.match(/<mark/g);
		expect(matches?.length).toBe(3);
	});

	test('should use custom className when provided', () => {
		const result = highlightMatch('Hello World', 'World', 'custom-class');
		expect(result).toContain('<mark class="custom-class">World</mark>');
	});

	test('should escape special regex characters in query', () => {
		expect(highlightMatch('test.file.txt', 'test.file')).toContain('<mark');
		expect(highlightMatch('price $100', '$100')).toContain('<mark');
		expect(highlightMatch('a+b=c', 'a+b')).toContain('<mark');
	});

	test('should handle special characters correctly', () => {
		// Test common special regex characters
		const specialChars = ['.', '*', '+', '?', '^', '$', '{', '}', '(', ')', '[', ']', '|', '\\'];

		for (const char of specialChars) {
			const text = `test${char}value`;
			const result = highlightMatch(text, char);
			// Should not throw and should highlight
			expect(result).toContain('<mark');
		}
	});

	test('should handle overlapping matches', () => {
		const result = highlightMatch('aaa', 'aa');
		// Regex will find non-overlapping matches
		expect(result).toContain('<mark');
	});

	test('should preserve non-matching text', () => {
		const result = highlightMatch('Hello World', 'World');
		expect(result).toContain('Hello ');
	});

	test('should match at start of text', () => {
		const result = highlightMatch('Hello World', 'Hello');
		expect(result).toMatch(/^<mark[^>]*>Hello<\/mark> World/);
	});

	test('should match at end of text', () => {
		const result = highlightMatch('Hello World', 'World');
		expect(result).toMatch(/Hello <mark[^>]*>World<\/mark>$/);
	});

	test('should handle single character matches', () => {
		const result = highlightMatch('abc', 'b');
		expect(result).toContain('<mark');
	});

	test('should handle numeric matches', () => {
		const result = highlightMatch('Player 123', '123');
		expect(result).toContain('<mark');
	});

	test('should handle unicode characters', () => {
		const result = highlightMatch('café', 'é');
		expect(result).toContain('<mark');
	});

	test('should escape html in source text', () => {
		const result = highlightMatch('<img src=x onerror=alert(1)>', 'img');
		expect(result).toContain('&lt;');
		expect(result).not.toContain('<img');
	});
});

describe('highlightInBadge', () => {
	test('should return original text if query is empty', () => {
		expect(highlightInBadge('Hello', '')).toBe('Hello');
	});

	test('should return original text if text is empty', () => {
		expect(highlightInBadge('', 'test')).toBe('');
	});

	test('should mark the match with weight and an underline', () => {
		const result = highlightInBadge('Player1', 'Player');
		expect(result).toContain(
			'<span class="font-bold underline decoration-2 underline-offset-2">Player</span>'
		);
	});

	test('should be case insensitive', () => {
		expect(highlightInBadge('Player1', 'player')).toContain('<span');
		expect(highlightInBadge('Player1', 'PLAYER')).toContain('<span');
	});

	test('should highlight multiple occurrences', () => {
		const result = highlightInBadge('test test', 'test');
		const matches = result.match(/<span/g);
		expect(matches?.length).toBe(2);
	});

	test('should escape special regex characters in query', () => {
		expect(highlightInBadge('player.name', 'player.')).toContain('<span');
	});

	test('should use inline styling approach suitable for badges', () => {
		const result = highlightInBadge('Player1', 'Player');
		expect(result).toContain('underline');
	});

	test('should escape html when query is empty', () => {
		const result = highlightInBadge('<script>alert(1)</script>', '');
		expect(result).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
		expect(result).not.toContain('<script>');
	});
});

describe('renderPlayerListWithHighlight', () => {
	test('should return dash for empty player list', () => {
		expect(renderPlayerListWithHighlight([])).toBe('-');
	});

	test('should return dash for empty player list even with query', () => {
		expect(renderPlayerListWithHighlight([], 'test')).toBe('-');
	});

	test('should render single player badge without highlighting', () => {
		const result = renderPlayerListWithHighlight(['Player1']);
		expect(result).toContain('Player1');
		expect(result).toContain('badge');
		expect(result).toContain('badge-neutral');
	});

	test('should render single player badge with highlighting', () => {
		const result = renderPlayerListWithHighlight(['Player1'], 'Player');
		expect(result).toContain(
			'<span class="font-bold underline decoration-2 underline-offset-2">Player</span>'
		);
		expect(result).toContain('underline');
	});

	test('should render multiple players with badges', () => {
		const result = renderPlayerListWithHighlight(['Player1', 'Player2', 'Player3']);
		// Count the number of badge-neutral classes (each player has one)
		const badges = result.match(/badge-neutral/g);
		expect(badges?.length).toBe(3);
	});

	test('should highlight matching players', () => {
		const result = renderPlayerListWithHighlight(['Alpha', 'Bravo', 'Charlie'], 'Bravo');
		expect(result).toContain(
			'<span class="font-bold underline decoration-2 underline-offset-2">Bravo</span>'
		);
	});

	test('should include proper flex layout classes', () => {
		const result = renderPlayerListWithHighlight(['Player1']);
		expect(result).toContain('flex flex-wrap gap-1');
	});

	test('should include badge styling classes', () => {
		const result = renderPlayerListWithHighlight(['Player1']);
		expect(result).toContain(
			'badge badge-sm badge-soft badge-neutral gap-0 whitespace-nowrap shrink-0'
		);
	});

	test('should highlight partial matches', () => {
		const result = renderPlayerListWithHighlight(['PlayerOne', 'PlayerTwo'], 'Player');
		const highlights = result.match(/badge-neutral/g);
		expect(highlights?.length).toBe(2);
	});

	test('should handle special characters in player names', () => {
		const result = renderPlayerListWithHighlight(['Player.One', 'Player-Two'], 'Player');
		const highlights = result.match(/badge-neutral/g);
		expect(highlights?.length).toBe(2);
	});

	test('should not highlight when query does not match', () => {
		const result = renderPlayerListWithHighlight(['Alpha', 'Bravo'], 'Charlie');
		expect(result).toContain('badge-neutral');
	});

	test('should handle empty query gracefully', () => {
		const result = renderPlayerListWithHighlight(['Player1', 'Player2'], '');
		expect(result).toContain('Player1');
		expect(result).toContain('Player2');
		expect(result).toContain('badge-neutral');
	});

	test('should escape player names without query', () => {
		const result = renderPlayerListWithHighlight(['<b>bad</b>']);
		expect(result).toContain('&lt;b&gt;bad&lt;/b&gt;');
		expect(result).not.toContain('<b>bad</b>');
	});

	test('should wrap badges in flex container', () => {
		const result = renderPlayerListWithHighlight(['Player1']);
		expect(result).toMatch(/^<div class="flex flex-wrap gap-1 items-start w-full">/);
		expect(result).toMatch(/<\/div>$/);
	});
});

describe('Edge Cases and Integration', () => {
	test('should handle very long player names', () => {
		const longName = 'VeryLongPlayerNameThatShouldNotBreak';
		const result = highlightMatch(longName, 'Long');
		expect(result).toContain('<mark');
	});

	test('should handle whitespace in text', () => {
		const result = highlightMatch('  Hello World  ', 'World');
		expect(result).toContain('<mark');
	});

	test('should handle newlines in text', () => {
		const result = highlightMatch('Hello\nWorld', 'World');
		expect(result).toContain('<mark');
	});

	test('should handle tabs in text', () => {
		const result = highlightMatch('Hello\tWorld', 'World');
		expect(result).toContain('<mark');
	});

	test('should handle HTML entities in query', () => {
		const result = highlightMatch('test &amp; value', '&amp;');
		expect(result).toContain('<mark');
	});

	test('should work with renderPlayerListWithHighlight and complex queries', () => {
		const players = ['Player-One', 'Player_Two', 'Player.Three'];
		const result = renderPlayerListWithHighlight(players, 'Player');
		const matches = result.match(/underline-offset-2/g);
		expect(matches?.length).toBe(3);
	});

	test('should handle player names with numbers', () => {
		const result = renderPlayerListWithHighlight(['Player123', 'Player456'], '123');
		expect(result).toContain(
			'<div class="flex flex-wrap gap-1 items-start w-full"><span class="badge badge-sm badge-soft badge-neutral gap-0 whitespace-nowrap shrink-0">Player<span class="font-bold underline decoration-2 underline-offset-2">123</span></span><span class="badge badge-sm badge-soft badge-neutral gap-0 whitespace-nowrap shrink-0">Player456</span></div>'
		);
	});

	test('should preserve original text structure when highlighting', () => {
		const text = 'Hello World Test';
		const result = highlightMatch(text, 'World');
		expect(result).toContain('Hello ');
		expect(result).toContain(' Test');
	});

	test('should handle case where entire text matches', () => {
		const result = highlightMatch('test', 'test');
		expect(result).toMatch(/^<mark[^>]*>test<\/mark>$/);
	});
});
