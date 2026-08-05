import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock snapdom
vi.mock('@zumer/snapdom', () => ({
	snapdom: vi.fn(),
	type: {} as any
}));

import { serverShareService } from '$lib/services/server-share';

describe('ServerShareService', () => {
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

			expect(serverShareService.canCopyToClipboard()).toBe(true);
		});

		it('should return false when clipboard API is not supported', () => {
			Object.assign(navigator, { clipboard: undefined });

			expect(serverShareService.canCopyToClipboard()).toBe(false);
		});

		it('should return false when write method is not available', () => {
			Object.assign(navigator, { clipboard: {} });

			expect(serverShareService.canCopyToClipboard()).toBe(false);
		});
	});

	describe('generateFilename', () => {
		beforeEach(() => {
			// Mock date to fixed timestamp
			vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-15T10:30:00.000Z');
		});

		it('should generate filename with server name and timestamp', () => {
			const filename = serverShareService.generateFilename('Test Server');

			expect(filename).toBe('Test_Server_server_20250115.png');
		});

		it('should support different formats', () => {
			const pngFilename = serverShareService.generateFilename('Server1', 'png');
			const jpegFilename = serverShareService.generateFilename('Server2', 'jpeg');
			const webpFilename = serverShareService.generateFilename('Server3', 'webp');

			expect(pngFilename).toBe('Server1_server_20250115.png');
			expect(jpegFilename).toBe('Server2_server_20250115.jpeg');
			expect(webpFilename).toBe('Server3_server_20250115.webp');
		});

		it('should default to PNG format', () => {
			const filename = serverShareService.generateFilename('Test Server');

			expect(filename).toMatch(/\.png$/);
		});

		it('should handle special characters in server name', () => {
			const filename = serverShareService.generateFilename('Test-Server_123!@#');

			// Special characters are replaced with underscores
			expect(filename).toBe('Test_Server_123____server_20250115.png');
		});

		it('should truncate long server names to 50 characters', () => {
			const longName = 'A'.repeat(100);
			const filename = serverShareService.generateFilename(longName);

			// Should truncate to 50 chars + "_server_20250115.png"
			expect(filename).toMatch(/^A{50}_server_\d{8}\.png$/);
		});
	});

	describe('formatTimestamp', () => {
		beforeEach(() => {
			// Mock date to fixed timestamp
			vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('Jan 15, 2025, 2:30 PM');
		});

		it('should format timestamp in English by default', () => {
			const timestamp = Date.now();
			const formatted = serverShareService.formatTimestamp(timestamp);

			expect(formatted).toBe('Jan 15, 2025, 2:30 PM');
		});

		it('should format timestamp with custom locale', () => {
			const timestamp = Date.now();
			const formatted = serverShareService.formatTimestamp(timestamp, 'zh-CN');

			expect(formatted).toBeTruthy();
			expect(typeof formatted).toBe('string');
		});

		it('should handle different timestamp values', () => {
			const ts1 = 1736940600000;
			const ts2 = Date.now();

			const result1 = serverShareService.formatTimestamp(ts1);
			const result2 = serverShareService.formatTimestamp(ts2);

			expect(result1).toBeTruthy();
			expect(result2).toBeTruthy();
		});
	});

	describe('getCurrentTimestamp', () => {
		it('should return current timestamp', () => {
			const before = Date.now();
			const timestamp = serverShareService.getCurrentTimestamp();
			const after = Date.now();

			expect(timestamp).toBeGreaterThanOrEqual(before);
			expect(timestamp).toBeLessThanOrEqual(after);
		});

		it('should return a number', () => {
			const timestamp = serverShareService.getCurrentTimestamp();

			expect(typeof timestamp).toBe('number');
		});
	});

	describe('Edge Cases and Error Handling', () => {
		it('should handle empty server name in generateFilename', () => {
			vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-15T10:30:00.000Z');

			const filename = serverShareService.generateFilename('');

			expect(filename).toMatch(/^_server_\d{8}\.png$/);
		});

		it('should handle server name with spaces only', () => {
			vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-15T10:30:00.000Z');

			const filename = serverShareService.generateFilename('   ');

			// Spaces are converted to underscores
			expect(filename).toMatch(/^_+_server_\d{8}\.png$/);
		});

		it('should handle zero timestamp in formatTimestamp', () => {
			const formatted = serverShareService.formatTimestamp(0);

			expect(formatted).toBeTruthy();
		});

		it('should handle negative timestamp in formatTimestamp', () => {
			const formatted = serverShareService.formatTimestamp(-1000000);

			expect(formatted).toBeTruthy();
		});

		it('should handle unicode characters in server name', () => {
			vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-15T10:30:00.000Z');

			const filename = serverShareService.generateFilename('服务器🎮');

			expect(filename).toBeTruthy();
			expect(filename).toContain('server');
		});
	});
});
