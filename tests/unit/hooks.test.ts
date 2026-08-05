import { describe, test, expect, vi } from 'vitest';
import { reroute } from '../../src/hooks';

// Mock the paraglide runtime
vi.mock('$lib/paraglide/runtime', () => ({
	deLocalizeUrl: vi.fn((url) => {
		// Simulate delocalization by removing locale prefix
		const urlObj = new URL(url);
		const pathname = urlObj.pathname;

		// Remove common locale prefixes like /en-us, /zh-cn
		const delocalized = pathname.replace(/^\/(en-us|zh-cn|en|zh)(\/|$)/, '/');

		return {
			pathname: delocalized === '' ? '/' : delocalized,
			search: urlObj.search,
			hash: urlObj.hash
		};
	})
}));

describe('hooks', () => {
	const mockFetch = vi.fn();

	describe('reroute', () => {
		test('should return delocalized pathname', () => {
			const mockRequest = {
				url: 'http://localhost:3000/en-us/page',
				fetch: mockFetch
			};

			const result = reroute(mockRequest as any);

			expect(result).toBe('/page');
		});

		test('should handle root path', () => {
			const mockRequest = {
				url: 'http://localhost:3000/',
				fetch: mockFetch
			};

			const result = reroute(mockRequest as any);

			expect(result).toBe('/');
		});

		test('should handle path with query parameters', () => {
			const mockRequest = {
				url: 'http://localhost:3000/en-us/page?query=test',
				fetch: mockFetch
			};

			const result = reroute(mockRequest as any);

			// deLocalizeUrl returns pathname without query
			expect(typeof result).toBe('string');
		});

		test('should handle path with hash', () => {
			const mockRequest = {
				url: 'http://localhost:3000/en-us/page#section',
				fetch: mockFetch
			};

			const result = reroute(mockRequest as any);

			expect(typeof result).toBe('string');
		});

		test('should handle path without locale prefix', () => {
			const mockRequest = {
				url: 'http://localhost:3000/page',
				fetch: mockFetch
			};

			const result = reroute(mockRequest as any);

			expect(result).toBe('/page');
		});

		test('should handle nested paths', () => {
			const mockRequest = {
				url: 'http://localhost:3000/en-us/section/subsection/page',
				fetch: mockFetch
			};

			const result = reroute(mockRequest as any);

			expect(result).toBe('/section/subsection/page');
		});

		test('should handle zh-cn locale', () => {
			const mockRequest = {
				url: 'http://localhost:3000/zh-cn/page',
				fetch: mockFetch
			};

			const result = reroute(mockRequest as any);

			expect(result).toBe('/page');
		});

		test('should handle different domain', () => {
			const mockRequest = {
				url: 'https://example.com/en-us/page',
				fetch: mockFetch
			};

			const result = reroute(mockRequest as any);

			expect(typeof result).toBe('string');
		});

		test('should handle URL with port', () => {
			const mockRequest = {
				url: 'http://localhost:5173/en-us/page',
				fetch: mockFetch
			};

			const result = reroute(mockRequest as any);

			expect(result).toBe('/page');
		});

		test('should handle URL with trailing slash', () => {
			const mockRequest = {
				url: 'http://localhost:3000/en-us/page/',
				fetch: mockFetch
			};

			const result = reroute(mockRequest as any);

			expect(typeof result).toBe('string');
		});

		test('should handle complex query parameters', () => {
			const mockRequest = {
				url: 'http://localhost:3000/en-us/page?search=test&filters=invasion,dominance&page=2',
				fetch: mockFetch
			};

			const result = reroute(mockRequest as any);

			expect(typeof result).toBe('string');
		});

		test('should handle URL encoded characters', () => {
			const mockRequest = {
				url: 'http://localhost:3000/en-us/page?query=hello%20world',
				fetch: mockFetch
			};

			const result = reroute(mockRequest as any);

			expect(typeof result).toBe('string');
		});

		test('should handle API routes', () => {
			const mockRequest = {
				url: 'http://localhost:3000/en-us/api/data',
				fetch: mockFetch
			};

			const result = reroute(mockRequest as any);

			expect(result).toBe('/api/data');
		});

		test('should handle static asset paths', () => {
			const mockRequest = {
				url: 'http://localhost:3000/en-us/favicon.png',
				fetch: mockFetch
			};

			const result = reroute(mockRequest as any);

			expect(result).toBe('/favicon.png');
		});

		test('should return string type', () => {
			const mockRequest = {
				url: 'http://localhost:3000/test',
				fetch: mockFetch
			};

			const result = reroute(mockRequest as any);

			expect(typeof result).toBe('string');
		});
	});
});
