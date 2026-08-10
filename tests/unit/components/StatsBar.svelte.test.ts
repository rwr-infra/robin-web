import { render, screen } from '@testing-library/svelte/svelte5';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StatsBar from '$lib/components/StatsBar.svelte';

// Mock TranslatedText component
vi.mock('$lib/components/TranslatedText.svelte', () => ({
	default: (props: { key: string; fallback?: string }) => {
		const keyToText: Record<string, string> = {
			'app.stats.filteredBy': 'Filtered by "{query}"'
		};
		return props.fallback || keyToText[props.key] || props.key;
	}
}));

// Mock messages — the count phrases mirror the real en-us wording, since the
// component now renders the whole localized phrase rather than splicing numbers in.
vi.mock('$lib/paraglide/messages.js', () => ({
	m: {
		'app.stats.filteredBy': (props: { query: string }) => `Filtered by "${props.query}"`,
		'app.stats.servers': (props: { filtered: number; total: number }) =>
			`${props.filtered} of ${props.total} servers`,
		'app.stats.players': (props: { filtered: number; total: number }) =>
			`${props.filtered} of ${props.total} players`
	}
}));

describe('StatsBar Component', () => {
	const mockServerTotalStats = { totalServers: 100, totalPlayers: 2500 };
	const mockServerFilteredStats = { totalServers: 50, totalPlayers: 1250 };
	const mockPlayerTotalStats = { totalPlayers: 10000, paginatedCount: 20 };
	const mockPlayerFilteredStats = { totalPlayers: 8000, paginatedCount: 15 };

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering for Servers View', () => {
		it('should render server statistics', async () => {
			const { container } = render(StatsBar, {
				props: {
					currentView: 'servers',
					serverTotalStats: mockServerTotalStats,
					serverFilteredStats: mockServerFilteredStats,
					playerTotalStats: mockPlayerTotalStats,
					playerFilteredStats: mockPlayerFilteredStats,
					searchQuery: ''
				}
			});

			const statsContainer = container.querySelector('.stats-container');
			expect(statsContainer).toBeInTheDocument();
		});

		it('should display servers count', async () => {
			const { container } = render(StatsBar, {
				props: {
					currentView: 'servers',
					serverTotalStats: mockServerTotalStats,
					serverFilteredStats: mockServerFilteredStats,
					playerTotalStats: mockPlayerTotalStats,
					playerFilteredStats: mockPlayerFilteredStats,
					searchQuery: ''
				}
			});

			expect(container.textContent).toContain('50');
			expect(container.textContent).toContain('100');
			expect(container.textContent).toContain('servers');
		});

		it('should display players count', async () => {
			const { container } = render(StatsBar, {
				props: {
					currentView: 'servers',
					serverTotalStats: mockServerTotalStats,
					serverFilteredStats: mockServerFilteredStats,
					playerTotalStats: mockPlayerTotalStats,
					playerFilteredStats: mockPlayerFilteredStats,
					searchQuery: ''
				}
			});

			expect(container.textContent).toContain('1250');
			expect(container.textContent).toContain('2500');
			expect(container.textContent).toContain('players');
		});

		it('should show filtered counts when search is active', async () => {
			const { container } = render(StatsBar, {
				props: {
					currentView: 'servers',
					serverTotalStats: mockServerTotalStats,
					serverFilteredStats: mockServerFilteredStats,
					playerTotalStats: mockPlayerTotalStats,
					playerFilteredStats: mockPlayerFilteredStats,
					searchQuery: 'test'
				}
			});

			// Should show filtered counts (50/100 servers, 1250/2500 players)
			const text = container.textContent;
			expect(text).toContain('50');
			expect(text).toContain('100');
		});
	});

	describe('Rendering for Players View', () => {
		it('should render player statistics', async () => {
			const { container } = render(StatsBar, {
				props: {
					currentView: 'players',
					serverTotalStats: mockServerTotalStats,
					serverFilteredStats: mockServerFilteredStats,
					playerTotalStats: mockPlayerTotalStats,
					playerFilteredStats: mockPlayerFilteredStats,
					searchQuery: ''
				}
			});

			const statsContainer = container.querySelector('.stats-container');
			expect(statsContainer).toBeInTheDocument();
		});

		it('should display paginated/total players count', async () => {
			const { container } = render(StatsBar, {
				props: {
					currentView: 'players',
					serverTotalStats: mockServerTotalStats,
					serverFilteredStats: mockServerFilteredStats,
					playerTotalStats: mockPlayerTotalStats,
					playerFilteredStats: mockPlayerFilteredStats,
					searchQuery: ''
				}
			});

			// Component uses playerFilteredStats for display (15/8000)
			expect(container.textContent).toContain('15');
			expect(container.textContent).toContain('8000');
			expect(container.textContent).toContain('players');
		});
	});

	describe('Filter Indicator', () => {
		it('should show filter indicator when servers are filtered', async () => {
			const { container } = render(StatsBar, {
				props: {
					currentView: 'servers',
					serverTotalStats: { totalServers: 100, totalPlayers: 2500 },
					serverFilteredStats: { totalServers: 50, totalPlayers: 1250 },
					playerTotalStats: mockPlayerTotalStats,
					playerFilteredStats: mockPlayerFilteredStats,
					searchQuery: 'test query'
				}
			});

			expect(container.textContent).toContain('Filtered by "test query"');
		});

		it('should show filter indicator when players are filtered', async () => {
			const { container } = render(StatsBar, {
				props: {
					currentView: 'players',
					serverTotalStats: mockServerTotalStats,
					serverFilteredStats: mockServerFilteredStats,
					playerTotalStats: { totalPlayers: 10000, paginatedCount: 100 },
					playerFilteredStats: { totalPlayers: 5000, paginatedCount: 50 },
					searchQuery: 'search'
				}
			});

			expect(container.textContent).toContain('Filtered by "search"');
		});

		it('should not show filter indicator when no search query', async () => {
			const { container } = render(StatsBar, {
				props: {
					currentView: 'servers',
					serverTotalStats: mockServerTotalStats,
					serverFilteredStats: mockServerFilteredStats,
					playerTotalStats: mockPlayerTotalStats,
					playerFilteredStats: mockPlayerFilteredStats,
					searchQuery: ''
				}
			});

			expect(container.textContent).not.toContain('Filtered by');
		});

		it('should not show filter indicator when all results match', async () => {
			const { container } = render(StatsBar, {
				props: {
					currentView: 'servers',
					serverTotalStats: mockServerTotalStats,
					serverFilteredStats: mockServerTotalStats, // Same as total
					playerTotalStats: mockPlayerTotalStats,
					playerFilteredStats: mockPlayerFilteredStats,
					searchQuery: 'test'
				}
			});

			expect(container.textContent).not.toContain('Filtered by');
		});

		it('should not show filter indicator when search query is empty', async () => {
			const { container } = render(StatsBar, {
				props: {
					currentView: 'players',
					serverTotalStats: mockServerTotalStats,
					serverFilteredStats: mockServerFilteredStats,
					playerTotalStats: mockPlayerTotalStats,
					playerFilteredStats: mockPlayerFilteredStats,
					searchQuery: ''
				}
			});

			const filterIndicator = container.querySelector('.filter-indicator');
			expect(filterIndicator).not.toBeInTheDocument();
		});

		it('should handle whitespace-only search query', async () => {
			const { container } = render(StatsBar, {
				props: {
					currentView: 'servers',
					serverTotalStats: mockServerTotalStats,
					serverFilteredStats: mockServerFilteredStats,
					playerTotalStats: mockPlayerTotalStats,
					playerFilteredStats: mockPlayerFilteredStats,
					searchQuery: '   '
				}
			});

			// Note: Component doesn't trim whitespace, so "   " is truthy and shows filter indicator
			const filterIndicator = container.querySelector('.filter-indicator');
			expect(filterIndicator).toBeInTheDocument();
		});
	});

	describe('Styling', () => {
		it('should have correct CSS classes', async () => {
			const { container } = render(StatsBar, {
				props: {
					currentView: 'servers',
					serverTotalStats: mockServerTotalStats,
					serverFilteredStats: mockServerFilteredStats,
					playerTotalStats: mockPlayerTotalStats,
					playerFilteredStats: mockPlayerFilteredStats,
					searchQuery: ''
				}
			});

			const statsContainer = container.querySelector('.stats-container');
			expect(statsContainer).toHaveClass(
				'mb-4',
				'flex',
				'items-center',
				'justify-between',
				'text-sm'
			);
		});

		it('should render stats numbers with correct class', async () => {
			const { container } = render(StatsBar, {
				props: {
					currentView: 'servers',
					serverTotalStats: mockServerTotalStats,
					serverFilteredStats: mockServerFilteredStats,
					playerTotalStats: mockPlayerTotalStats,
					playerFilteredStats: mockPlayerFilteredStats,
					searchQuery: ''
				}
			});

			const statsNumbers = container.querySelectorAll('.stats-number');
			expect(statsNumbers.length).toBeGreaterThan(0);
		});

		it('should have filter indicator class when filter is active', async () => {
			const { container } = render(StatsBar, {
				props: {
					currentView: 'servers',
					serverTotalStats: mockServerTotalStats,
					serverFilteredStats: { totalServers: 50, totalPlayers: 1250 },
					playerTotalStats: mockPlayerTotalStats,
					playerFilteredStats: mockPlayerFilteredStats,
					searchQuery: 'test'
				}
			});

			const filterIndicator = container.querySelector('.filter-indicator');
			expect(filterIndicator).toBeInTheDocument();
			expect(filterIndicator).toHaveClass('badge', 'badge-soft', 'badge-warning', 'italic');
		});
	});

	describe('Edge Cases', () => {
		it('should handle zero counts', async () => {
			const { container } = render(StatsBar, {
				props: {
					currentView: 'servers',
					serverTotalStats: { totalServers: 0, totalPlayers: 0 },
					serverFilteredStats: { totalServers: 0, totalPlayers: 0 },
					playerTotalStats: { totalPlayers: 0, paginatedCount: 0 },
					playerFilteredStats: { totalPlayers: 0, paginatedCount: 0 },
					searchQuery: ''
				}
			});

			expect(container.textContent).toContain('0');
			expect(container.textContent).toContain('servers');
		});

		it('should handle very large numbers', async () => {
			const { container } = render(StatsBar, {
				props: {
					currentView: 'servers',
					serverTotalStats: { totalServers: 99999, totalPlayers: 999999 },
					serverFilteredStats: { totalServers: 50000, totalPlayers: 500000 },
					playerTotalStats: { totalPlayers: 1000000, paginatedCount: 100 },
					playerFilteredStats: { totalPlayers: 500000, paginatedCount: 50 },
					searchQuery: ''
				}
			});

			expect(container.textContent).toContain('50000');
			expect(container.textContent).toContain('99999');
		});

		it('should handle single server result', async () => {
			const { container } = render(StatsBar, {
				props: {
					currentView: 'servers',
					serverTotalStats: { totalServers: 1, totalPlayers: 50 },
					serverFilteredStats: { totalServers: 1, totalPlayers: 50 },
					playerTotalStats: mockPlayerTotalStats,
					playerFilteredStats: mockPlayerFilteredStats,
					searchQuery: ''
				}
			});

			expect(container.textContent).toContain('1');
		});

		it('should handle special characters in search query', async () => {
			const { container } = render(StatsBar, {
				props: {
					currentView: 'servers',
					serverTotalStats: mockServerTotalStats,
					serverFilteredStats: mockServerFilteredStats,
					playerTotalStats: mockPlayerTotalStats,
					playerFilteredStats: mockPlayerFilteredStats,
					searchQuery: 'test!@#$%'
				}
			});

			expect(container.textContent).toContain('Filtered by');
		});

		it('should handle unicode characters in search query', async () => {
			const { container } = render(StatsBar, {
				props: {
					currentView: 'servers',
					serverTotalStats: mockServerTotalStats,
					serverFilteredStats: mockServerFilteredStats,
					playerTotalStats: mockPlayerTotalStats,
					playerFilteredStats: mockPlayerFilteredStats,
					searchQuery: '搜索'
				}
			});

			expect(container.textContent).toContain('Filtered by "搜索"');
		});
	});

	describe('Layout', () => {
		it('should have proper flex layout', async () => {
			const { container } = render(StatsBar, {
				props: {
					currentView: 'servers',
					serverTotalStats: mockServerTotalStats,
					serverFilteredStats: mockServerFilteredStats,
					playerTotalStats: mockPlayerTotalStats,
					playerFilteredStats: mockPlayerFilteredStats,
					searchQuery: ''
				}
			});

			const statsContainer = container.querySelector('.stats-container');
			expect(statsContainer).toHaveClass('flex', 'items-center', 'justify-between');
		});

		it('should have gap between stats elements', async () => {
			const { container } = render(StatsBar, {
				props: {
					currentView: 'servers',
					serverTotalStats: mockServerTotalStats,
					serverFilteredStats: mockServerFilteredStats,
					playerTotalStats: mockPlayerTotalStats,
					playerFilteredStats: mockPlayerFilteredStats,
					searchQuery: ''
				}
			});

			const flexContainer = container.querySelector('.flex.gap-4');
			expect(flexContainer).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('should have semantic HTML structure', async () => {
			const { container } = render(StatsBar, {
				props: {
					currentView: 'servers',
					serverTotalStats: mockServerTotalStats,
					serverFilteredStats: mockServerFilteredStats,
					playerTotalStats: mockPlayerTotalStats,
					playerFilteredStats: mockPlayerFilteredStats,
					searchQuery: ''
				}
			});

			// Check for proper text content structure
			expect(container.textContent).toBeTruthy();
		});
	});
});
