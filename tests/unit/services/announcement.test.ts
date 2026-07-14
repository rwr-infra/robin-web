import { describe, it, expect, vi, beforeEach } from 'vitest';
import { request } from '$lib/request';
import { AnnouncementService } from '$lib/services/announcement';

vi.mock('$lib/request', () => ({
	request: vi.fn()
}));

const mockRequest = vi.mocked(request);

describe('AnnouncementService.get', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('requests /api/announcement with a cache-busting timestamp', async () => {
		mockRequest.mockResolvedValue({ enabled: false, html: '' });

		await AnnouncementService.get();

		expect(mockRequest).toHaveBeenCalledTimes(1);
		const [url, options, responseType] = mockRequest.mock.calls[0];
		expect(url).toMatch(/^\/api\/announcement\?_t=\d+$/);
		expect(options).toEqual({});
		expect(responseType).toBe('json');
	});

	it('returns the parsed announcement payload', async () => {
		const payload = { enabled: true, html: '<div class="notice">hi</div>' };
		mockRequest.mockResolvedValue(payload);

		const result = await AnnouncementService.get();

		expect(result).toEqual(payload);
	});

	it('propagates request errors', async () => {
		mockRequest.mockRejectedValue(new Error('network down'));

		await expect(AnnouncementService.get()).rejects.toThrow('network down');
	});
});
