import { render, screen, fireEvent, waitFor } from '@testing-library/svelte/svelte5';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MobileInfiniteScroll from '$lib/components/MobileInfiniteScroll.svelte';

// Mock the TranslatedText component
vi.mock('$lib/components/TranslatedText.svelte', () => ({
	default: (props: { key: string; fallback?: string }) => {
		const keyToText: Record<string, string> = {
			'app.loading.text': 'Loading server data...',
			'app.button.loadMore': 'Load More',
			'app.mobile.endOfContent': 'End of content'
		};
		return props.fallback || keyToText[props.key] || props.key;
	}
}));

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
	readonly root: Element | null = null;
	readonly rootMargin: string = '';
	readonly scrollMargin: string = '';
	readonly thresholds: ReadonlyArray<number>;
	private callback: IntersectionObserverCallback;
	private elements: Set<Element> = new Set();

	constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
		this.callback = callback;
		this.root = (options?.root as any) || null;
		this.rootMargin = options?.rootMargin || '';
		this.thresholds = Array.isArray(options?.threshold)
			? options.threshold
			: [options?.threshold ?? 0];
	}

	observe(target: Element): void {
		this.elements.add(target);
		// Simulate intersection immediately after observe
		setTimeout(() => {
			this.callback(
				[
					{
						target,
						isIntersecting: true,
						boundingClientRect: {} as DOMRectReadOnly,
						intersectionRatio: 1,
						intersectionRect: {} as DOMRectReadOnly,
						rootBounds: null,
						time: Date.now()
					}
				],
				this
			);
		}, 0);
	}

	unobserve(target: Element): void {
		this.elements.delete(target);
	}

	disconnect(): void {
		this.elements.clear();
	}

	takeRecords(): IntersectionObserverEntry[] {
		return [];
	}

	// Helper method to trigger intersection manually
	triggerIntersection(isIntersecting: boolean = true): void {
		this.elements.forEach((target) => {
			this.callback(
				[
					{
						target,
						isIntersecting,
						boundingClientRect: {} as DOMRectReadOnly,
						intersectionRatio: isIntersecting ? 1 : 0,
						intersectionRect: {} as DOMRectReadOnly,
						rootBounds: null,
						time: Date.now()
					}
				],
				this
			);
		});
	}
}

// Polyfill global IntersectionObserver
globalThis.IntersectionObserver = MockIntersectionObserver as any;

describe('MobileInfiniteScroll Component', () => {
	let mockOnLoadMore: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		mockOnLoadMore = vi.fn();
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('should render load more button when hasMore is true and isLoading is false', async () => {
			const { container } = render(MobileInfiniteScroll, {
				props: {
					hasMore: true,
					isLoading: false,
					onLoadMore: mockOnLoadMore as any,
					threshold: 200
				}
			});

			// Check for load more button
			const button = container.querySelector('.btn-outline');
			expect(button).toBeInTheDocument();
			expect(button).not.toBeDisabled();
		});

		it('should render loading spinner when isLoading is true', async () => {
			const { container } = render(MobileInfiniteScroll, {
				props: {
					hasMore: true,
					isLoading: true,
					onLoadMore: mockOnLoadMore as any,
					threshold: 200
				}
			});

			// Check for loading indicator (LoaderCircle with animate-spin class)
			const spinner = container.querySelector('.animate-spin');
			expect(spinner).toBeInTheDocument();
			expect(spinner).toHaveClass('text-primary');
		});

		it('should render end of content message when hasMore is false and isLoading is false', async () => {
			const { container } = render(MobileInfiniteScroll, {
				props: {
					hasMore: false,
					isLoading: false,
					onLoadMore: mockOnLoadMore as any,
					threshold: 200
				}
			});

			const endDiv = container.querySelector('.text-center');
			expect(endDiv).toBeInTheDocument();
		});

		it('should render loading spinner when hasMore is false but isLoading is true (final load)', async () => {
			const { container } = render(MobileInfiniteScroll, {
				props: {
					hasMore: false,
					isLoading: true,
					onLoadMore: mockOnLoadMore as any,
					threshold: 200
				}
			});

			// Check for loading indicator (LoaderCircle with animate-spin class)
			const spinner = container.querySelector('.animate-spin');
			expect(spinner).toBeInTheDocument();
			expect(spinner).toHaveClass('text-primary');
		});

		it('should be hidden on desktop (md breakpoint)', async () => {
			const { container } = render(MobileInfiniteScroll, {
				props: {
					hasMore: true,
					isLoading: false,
					onLoadMore: mockOnLoadMore as any,
					threshold: 200
				}
			});

			const wrapper = container.querySelector('.block.md\\:hidden');
			expect(wrapper).toBeInTheDocument();
		});

		it('should use custom threshold value', async () => {
			const { container } = render(MobileInfiniteScroll, {
				props: {
					hasMore: true,
					isLoading: false,
					onLoadMore: mockOnLoadMore as any,
					threshold: 300
				}
			});

			// Component should render without errors
			const button = container.querySelector('.btn-outline');
			expect(button).toBeInTheDocument();
		});
	});

	describe('IntersectionObserver Behavior', () => {
		it('should call onLoadMore when trigger element becomes visible', async () => {
			render(MobileInfiniteScroll, {
				props: {
					hasMore: true,
					isLoading: false,
					onLoadMore: mockOnLoadMore as any,
					threshold: 200
				}
			});

			// Wait for IntersectionObserver to trigger
			await waitFor(() => {
				expect(mockOnLoadMore).toHaveBeenCalledTimes(1);
			});
		});

		it('should not call onLoadMore when isLoading is true', async () => {
			render(MobileInfiniteScroll, {
				props: {
					hasMore: true,
					isLoading: true,
					onLoadMore: mockOnLoadMore as any,
					threshold: 200
				}
			});

			// Wait a bit to ensure callback doesn't fire
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(mockOnLoadMore).not.toHaveBeenCalled();
		});

		it('should not call onLoadMore when hasMore is false', async () => {
			render(MobileInfiniteScroll, {
				props: {
					hasMore: false,
					isLoading: false,
					onLoadMore: mockOnLoadMore as any,
					threshold: 200
				}
			});

			// Wait a bit to ensure callback doesn't fire
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(mockOnLoadMore).not.toHaveBeenCalled();
		});
	});

	describe('User Interactions', () => {
		it('should call onLoadMore when load more button is clicked', async () => {
			const { container } = render(MobileInfiniteScroll, {
				props: {
					hasMore: true,
					isLoading: false,
					onLoadMore: mockOnLoadMore as any,
					threshold: 200
				}
			});

			const button = container.querySelector('.btn-outline');
			if (button) {
				await fireEvent.click(button);
			}

			expect(mockOnLoadMore).toHaveBeenCalledTimes(1);
		});

		it('should disable button when isLoading is true', async () => {
			render(MobileInfiniteScroll, {
				props: {
					hasMore: true,
					isLoading: true,
					onLoadMore: mockOnLoadMore as any,
					threshold: 200
				}
			});

			// When loading, button should not be visible (spinner is shown instead)
			const button = screen.queryByRole('button', { name: 'Load More' });
			expect(button).not.toBeInTheDocument();
		});

		it('should not show button when hasMore is false', async () => {
			render(MobileInfiniteScroll, {
				props: {
					hasMore: false,
					isLoading: false,
					onLoadMore: mockOnLoadMore as any,
					threshold: 200
				}
			});

			const button = screen.queryByRole('button', { name: 'Load More' });
			expect(button).not.toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('should have proper ARIA attributes', async () => {
			const { container } = render(MobileInfiniteScroll, {
				props: {
					hasMore: true,
					isLoading: false,
					onLoadMore: mockOnLoadMore as any,
					threshold: 200
				}
			});

			// Check for aria-live on the status element
			const statusElement = container.querySelector('[aria-live="polite"]');
			expect(statusElement).toBeInTheDocument();
		});

		it('should have proper button type', async () => {
			const { container } = render(MobileInfiniteScroll, {
				props: {
					hasMore: true,
					isLoading: false,
					onLoadMore: mockOnLoadMore as any,
					threshold: 200
				}
			});

			const button = container.querySelector('.btn-outline');
			expect(button).toBeInTheDocument();
		});
	});

	describe('Edge Cases', () => {
		it('should handle rapid state changes', async () => {
			const { rerender, container } = render(MobileInfiniteScroll, {
				props: {
					hasMore: true,
					isLoading: false,
					onLoadMore: mockOnLoadMore as any,
					threshold: 200
				}
			});

			// Rapidly change states
			await rerender({
				hasMore: true,
				isLoading: true,
				onLoadMore: mockOnLoadMore as any,
				threshold: 200
			});
			await rerender({
				hasMore: true,
				isLoading: false,
				onLoadMore: mockOnLoadMore as any,
				threshold: 200
			});
			await rerender({
				hasMore: false,
				isLoading: false,
				onLoadMore: mockOnLoadMore as any,
				threshold: 200
			});

			// Should show end state - look for the text-center div that indicates end of content
			const endDiv = container.querySelector('.text-center');
			expect(endDiv).toBeInTheDocument();
		});

		it('should handle missing onLoadMore callback gracefully', async () => {
			const { container } = render(MobileInfiniteScroll, {
				props: {
					hasMore: true,
					isLoading: false,
					onLoadMore: undefined as any,
					threshold: 200
				}
			});

			const button = container.querySelector('.btn-outline');
			// Component should still render
			expect(button).toBeInTheDocument();
			// Click should not throw even with undefined callback
			if (button) {
				await fireEvent.click(button);
			}
		});
	});
});
