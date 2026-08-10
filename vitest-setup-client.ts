import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// required for svelte5 + jsdom as jsdom does not support matchMedia
const mockMatchMedia = vi.fn((query: string) => ({
	matches: query !== '(prefers-color-scheme: dark)', // Default to light theme
	media: query,
	onchange: null,
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	dispatchEvent: vi.fn(),
	addListener: vi.fn(),
	removeListener: vi.fn()
}));

Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: mockMatchMedia
});

// Ensure matchMedia is available globally as well
(globalThis as any).matchMedia = mockMatchMedia;

// Mock localStorage for jsdom environment
const localStorageMock = (() => {
	let store: Record<string, string> = {};

	return {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value.toString();
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		}),
		get length() {
			return Object.keys(store).length;
		},
		key: vi.fn((index: number) => Object.keys(store)[index] || null)
	};
})();

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock
});

// jsdom 30 still ships no HTMLDialogElement methods, so ModalShell's showModal()/
// close() calls would be no-ops and `open` would never flip. Reflect the `open`
// attribute and fire the events the component listens for, which is all our
// components observe about a dialog.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
	Object.defineProperty(HTMLDialogElement.prototype, 'open', {
		configurable: true,
		get(this: HTMLDialogElement) {
			return this.hasAttribute('open');
		},
		set(this: HTMLDialogElement, value: boolean) {
			if (value) this.setAttribute('open', '');
			else this.removeAttribute('open');
		}
	});

	HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
		this.setAttribute('open', '');
	};

	HTMLDialogElement.prototype.show = function show(this: HTMLDialogElement) {
		this.setAttribute('open', '');
	};

	HTMLDialogElement.prototype.close = function close(
		this: HTMLDialogElement,
		returnValue?: string
	) {
		if (!this.hasAttribute('open')) return;
		this.removeAttribute('open');
		if (returnValue !== undefined) this.returnValue = returnValue;
		this.dispatchEvent(new Event('close'));
	};
}
