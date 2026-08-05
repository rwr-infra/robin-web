import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import AutoRefresh from '$lib/components/AutoRefresh.svelte';

vi.mock('$lib/paraglide/messages.js', () => ({
	m: {
		'app.autoRefresh.toggle': () => 'Auto Refresh'
	}
}));

describe('AutoRefresh', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	test('should render with checkbox unchecked when disabled', () => {
		const mockOnRefresh = vi.fn().mockResolvedValue(undefined);
		render(AutoRefresh, {
			props: {
				enabled: false,
				onRefresh: mockOnRefresh
			}
		});

		const checkbox = screen.getByRole('checkbox');
		expect(checkbox).not.toBeChecked();
	});

	test('should render with checkbox checked when enabled', () => {
		const mockOnRefresh = vi.fn().mockResolvedValue(undefined);
		render(AutoRefresh, {
			props: {
				enabled: true,
				onRefresh: mockOnRefresh
			}
		});

		const checkbox = screen.getByRole('checkbox');
		expect(checkbox).toBeChecked();
	});

	test('should show countdown when enabled', async () => {
		const mockOnRefresh = vi.fn().mockResolvedValue(undefined);
		render(AutoRefresh, {
			props: {
				enabled: true,
				onRefresh: mockOnRefresh
			}
		});

		await waitFor(() => {
			expect(screen.getByText(/\d+s/)).toBeInTheDocument();
		});
	});

	test('should not show countdown when disabled', () => {
		const mockOnRefresh = vi.fn().mockResolvedValue(undefined);
		render(AutoRefresh, {
			props: {
				enabled: false,
				onRefresh: mockOnRefresh
			}
		});

		expect(screen.queryByText(/\d+s/)).not.toBeInTheDocument();
	});

	test('should call onRefresh immediately when enabled', async () => {
		const mockOnRefresh = vi.fn().mockResolvedValue(undefined);
		render(AutoRefresh, {
			props: {
				enabled: true,
				onRefresh: mockOnRefresh
			}
		});

		await waitFor(() => {
			expect(mockOnRefresh).toHaveBeenCalledTimes(1);
		});
	});

	test('should update countdown every second', async () => {
		const mockOnRefresh = vi.fn().mockResolvedValue(undefined);
		render(AutoRefresh, {
			props: {
				enabled: true,
				onRefresh: mockOnRefresh
			}
		});

		await waitFor(() => {
			expect(screen.getByText(/30s/)).toBeInTheDocument();
		});

		vi.advanceTimersByTime(1000);

		await waitFor(() => {
			expect(screen.getByText(/29s/)).toBeInTheDocument();
		});
	});

	test('should toggle auto refresh on checkbox change', async () => {
		const user = userEvent.setup({ delay: null });
		const mockOnRefresh = vi.fn().mockResolvedValue(undefined);
		const mockOnToggleChange = vi.fn();

		render(AutoRefresh, {
			props: {
				enabled: false,
				onRefresh: mockOnRefresh,
				onToggleChange: mockOnToggleChange
			}
		});

		const checkbox = screen.getByRole('checkbox');
		await user.click(checkbox);

		expect(mockOnToggleChange).toHaveBeenCalledWith(true);
	});

	test('should stop auto refresh when toggled off', async () => {
		const user = userEvent.setup({ delay: null });
		const mockOnRefresh = vi.fn().mockResolvedValue(undefined);
		const mockOnToggleChange = vi.fn();

		render(AutoRefresh, {
			props: {
				enabled: true,
				onRefresh: mockOnRefresh,
				onToggleChange: mockOnToggleChange
			}
		});

		const checkbox = screen.getByRole('checkbox');
		mockOnRefresh.mockClear();

		await user.click(checkbox);

		expect(mockOnToggleChange).toHaveBeenCalledWith(false);

		vi.advanceTimersByTime(10000);
		expect(mockOnRefresh).not.toHaveBeenCalled();
	});

	test('should cleanup timer on unmount', async () => {
		const mockOnRefresh = vi.fn().mockResolvedValue(undefined);
		const { unmount } = render(AutoRefresh, {
			props: {
				enabled: true,
				onRefresh: mockOnRefresh
			}
		});

		await waitFor(() => {
			expect(mockOnRefresh).toHaveBeenCalledTimes(1);
		});

		mockOnRefresh.mockClear();
		unmount();

		vi.advanceTimersByTime(10000);
		expect(mockOnRefresh).not.toHaveBeenCalled();
	});

	test('should show animated pulse indicator when enabled', async () => {
		const mockOnRefresh = vi.fn().mockResolvedValue(undefined);
		const { container } = render(AutoRefresh, {
			props: {
				enabled: true,
				onRefresh: mockOnRefresh
			}
		});

		await waitFor(() => {
			const pulseIndicator = container.querySelector('.animate-pulse');
			expect(pulseIndicator).toBeInTheDocument();
		});
	});

	test('should not show pulse indicator when disabled', () => {
		const mockOnRefresh = vi.fn().mockResolvedValue(undefined);
		const { container } = render(AutoRefresh, {
			props: {
				enabled: false,
				onRefresh: mockOnRefresh
			}
		});

		const pulseIndicator = container.querySelector('.animate-pulse');
		expect(pulseIndicator).not.toBeInTheDocument();
	});
});
