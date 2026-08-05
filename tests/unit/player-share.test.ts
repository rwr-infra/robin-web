import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock snapdom - factory function is hoisted
vi.mock('@zumer/snapdom', () => ({
	snapdom: vi.fn(),
	type: {} as any
}));

import { playerShareService } from '$lib/services/player-share';

describe('PlayerShareService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('canCopyToClipboard', () => {
		afterEach(() => {
			delete (navigator as any).clipboard;
		});

		it('should return true when clipboard API is supported', () => {
			Object.assign(navigator, {
				clipboard: { write: vi.fn() }
			});

			expect(playerShareService.canCopyToClipboard()).toBe(true);
		});

		it('should return false when clipboard API is not supported', () => {
			Object.assign(navigator, { clipboard: undefined });

			expect(playerShareService.canCopyToClipboard()).toBe(false);
		});

		it('should return false when write method is not available', () => {
			Object.assign(navigator, { clipboard: {} });

			expect(playerShareService.canCopyToClipboard()).toBe(false);
		});
	});

	describe('generateFilename', () => {
		beforeEach(() => {
			// Mock date to fixed timestamp
			vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-15T10:30:00.000Z');
		});

		it('should generate filename with username and timestamp', () => {
			const filename = playerShareService.generateFilename('testplayer');

			expect(filename).toBe('testplayer_stats_20250115.png');
		});

		it('should support different formats', () => {
			const pngFilename = playerShareService.generateFilename('player1', 'png');
			const jpegFilename = playerShareService.generateFilename('player2', 'jpeg');
			const webpFilename = playerShareService.generateFilename('player3', 'webp');

			expect(pngFilename).toBe('player1_stats_20250115.png');
			expect(jpegFilename).toBe('player2_stats_20250115.jpeg');
			expect(webpFilename).toBe('player3_stats_20250115.webp');
		});

		it('should default to PNG format', () => {
			const filename = playerShareService.generateFilename('testplayer');

			expect(filename).toMatch(/\.png$/);
		});

		it('should handle special characters in username', () => {
			const filename = playerShareService.generateFilename('test-player_123');

			expect(filename).toBe('test-player_123_stats_20250115.png');
		});
	});

	describe('formatTimestamp', () => {
		beforeEach(() => {
			// Mock date to fixed timestamp
			vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('Jan 15, 2025, 2:30 PM');
		});

		it('should format timestamp in English by default', () => {
			const timestamp = Date.now();
			const formatted = playerShareService.formatTimestamp(timestamp);

			expect(formatted).toBe('Jan 15, 2025, 2:30 PM');
		});

		it('should format timestamp with custom locale', () => {
			const timestamp = Date.now();
			const formatted = playerShareService.formatTimestamp(timestamp, 'zh-CN');

			expect(formatted).toBeTruthy();
			expect(typeof formatted).toBe('string');
		});

		it('should handle different timestamp values', () => {
			const ts1 = 1736940600000;
			const ts2 = Date.now();

			const result1 = playerShareService.formatTimestamp(ts1);
			const result2 = playerShareService.formatTimestamp(ts2);

			expect(result1).toBeTruthy();
			expect(result2).toBeTruthy();
		});
	});

	describe('getCurrentTimestamp', () => {
		it('should return current timestamp', () => {
			const before = Date.now();
			const timestamp = playerShareService.getCurrentTimestamp();
			const after = Date.now();

			expect(timestamp).toBeGreaterThanOrEqual(before);
			expect(timestamp).toBeLessThanOrEqual(after);
		});

		it('should return a number', () => {
			const timestamp = playerShareService.getCurrentTimestamp();

			expect(typeof timestamp).toBe('number');
		});
	});

	describe('applyFilters', () => {
		it('should return original blob when no filters provided', async () => {
			const mockBlob = new Blob(['test']);

			const result = await playerShareService.applyFilters(mockBlob, {});

			expect(result).toBe(mockBlob);
		});
	});

	describe('Edge Cases and Error Handling', () => {
		it('should handle empty username in generateFilename', () => {
			vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-15T10:30:00.000Z');

			const filename = playerShareService.generateFilename('');

			expect(filename).toMatch(/^_stats_\d{8}\.png$/);
		});

		it('should handle very long username in generateFilename', () => {
			vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-15T10:30:00.000Z');

			const longUsername = 'a'.repeat(100);
			const filename = playerShareService.generateFilename(longUsername);

			expect(filename).toBeTruthy();
			expect(filename.length).toBeGreaterThan(100);
		});

		it('should handle zero timestamp in formatTimestamp', () => {
			const formatted = playerShareService.formatTimestamp(0);

			expect(formatted).toBeTruthy();
		});

		it('should handle negative timestamp in formatTimestamp', () => {
			const formatted = playerShareService.formatTimestamp(-1000000);

			expect(formatted).toBeTruthy();
		});
	});
});
