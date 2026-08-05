import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';

vi.mock('$lib/paraglide/runtime', () => ({
	setLocale: vi.fn(),
	getLocale: vi.fn(() => 'en-us'),
	locales: ['en-us', 'zh-cn']
}));

vi.mock('$lib/utils/analytics', () => ({
	default: {
		trackLanguageChange: vi.fn()
	}
}));

describe('LanguageSwitcher', () => {
	let mockSetLocale: any;
	let mockGetLocale: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		const runtime = await import('$lib/paraglide/runtime');
		mockSetLocale = runtime.setLocale;
		mockGetLocale = runtime.getLocale;
		vi.mocked(mockGetLocale).mockReturnValue('en-us');
	});

	test('should render language button with current locale', () => {
		render(LanguageSwitcher);
		expect(screen.getByText('EN')).toBeInTheDocument();
	});

	test('should display all available locales in dropdown', () => {
		render(LanguageSwitcher);
		expect(screen.getByText('English')).toBeInTheDocument();
		expect(screen.getByText('中文')).toBeInTheDocument();
	});

	test('should mark current locale as active', () => {
		const { container } = render(LanguageSwitcher);
		const activeItem = container.querySelector('.active');
		expect(activeItem).toBeInTheDocument();
		expect(activeItem?.textContent).toContain('English');
	});

	test('should display checkmark for current locale', () => {
		render(LanguageSwitcher);
		const englishOption = screen.getByText('English').closest('div');
		expect(englishOption?.textContent).toContain('✓');
	});

	test('should switch to Chinese locale', async () => {
		const user = userEvent.setup();
		render(LanguageSwitcher);

		const chineseOption = screen.getByText('中文');
		await user.click(chineseOption);

		expect(vi.mocked(mockSetLocale)).toHaveBeenCalledWith('zh-cn');
	});

	test('should switch to English locale', async () => {
		const user = userEvent.setup();
		const runtime = await import('$lib/paraglide/runtime');
		mockGetLocale = runtime.getLocale;
		vi.mocked(mockGetLocale).mockReturnValue('zh-cn');
		render(LanguageSwitcher);

		const englishOption = screen.getByText('English');
		await user.click(englishOption);

		expect(vi.mocked(mockSetLocale)).toHaveBeenCalledWith('en-us');
	});

	test('should track language change in analytics', async () => {
		const user = userEvent.setup();
		const { trackLanguageChange } = (await import('$lib/utils/analytics')).default;

		render(LanguageSwitcher);
		const chineseOption = screen.getByText('中文');
		await user.click(chineseOption);

		expect(trackLanguageChange).toHaveBeenCalledWith('zh-cn');
	});

	test('should handle keyboard Enter key for language change', async () => {
		const user = userEvent.setup();
		render(LanguageSwitcher);

		const chineseOption = screen.getByText('中文').closest('div');
		if (chineseOption) {
			chineseOption.focus();
			await user.keyboard('{Enter}');
			expect(vi.mocked(mockSetLocale)).toHaveBeenCalledWith('zh-cn');
		}
	});

	test('should display CN for Chinese locale', async () => {
		const runtime = await import('$lib/paraglide/runtime');
		mockGetLocale = runtime.getLocale;
		vi.mocked(mockGetLocale).mockReturnValue('zh-cn');
		render(LanguageSwitcher);
		expect(screen.getByText('CN')).toBeInTheDocument();
	});

	test('should have proper ARIA labels', () => {
		render(LanguageSwitcher);
		const englishOption = screen.getByLabelText('Switch to English');
		const chineseOption = screen.getByLabelText('Switch to 中文');

		expect(englishOption).toBeInTheDocument();
		expect(chineseOption).toBeInTheDocument();
	});

	test('should display dropdown with correct styling classes', () => {
		const { container } = render(LanguageSwitcher);
		const dropdown = container.querySelector('.dropdown');
		expect(dropdown).toBeInTheDocument();
		expect(dropdown?.classList.contains('dropdown-bottom')).toBe(true);
		expect(dropdown?.classList.contains('dropdown-end')).toBe(true);
	});
});
