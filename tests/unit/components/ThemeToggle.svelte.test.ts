import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ThemeToggle from '$lib/components/ThemeToggle.svelte';

vi.mock('$lib/stores/theme', () => ({
	theme: {
		subscribe: vi.fn(),
		set: vi.fn()
	},
	getCurrentTheme: vi.fn(() => 'light')
}));

vi.mock('$lib/utils/analytics', () => ({
	default: {
		trackThemeChange: vi.fn()
	}
}));

describe('ThemeToggle', () => {
	let mockTheme: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		const themeModule = await import('$lib/stores/theme');
		mockTheme = themeModule.theme;
		vi.mocked(mockTheme.subscribe).mockImplementation((callback: any) => {
			callback('system');
			return () => {};
		});
	});

	test('should render toggle button', () => {
		render(ThemeToggle);
		const button = screen.getByRole('button', { name: /toggle theme/i });
		expect(button).toBeInTheDocument();
	});

	test('should toggle from light to dark', async () => {
		const user = userEvent.setup();
		const themeModule = await import('$lib/stores/theme');
		mockTheme = themeModule.theme;
		vi.mocked(mockTheme.subscribe).mockImplementation((callback: any) => {
			callback('light');
			return () => {};
		});

		render(ThemeToggle);
		const button = screen.getByRole('button', { name: /toggle theme/i });
		await user.click(button);

		expect(vi.mocked(mockTheme.set)).toHaveBeenCalledWith('dark');
	});

	test('should toggle from dark to system', async () => {
		const user = userEvent.setup();
		const themeModule = await import('$lib/stores/theme');
		mockTheme = themeModule.theme;
		vi.mocked(mockTheme.subscribe).mockImplementation((callback: any) => {
			callback('dark');
			return () => {};
		});

		render(ThemeToggle);
		const button = screen.getByRole('button', { name: /toggle theme/i });
		await user.click(button);

		expect(vi.mocked(mockTheme.set)).toHaveBeenCalledWith('system');
	});

	test('should track theme change in analytics', async () => {
		const user = userEvent.setup();
		const { trackThemeChange } = (await import('$lib/utils/analytics')).default;

		mockTheme.subscribe.mockImplementation((callback: any) => {
			callback('light');
			return () => {};
		});

		render(ThemeToggle);
		const button = screen.getByRole('button', { name: /toggle theme/i });
		await user.click(button);

		expect(trackThemeChange).toHaveBeenCalledWith('dark');
	});

	test('should have accessible title attribute', () => {
		render(ThemeToggle);
		const button = screen.getByRole('button', { name: /toggle theme/i });
		expect(button).toHaveAttribute('title');
	});

	test('should have proper ARIA label', () => {
		render(ThemeToggle);
		const button = screen.getByLabelText(/toggle theme/i);
		expect(button).toBeInTheDocument();
	});

	test('should display correct icon for system theme', async () => {
		const themeModule = await import('$lib/stores/theme');
		mockTheme = themeModule.theme;
		vi.mocked(mockTheme.subscribe).mockImplementation((callback: any) => {
			callback('system');
			return () => {};
		});

		const { container } = render(ThemeToggle);
		expect(container.querySelector('svg')).toBeInTheDocument();
	});

	test('should have button type="button"', () => {
		render(ThemeToggle);
		const button = screen.getByRole('button', { name: /toggle theme/i });
		expect(button).toHaveAttribute('type', 'button');
	});
});
