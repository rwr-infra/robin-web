import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import AnnouncementBar from '../../src/routes/AnnouncementBar.svelte';
import { AnnouncementService } from '$lib/services/announcement';

vi.mock('$lib/services/announcement', () => ({
	AnnouncementService: {
		get: vi.fn()
	}
}));

const mockGet = vi.mocked(AnnouncementService.get);
const STORAGE_KEY = 'announcement_dismissed_hash';

// Mirror the component's djb2 hash so we can precompute dismissed values
function hashContent(str: string): string {
	let hash = 5381;
	for (let i = 0; i < str.length; i++) {
		hash = (hash * 33) ^ str.charCodeAt(i);
	}
	return (hash >>> 0).toString(36);
}

describe('AnnouncementBar', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
	});

	it('renders the rich-text html when enabled', async () => {
		mockGet.mockResolvedValue({
			enabled: true,
			html: '<div class="notice">维护公告</div>'
		});

		render(AnnouncementBar);

		expect(await screen.findByText('维护公告')).toBeInTheDocument();
	});

	it('renders nothing when disabled', async () => {
		mockGet.mockResolvedValue({ enabled: false, html: '' });

		const { container } = render(AnnouncementBar);
		await waitFor(() => expect(mockGet).toHaveBeenCalled());

		expect(container.querySelector('.announcement-bar')).toBeNull();
	});

	it('renders nothing when the request fails', async () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		mockGet.mockRejectedValue(new Error('boom'));

		const { container } = render(AnnouncementBar);
		await waitFor(() => expect(mockGet).toHaveBeenCalled());

		expect(container.querySelector('.announcement-bar')).toBeNull();
		spy.mockRestore();
	});

	it('hides and persists the content hash on close', async () => {
		const html = '<span>关服通知</span>';
		mockGet.mockResolvedValue({ enabled: true, html });

		const { container } = render(AnnouncementBar);
		await screen.findByText('关服通知');

		await fireEvent.click(screen.getByRole('button'));

		await waitFor(() => expect(container.querySelector('.announcement-bar')).toBeNull());
		expect(localStorage.getItem(STORAGE_KEY)).toBe(hashContent(html));
	});

	it('stays hidden when the same content was already dismissed', async () => {
		const html = '<span>相同公告</span>';
		localStorage.setItem(STORAGE_KEY, hashContent(html));
		mockGet.mockResolvedValue({ enabled: true, html });

		const { container } = render(AnnouncementBar);
		await waitFor(() => expect(mockGet).toHaveBeenCalled());

		expect(container.querySelector('.announcement-bar')).toBeNull();
	});

	it('shows again when content changed since the last dismissal', async () => {
		localStorage.setItem(STORAGE_KEY, hashContent('<span>旧公告</span>'));
		mockGet.mockResolvedValue({ enabled: true, html: '<span>新公告</span>' });

		render(AnnouncementBar);

		expect(await screen.findByText('新公告')).toBeInTheDocument();
	});

	it('hardens rendered links with target and rel', async () => {
		mockGet.mockResolvedValue({
			enabled: true,
			html: '<a href="https://example.com">link</a>'
		});

		render(AnnouncementBar);
		const link = await screen.findByRole('link', { name: 'link' });

		await waitFor(() => {
			expect(link.getAttribute('target')).toBe('_blank');
			expect(link.getAttribute('rel')).toBe('noopener noreferrer');
		});
	});
});
