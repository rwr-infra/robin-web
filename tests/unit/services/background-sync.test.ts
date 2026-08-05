import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
	registerSync,
	queueServerRefresh,
	isBackgroundSyncSupported,
	registerPeriodicSync,
	unregisterPeriodicSync
} from '$lib/services/background-sync';

describe('background-sync', () => {
	let mockServiceWorkerRegistration: any;
	let mockSyncManager: any;
	let mockPeriodicSyncManager: any;

	beforeEach(() => {
		vi.clearAllMocks();

		// Create mock sync manager
		mockSyncManager = {
			register: vi.fn().mockResolvedValue(undefined)
		};

		// Create mock periodic sync manager
		mockPeriodicSyncManager = {
			getTags: vi.fn().mockResolvedValue([]),
			register: vi.fn().mockResolvedValue(undefined),
			unregister: vi.fn().mockResolvedValue(undefined)
		};

		// Create mock service worker registration
		mockServiceWorkerRegistration = {
			sync: mockSyncManager,
			periodicSync: mockPeriodicSyncManager
		};

		// Mock navigator.serviceWorker
		Object.defineProperty(global, 'navigator', {
			writable: true,
			value: {
				serviceWorker: {
					ready: Promise.resolve(mockServiceWorkerRegistration)
				}
			}
		});

		// Mock ServiceWorkerRegistration.prototype
		Object.defineProperty(global, 'ServiceWorkerRegistration', {
			writable: true,
			value: {
				prototype: {
					sync: mockSyncManager,
					periodicSync: mockPeriodicSyncManager
				}
			}
		});
	});

	describe('isBackgroundSyncSupported', () => {
		test('should return true when background sync is supported', () => {
			const result = isBackgroundSyncSupported();
			expect(result).toBe(true);
		});

		test('should return false when serviceWorker is not available', () => {
			Object.defineProperty(global, 'navigator', {
				writable: true,
				value: {}
			});

			const result = isBackgroundSyncSupported();
			expect(result).toBe(false);
		});

		test('should return false when sync is not in ServiceWorkerRegistration', () => {
			Object.defineProperty(global, 'ServiceWorkerRegistration', {
				writable: true,
				value: {
					prototype: {}
				}
			});

			const result = isBackgroundSyncSupported();
			expect(result).toBe(false);
		});
	});

	describe('registerSync', () => {
		test('should register a background sync event', async () => {
			registerSync('test-sync');

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(mockSyncManager.register).toHaveBeenCalledWith('test-sync');
		});

		test('should handle sync registration errors', async () => {
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			mockSyncManager.register.mockRejectedValue(new Error('Registration failed'));

			registerSync('failing-sync');

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				expect.stringContaining('Sync registration failed'),
				expect.any(Error)
			);

			consoleErrorSpy.mockRestore();
		});

		test('should log warning when background sync is not supported', () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			Object.defineProperty(global, 'navigator', {
				writable: true,
				value: {}
			});

			registerSync('test-sync');

			expect(consoleWarnSpy).toHaveBeenCalledWith('Background Sync API not supported');

			consoleWarnSpy.mockRestore();
		});
	});

	describe('queueServerRefresh', () => {
		test('should queue server refresh sync', async () => {
			queueServerRefresh();

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(mockSyncManager.register).toHaveBeenCalledWith('server-refresh');
		});

		test('should use registerSync internally', async () => {
			queueServerRefresh();

			await new Promise((resolve) => setTimeout(resolve, 10));

			// Just verify queueServerRefresh can be called without errors
			expect(mockSyncManager.register).toHaveBeenCalled();
		});
	});

	describe('registerPeriodicSync', () => {
		test('should register a periodic sync event', async () => {
			const tag = 'periodic-refresh';
			const minInterval = 60000; // 1 minute

			registerPeriodicSync(tag, minInterval);

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(mockPeriodicSyncManager.getTags).toHaveBeenCalled();
			expect(mockPeriodicSyncManager.register).toHaveBeenCalledWith(tag, { minInterval });
		});

		test('should not register if tag already exists', async () => {
			mockPeriodicSyncManager.getTags.mockResolvedValue(['existing-tag']);

			const tag = 'existing-tag';
			const minInterval = 60000;

			registerPeriodicSync(tag, minInterval);

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(mockPeriodicSyncManager.getTags).toHaveBeenCalled();
			expect(mockPeriodicSyncManager.register).not.toHaveBeenCalled();
		});

		test('should handle periodic sync registration errors', async () => {
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			mockPeriodicSyncManager.getTags.mockRejectedValue(new Error('Failed to get tags'));

			registerPeriodicSync('test-periodic', 60000);

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				expect.stringContaining('Periodic sync registration failed'),
				expect.any(Error)
			);

			consoleErrorSpy.mockRestore();
		});

		test('should log warning when periodic sync is not supported', () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			Object.defineProperty(global, 'ServiceWorkerRegistration', {
				writable: true,
				value: {
					prototype: {}
				}
			});

			registerPeriodicSync('test-periodic', 60000);

			expect(consoleWarnSpy).toHaveBeenCalledWith('Periodic Background Sync API not supported');

			consoleWarnSpy.mockRestore();
		});

		test('should handle different minInterval values', async () => {
			const intervals = [60000, 3600000, 86400000]; // 1 min, 1 hour, 1 day

			for (const interval of intervals) {
				mockPeriodicSyncManager.register.mockClear();
				registerPeriodicSync('test-sync', interval);

				await new Promise((resolve) => setTimeout(resolve, 10));

				expect(mockPeriodicSyncManager.register).toHaveBeenCalledWith('test-sync', {
					minInterval: interval
				});
			}
		});

		test('should handle registration error after getTags succeeds', async () => {
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			mockPeriodicSyncManager.getTags.mockResolvedValue([]);
			mockPeriodicSyncManager.register.mockRejectedValue(new Error('Registration failed'));

			registerPeriodicSync('test-sync', 60000);

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(consoleErrorSpy).toHaveBeenCalled();

			consoleErrorSpy.mockRestore();
		});
	});

	describe('unregisterPeriodicSync', () => {
		test('should unregister a periodic sync event', async () => {
			const tag = 'test-periodic';

			unregisterPeriodicSync(tag);

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(mockPeriodicSyncManager.unregister).toHaveBeenCalledWith(tag);
		});

		test('should handle unregistration errors', async () => {
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			mockPeriodicSyncManager.unregister.mockRejectedValue(new Error('Unregister failed'));

			unregisterPeriodicSync('test-sync');

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				expect.stringContaining('Periodic sync unregistration failed'),
				expect.any(Error)
			);

			consoleErrorSpy.mockRestore();
		});

		test('should not throw when periodic sync is not supported', () => {
			Object.defineProperty(global, 'ServiceWorkerRegistration', {
				writable: true,
				value: {
					prototype: {}
				}
			});

			expect(() => unregisterPeriodicSync('test-sync')).not.toThrow();
		});

		test('should not throw when serviceWorker is not available', () => {
			Object.defineProperty(global, 'navigator', {
				writable: true,
				value: {}
			});

			expect(() => unregisterPeriodicSync('test-sync')).not.toThrow();
		});
	});

	describe('edge cases', () => {
		test('should handle undefined sync manager', async () => {
			mockServiceWorkerRegistration.sync = undefined;

			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			registerSync('test-sync');

			await new Promise((resolve) => setTimeout(resolve, 10));

			// Should handle gracefully without throwing
			expect(() => registerSync('test-sync')).not.toThrow();

			consoleWarnSpy.mockRestore();
		});

		test('should handle undefined periodic sync manager', async () => {
			// Set periodicSync to undefined after setup
			Object.defineProperty(global, 'ServiceWorkerRegistration', {
				writable: true,
				value: {
					prototype: {}
				}
			});

			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			registerPeriodicSync('test-sync', 60000);

			expect(consoleWarnSpy).toHaveBeenCalledWith('Periodic Background Sync API not supported');

			consoleWarnSpy.mockRestore();
		});

		test('should handle multiple concurrent registerSync calls', async () => {
			registerSync('sync-1');
			registerSync('sync-2');
			registerSync('sync-3');

			await new Promise((resolve) => setTimeout(resolve, 20));

			expect(mockSyncManager.register).toHaveBeenCalledTimes(3);
		});

		test('should handle multiple concurrent periodic sync registrations', async () => {
			registerPeriodicSync('periodic-1', 60000);
			registerPeriodicSync('periodic-2', 120000);

			await new Promise((resolve) => setTimeout(resolve, 20));

			expect(mockPeriodicSyncManager.getTags).toHaveBeenCalledTimes(2);
		});

		test('should handle empty tag string', async () => {
			registerSync('');

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(mockSyncManager.register).toHaveBeenCalledWith('');
		});

		test('should handle very long tag names', async () => {
			const longTag = 'a'.repeat(1000);

			registerSync(longTag);

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(mockSyncManager.register).toHaveBeenCalledWith(longTag);
		});

		test('should handle zero minInterval', async () => {
			registerPeriodicSync('test-sync', 0);

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(mockPeriodicSyncManager.register).toHaveBeenCalledWith('test-sync', {
				minInterval: 0
			});
		});

		test('should handle negative minInterval', async () => {
			registerPeriodicSync('test-sync', -1000);

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(mockPeriodicSyncManager.register).toHaveBeenCalledWith('test-sync', {
				minInterval: -1000
			});
		});
	});
});
