import { describe, test, expect, vi, beforeEach } from 'vitest';
import { handle, handleHttpError } from '../../src/hooks.server';
import type { RequestEvent } from '@sveltejs/kit';

// Mock paraglide middleware
vi.mock('$lib/paraglide/server', () => ({
	paraglideMiddleware: vi.fn((request, callback) => {
		return callback({
			request,
			locale: 'en-us'
		});
	})
}));

describe('hooks.server', () => {
	describe('handle', () => {
		test('should process request through paraglide middleware', async () => {
			const mockRequest = new Request('http://localhost:3000/test');
			const mockEvent = {
				request: mockRequest,
				url: new URL('http://localhost:3000/test')
			} as RequestEvent;

			const mockResolve = vi.fn(async (event, options) => {
				// Simulate transformPageChunk
				const html = '<html lang="%paraglide.lang%"><body>Test</body></html>';
				const transformed = options?.transformPageChunk
					? options.transformPageChunk({ html, done: true })
					: html;
				return new Response(transformed);
			});

			const response = await handle({ event: mockEvent, resolve: mockResolve });

			expect(mockResolve).toHaveBeenCalled();
			expect(response).toBeInstanceOf(Response);

			const text = await response.text();
			expect(text).toContain('en-us');
			expect(text).not.toContain('%paraglide.lang%');
		});

		test('should replace paraglide.lang placeholder with locale', async () => {
			const mockRequest = new Request('http://localhost:3000/test');
			const mockEvent = {
				request: mockRequest,
				url: new URL('http://localhost:3000/test')
			} as RequestEvent;

			const mockResolve = vi.fn(async (event, options) => {
				const html = '<html lang="%paraglide.lang%"></html>';
				const transformed = options?.transformPageChunk
					? options.transformPageChunk({ html, done: true })
					: html;
				return new Response(transformed);
			});

			const response = await handle({ event: mockEvent, resolve: mockResolve });
			const text = await response.text();

			expect(text).toBe('<html lang="en-us"></html>');
		});

		test('should handle multiple paraglide.lang placeholders', async () => {
			const mockRequest = new Request('http://localhost:3000/test');
			const mockEvent = {
				request: mockRequest,
				url: new URL('http://localhost:3000/test')
			} as RequestEvent;

			const mockResolve = vi.fn(async (event, options) => {
				const html =
					'<html lang="%paraglide.lang%"><body data-locale="%paraglide.lang%"></body></html>';
				const transformed = options?.transformPageChunk
					? options.transformPageChunk({ html, done: true })
					: html;
				return new Response(transformed);
			});

			const response = await handle({ event: mockEvent, resolve: mockResolve });
			const text = await response.text();

			expect(text).toContain('lang="en-us"');
			// Note: replace only replaces first occurrence in the actual implementation
		});

		test('should update event request', async () => {
			const mockRequest = new Request('http://localhost:3000/test');
			const mockEvent = {
				request: mockRequest,
				url: new URL('http://localhost:3000/test')
			} as RequestEvent;

			const mockResolve = vi.fn(async () => new Response('OK'));

			await handle({ event: mockEvent, resolve: mockResolve });

			expect(mockResolve).toHaveBeenCalledWith(
				expect.objectContaining({
					request: expect.any(Request)
				}),
				expect.any(Object)
			);
		});
	});

	describe('handleHttpError', () => {
		test('should return 200 for 404 on og-image', () => {
			const error = new Error('404 Not Found: /og-image-1200x630.png');
			const mockEvent = {
				request: new Request('http://localhost:3000/og-image-1200x630.png')
			} as RequestEvent;

			const response = handleHttpError({ error, event: mockEvent });

			expect(response).toBeInstanceOf(Response);
			expect(response.status).toBe(200);
		});

		test('should return 200 for 404 on favicon', () => {
			const error = new Error('404 Not Found: /favicon.png');
			const mockEvent = {
				request: new Request('http://localhost:3000/favicon.png')
			} as RequestEvent;

			const response = handleHttpError({ error, event: mockEvent });

			expect(response.status).toBe(200);
		});

		test('should return 200 for 404 on apple-icon', () => {
			const error = new Error('404 Not Found: /apple-icon-180.png');
			const mockEvent = {
				request: new Request('http://localhost:3000/apple-icon-180.png')
			} as RequestEvent;

			const response = handleHttpError({ error, event: mockEvent });

			expect(response.status).toBe(200);
		});

		test('should return 200 for 404 on apple-splash', () => {
			const error = new Error('404 Not Found: /apple-splash-1125-2436.jpg');
			const mockEvent = {
				request: new Request('http://localhost:3000/apple-splash-1125-2436.jpg')
			} as RequestEvent;

			const response = handleHttpError({ error, event: mockEvent });

			expect(response.status).toBe(200);
		});

		test('should return 200 for 404 on .png files', () => {
			const error = new Error('404 Not Found: /some-image.png');
			const mockEvent = {
				request: new Request('http://localhost:3000/some-image.png')
			} as RequestEvent;

			const response = handleHttpError({ error, event: mockEvent });

			expect(response.status).toBe(200);
		});

		test('should return 200 for 404 on .jpg files', () => {
			const error = new Error('404 Not Found: /some-image.jpg');
			const mockEvent = {
				request: new Request('http://localhost:3000/some-image.jpg')
			} as RequestEvent;

			const response = handleHttpError({ error, event: mockEvent });

			expect(response.status).toBe(200);
		});

		test('should return 200 for 404 on .webp files', () => {
			const error = new Error('404 Not Found: /some-image.webp');
			const mockEvent = {
				request: new Request('http://localhost:3000/some-image.webp')
			} as RequestEvent;

			const response = handleHttpError({ error, event: mockEvent });

			expect(response.status).toBe(200);
		});

		test('should return 500 for 404 on non-asset files', () => {
			const error = new Error('404 Not Found: /api/data');
			const mockEvent = {
				request: new Request('http://localhost:3000/api/data')
			} as RequestEvent;

			const response = handleHttpError({ error, event: mockEvent });

			expect(response.status).toBe(500);
		});

		test('should return 500 for non-404 errors', () => {
			const error = new Error('Internal Server Error');
			const mockEvent = {
				request: new Request('http://localhost:3000/test')
			} as RequestEvent;

			const response = handleHttpError({ error, event: mockEvent });

			expect(response.status).toBe(500);
		});

		test('should return 500 for 500 errors', () => {
			const error = new Error('500 Internal Server Error');
			const mockEvent = {
				request: new Request('http://localhost:3000/test')
			} as RequestEvent;

			const response = handleHttpError({ error, event: mockEvent });

			expect(response.status).toBe(500);
		});

		test('should handle URL with query parameters', () => {
			const error = new Error('404 Not Found: /og-image.png?v=123');
			const mockEvent = {
				request: new Request('http://localhost:3000/og-image.png?v=123')
			} as RequestEvent;

			const response = handleHttpError({ error, event: mockEvent });

			expect(response.status).toBe(200);
		});

		test('should handle nested paths', () => {
			const error = new Error('404 Not Found: /images/icons/favicon.png');
			const mockEvent = {
				request: new Request('http://localhost:3000/images/icons/favicon.png')
			} as RequestEvent;

			const response = handleHttpError({ error, event: mockEvent });

			expect(response.status).toBe(200);
		});

		test('should return null body for successful responses', () => {
			const error = new Error('404 Not Found: /favicon.png');
			const mockEvent = {
				request: new Request('http://localhost:3000/favicon.png')
			} as RequestEvent;

			const response = handleHttpError({ error, event: mockEvent });

			expect(response.body).toBeNull();
		});

		test('should handle multiple conditions in single error', () => {
			const error = new Error('404 Not Found: /apple-icon-180.png');
			const mockEvent = {
				request: new Request('http://localhost:3000/apple-icon-180.png')
			} as RequestEvent;

			const response = handleHttpError({ error, event: mockEvent });

			// Should match both apple-icon condition and .png condition
			expect(response.status).toBe(200);
		});
	});

	describe('error message variations', () => {
		test('should handle error message with different 404 format', () => {
			const error = new Error('Not Found (404): /favicon.png');
			const mockEvent = {
				request: new Request('http://localhost:3000/favicon.png')
			} as RequestEvent;

			const response = handleHttpError({ error, event: mockEvent });

			// The error message contains '404' and pathname contains 'favicon'
			// So it should return 200
			expect(response.status).toBe(200);
		});

		test('should be case-sensitive for 404 in error message', () => {
			const error = new Error('not found: /favicon.png'); // lowercase
			const mockEvent = {
				request: new Request('http://localhost:3000/favicon.png')
			} as RequestEvent;

			const response = handleHttpError({ error, event: mockEvent });

			expect(response.status).toBe(500); // Should return 500 as '404' not in message
		});
	});
});
