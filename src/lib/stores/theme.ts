import { browser } from '$app/environment';
import { writable } from 'svelte/store';

type Theme = 'light' | 'dark' | 'system';

// Get stored theme or default to system
function getInitialTheme(): Theme {
	if (!browser) return 'system';

	const stored = localStorage.getItem('theme') as Theme | null;
	if (stored && ['light', 'dark', 'system'].includes(stored)) {
		return stored;
	}

	return 'system';
}

// Create theme store
export const theme = writable<Theme>(getInitialTheme());

// Get system preference
function getSystemTheme(): 'light' | 'dark' {
	if (!browser) return 'light';

	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Apply theme to document using DaisyUI's data-theme attribute
function applyTheme(themeValue: Theme): void {
	if (!browser) return;

	const root = document.documentElement;

	// Determine actual theme to apply
	let actualTheme: 'light' | 'dark';
	if (themeValue === 'system') {
		actualTheme = getSystemTheme();
	} else {
		actualTheme = themeValue;
	}

	// Single source of truth: the daisyUI theme name on <html>.
	// The inline script in app.html sets the same attribute before the first
	// paint — keep the two in sync.
	root.setAttribute('data-theme', actualTheme === 'dark' ? 'rwr-dark' : 'rwr-light');

	// Store preference
	if (themeValue !== 'system') {
		localStorage.setItem('theme', themeValue);
	} else {
		localStorage.removeItem('theme');
	}
}

// Subscribe to theme changes and apply them
if (browser) {
	// Apply initial theme
	applyTheme(getInitialTheme());

	// Listen for system theme changes
	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	mediaQuery.addEventListener('change', () => {
		theme.subscribe((currentTheme) => {
			if (currentTheme === 'system') {
				applyTheme('system');
			}
		})();
	});

	// Subscribe to theme store changes
	theme.subscribe(applyTheme);
}

// Helper function to get current theme (resolved)
export function getCurrentTheme(): 'light' | 'dark' {
	if (!browser) return 'light';

	let current: Theme | undefined;
	const unsubscribe = theme.subscribe((value) => {
		current = value;
	});
	unsubscribe();

	if (current === 'system' || current === undefined) {
		return getSystemTheme();
	}
	return current;
}
