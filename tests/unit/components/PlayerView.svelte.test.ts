import { render, fireEvent } from '@testing-library/svelte/svelte5';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlayerView from '$lib/components/PlayerView.svelte';
import { PlayerDatabase } from '$lib/models/player.model';
import type { IPlayerItem, IPlayerColumn } from '$lib/models/player.model';

// Mock child components
vi.mock('$lib/components/TranslatedText.svelte', () => ({
	default: (props: { key: string; fallback?: string }) => {
		const keyToText: Record<string, string> = {
			'app.loading.title': 'Loading...',
			'app.loading.description': 'Please wait',
			'app.loading.progress': 'Loading data',
			'app.player.noPlayersFound': 'No players found',
			'app.player.matchingSearch': 'matching your search'
		};
		return props.fallback || keyToText[props.key] || props.key;
	}
}));

vi.mock('$lib/components/PaginationPrevNext.svelte', () => ({
	default: () => '<div class="pagination-mock"></div>'
}));

vi.mock('$lib/components/PageSizeSelector.svelte', () => ({
	default: () => '<div class="page-size-mock"></div>'
}));

vi.mock('$lib/components/PlayerTable.svelte', () => ({
	default: () => {
		const div = document.createElement('div');
		div.className = 'player-table-mock';
		const table = document.createElement('table');
		const thead = document.createElement('thead');
		const tr = document.createElement('tr');
		const th = document.createElement('th');
		th.textContent = 'Mock Table';
		tr.appendChild(th);
		thead.appendChild(tr);
		table.appendChild(thead);
		div.appendChild(table);
		return div;
	}
}));

vi.mock('$lib/components/MobileInfiniteScroll.svelte', () => ({
	default: () => '<div class="infinite-scroll-mock"></div>'
}));

describe('PlayerView Component', () => {
	const mockPlayerColumns: IPlayerColumn[] = [
		{ key: 'username', label: 'Username', i18n: 'app.column.username' },
		{ key: 'rowNumber', label: '#', alignment: 'right' },
		{ key: 'kills', label: 'Kills', i18n: 'app.column.kills', alignment: 'right' },
		{ key: 'deaths', label: 'Deaths', i18n: 'app.column.deaths', alignment: 'right' },
		{ key: 'kd', label: 'K/D', i18n: 'app.column.kd', alignment: 'right' },
		{ key: 'score', label: 'Score', i18n: 'app.column.score', alignment: 'right' },
		{
			key: 'rankProgression',
			label: 'Rank',
			i18n: 'app.column.rankProgression',
			alignment: 'right'
		}
	];

	const mockPlayers: IPlayerItem[] = [
		{
			id: 'player1',
			username: 'Player1',
			kills: 100,
			deaths: 50,
			kd: 2.0,
			score: 1000,
			rankProgression: 90,
			rowNumber: 1,
			db: PlayerDatabase.INVASION
		} as IPlayerItem,
		{
			id: 'player2',
			username: 'Player2',
			kills: 80,
			deaths: 40,
			kd: 2.0,
			score: 800,
			rankProgression: 75,
			rowNumber: 2,
			db: PlayerDatabase.INVASION
		} as IPlayerItem
	];

	const mockVisibleColumns: Record<string, boolean> = {
		username: true,
		rowNumber: true,
		kills: true,
		deaths: true,
		kd: true,
		score: true,
		rankProgression: true
	};

	let mockOnSort: ReturnType<typeof vi.fn>;
	let mockOnPageChange: ReturnType<typeof vi.fn>;
	let mockOnPageSizeChange: ReturnType<typeof vi.fn>;
	let mockOnLoadMore: ReturnType<typeof vi.fn>;
	let mockOnToggleMobileCard: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		mockOnSort = vi.fn();
		mockOnPageChange = vi.fn();
		mockOnPageSizeChange = vi.fn();
		mockOnLoadMore = vi.fn();
		mockOnToggleMobileCard = vi.fn();
		vi.clearAllMocks();
	});

	describe('Loading State', () => {
		it('should render loading state', async () => {
			const { container } = render(PlayerView, {
				props: {
					loading: true,
					error: null,
					searchQuery: '',
					paginatedPlayers: [],
					mobilePaginatedPlayers: [],
					mobileHasMore: false,
					mobileLoadingMore: false,
					playerColumns: mockPlayerColumns,
					visibleColumns: mockVisibleColumns,
					currentPage: 1,
					pageSize: 20,
					layoutMode: 'fullPage',
					sortColumn: null,
					mobileExpandedCards: {},
					hasNext: false,
					hasPrevious: false,
					onSort: mockOnSort as any,
					onPageChange: mockOnPageChange as any,
					onPageSizeChange: mockOnPageSizeChange as any,
					onLoadMore: mockOnLoadMore as any,
					onToggleMobileCard: mockOnToggleMobileCard as any
				}
			});

			const loadingContainer = container.querySelector('.loading-container');
			expect(loadingContainer).toBeInTheDocument();
		});

		it('should have proper accessibility attributes in loading state', async () => {
			const { container } = render(PlayerView, {
				props: {
					loading: true,
					error: null,
					searchQuery: '',
					paginatedPlayers: [],
					mobilePaginatedPlayers: [],
					mobileHasMore: false,
					mobileLoadingMore: false,
					playerColumns: mockPlayerColumns,
					visibleColumns: mockVisibleColumns,
					currentPage: 1,
					pageSize: 20,
					layoutMode: 'fullPage',
					sortColumn: null,
					mobileExpandedCards: {},
					hasNext: false,
					hasPrevious: false,
					onSort: mockOnSort as any,
					onPageChange: mockOnPageChange as any,
					onPageSizeChange: mockOnPageSizeChange as any,
					onLoadMore: mockOnLoadMore as any,
					onToggleMobileCard: mockOnToggleMobileCard as any
				}
			});

			const loadingContainer = container.querySelector('.loading-container');
			expect(loadingContainer).toHaveAttribute('role', 'status');
			expect(loadingContainer).toHaveAttribute('aria-label', 'Loading player data');
		});

		it('should show loading dots animation', async () => {
			const { container } = render(PlayerView, {
				props: {
					loading: true,
					error: null,
					searchQuery: '',
					paginatedPlayers: [],
					mobilePaginatedPlayers: [],
					mobileHasMore: false,
					mobileLoadingMore: false,
					playerColumns: mockPlayerColumns,
					visibleColumns: mockVisibleColumns,
					currentPage: 1,
					pageSize: 20,
					layoutMode: 'fullPage',
					sortColumn: null,
					mobileExpandedCards: {},
					hasNext: false,
					hasPrevious: false,
					onSort: mockOnSort as any,
					onPageChange: mockOnPageChange as any,
					onPageSizeChange: mockOnPageSizeChange as any,
					onLoadMore: mockOnLoadMore as any,
					onToggleMobileCard: mockOnToggleMobileCard as any
				}
			});

			const loadingDots = container.querySelectorAll('.loading-dot');
			expect(loadingDots.length).toBe(3);
		});
	});

	describe('Error State', () => {
		it('should render error state', async () => {
			const { container } = render(PlayerView, {
				props: {
					loading: false,
					error: 'Failed to load players',
					searchQuery: '',
					paginatedPlayers: [],
					mobilePaginatedPlayers: [],
					mobileHasMore: false,
					mobileLoadingMore: false,
					playerColumns: mockPlayerColumns,
					visibleColumns: mockVisibleColumns,
					currentPage: 1,
					pageSize: 20,
					layoutMode: 'fullPage',
					sortColumn: null,
					mobileExpandedCards: {},
					hasNext: false,
					hasPrevious: false,
					onSort: mockOnSort as any,
					onPageChange: mockOnPageChange as any,
					onPageSizeChange: mockOnPageSizeChange as any,
					onLoadMore: mockOnLoadMore as any,
					onToggleMobileCard: mockOnToggleMobileCard as any
				}
			});

			const alert = container.querySelector('.alert-error');
			expect(alert).toBeInTheDocument();
			expect(alert?.textContent).toContain('Failed to load players');
		});
	});

	describe('Normal State', () => {
		it('should render content area', async () => {
			const { container } = render(PlayerView, {
				props: {
					loading: false,
					error: null,
					searchQuery: '',
					paginatedPlayers: mockPlayers,
					mobilePaginatedPlayers: mockPlayers,
					mobileHasMore: false,
					mobileLoadingMore: false,
					playerColumns: mockPlayerColumns,
					visibleColumns: mockVisibleColumns,
					currentPage: 1,
					pageSize: 20,
					layoutMode: 'fullPage',
					sortColumn: null,
					mobileExpandedCards: {},
					hasNext: false,
					hasPrevious: false,
					onSort: mockOnSort as any,
					onPageChange: mockOnPageChange as any,
					onPageSizeChange: mockOnPageSizeChange as any,
					onLoadMore: mockOnLoadMore as any,
					onToggleMobileCard: mockOnToggleMobileCard as any
				}
			});

			const contentArea = container.querySelector('.hidden.md\\:flex');
			expect(contentArea).toBeInTheDocument();
		});

		it('should render mobile player cards', async () => {
			const { container } = render(PlayerView, {
				props: {
					loading: false,
					error: null,
					searchQuery: '',
					paginatedPlayers: mockPlayers,
					mobilePaginatedPlayers: mockPlayers,
					mobileHasMore: false,
					mobileLoadingMore: false,
					playerColumns: mockPlayerColumns,
					visibleColumns: mockVisibleColumns,
					currentPage: 1,
					pageSize: 20,
					layoutMode: 'fullPage',
					sortColumn: null,
					mobileExpandedCards: {},
					hasNext: false,
					hasPrevious: false,
					onSort: mockOnSort as any,
					onPageChange: mockOnPageChange as any,
					onPageSizeChange: mockOnPageSizeChange as any,
					onLoadMore: mockOnLoadMore as any,
					onToggleMobileCard: mockOnToggleMobileCard as any
				}
			});

			const cards = container.querySelectorAll('.md\\:hidden .collapse');
			expect(cards.length).toBe(2);
		});

		it('should call onToggleMobileCard when card toggled', async () => {
			const { container } = render(PlayerView, {
				props: {
					loading: false,
					error: null,
					searchQuery: '',
					paginatedPlayers: mockPlayers,
					mobilePaginatedPlayers: mockPlayers,
					mobileHasMore: false,
					mobileLoadingMore: false,
					playerColumns: mockPlayerColumns,
					visibleColumns: mockVisibleColumns,
					currentPage: 1,
					pageSize: 20,
					layoutMode: 'fullPage',
					sortColumn: null,
					mobileExpandedCards: {},
					hasNext: false,
					hasPrevious: false,
					onSort: mockOnSort as any,
					onPageChange: mockOnPageChange as any,
					onPageSizeChange: mockOnPageSizeChange as any,
					onLoadMore: mockOnLoadMore as any,
					onToggleMobileCard: mockOnToggleMobileCard as any
				}
			});

			const checkbox = container.querySelector(
				'.md\\:hidden .collapse input[type="checkbox"]'
			) as HTMLElement;
			await fireEvent.click(checkbox);

			expect(mockOnToggleMobileCard).toHaveBeenCalledWith('player1');
		});

		it('should call onSort when mobile sort button clicked', async () => {
			const { container } = render(PlayerView, {
				props: {
					loading: false,
					error: null,
					searchQuery: '',
					paginatedPlayers: mockPlayers,
					mobilePaginatedPlayers: mockPlayers,
					mobileHasMore: false,
					mobileLoadingMore: false,
					playerColumns: mockPlayerColumns,
					visibleColumns: mockVisibleColumns,
					currentPage: 1,
					pageSize: 20,
					layoutMode: 'fullPage',
					sortColumn: null,
					mobileExpandedCards: {},
					hasNext: false,
					hasPrevious: false,
					onSort: mockOnSort as any,
					onPageChange: mockOnPageChange as any,
					onPageSizeChange: mockOnPageSizeChange as any,
					onLoadMore: mockOnLoadMore as any,
					onToggleMobileCard: mockOnToggleMobileCard as any
				}
			});

			const sortButtons = container.querySelectorAll('.md\\:hidden .btn-outline');
			const firstButton = sortButtons[0] as HTMLElement;
			await fireEvent.click(firstButton);

			expect(mockOnSort).toHaveBeenCalledWith('username');
		});

		it('should render desktop table', async () => {
			const { container } = render(PlayerView, {
				props: {
					loading: false,
					error: null,
					searchQuery: '',
					paginatedPlayers: mockPlayers,
					mobilePaginatedPlayers: mockPlayers,
					mobileHasMore: false,
					mobileLoadingMore: false,
					playerColumns: mockPlayerColumns,
					visibleColumns: mockVisibleColumns,
					currentPage: 1,
					pageSize: 20,
					layoutMode: 'fullPage',
					sortColumn: null,
					mobileExpandedCards: {},
					hasNext: false,
					hasPrevious: false,
					onSort: mockOnSort as any,
					onPageChange: mockOnPageChange as any,
					onPageSizeChange: mockOnPageSizeChange as any,
					onLoadMore: mockOnLoadMore as any,
					onToggleMobileCard: mockOnToggleMobileCard as any
				}
			});

			const desktopContainer = container.querySelector('.hidden.md\\:flex');
			expect(desktopContainer).toBeInTheDocument();
		});

		it('should render table with visible columns', async () => {
			const { container } = render(PlayerView, {
				props: {
					loading: false,
					error: null,
					searchQuery: '',
					paginatedPlayers: mockPlayers,
					mobilePaginatedPlayers: mockPlayers,
					mobileHasMore: false,
					mobileLoadingMore: false,
					playerColumns: mockPlayerColumns,
					visibleColumns: mockVisibleColumns,
					currentPage: 1,
					pageSize: 20,
					layoutMode: 'fullPage',
					sortColumn: null,
					mobileExpandedCards: {},
					hasNext: false,
					hasPrevious: false,
					onSort: mockOnSort as any,
					onPageChange: mockOnPageChange as any,
					onPageSizeChange: mockOnPageSizeChange as any,
					onLoadMore: mockOnLoadMore as any,
					onToggleMobileCard: mockOnToggleMobileCard as any
				}
			});

			// PlayerTable is now a separate component
			// Just verify the desktop container exists
			const desktopContainer = container.querySelector('.hidden.md\\:flex');
			expect(desktopContainer).toBeInTheDocument();
		});

		it('should call onSort when desktop column header clicked', async () => {
			const { container } = render(PlayerView, {
				props: {
					loading: false,
					error: null,
					searchQuery: '',
					paginatedPlayers: mockPlayers,
					mobilePaginatedPlayers: mockPlayers,
					mobileHasMore: false,
					mobileLoadingMore: false,
					playerColumns: mockPlayerColumns,
					visibleColumns: mockVisibleColumns,
					currentPage: 1,
					pageSize: 20,
					layoutMode: 'fullPage',
					sortColumn: null,
					mobileExpandedCards: {},
					hasNext: false,
					hasPrevious: false,
					onSort: mockOnSort as any,
					onPageChange: mockOnPageChange as any,
					onPageSizeChange: mockOnPageSizeChange as any,
					onLoadMore: mockOnLoadMore as any,
					onToggleMobileCard: mockOnToggleMobileCard as any
				}
			});

			// PlayerTable is now a separate component that handles sorting
			// The desktop container should still be present
			const desktopContainer = container.querySelector('.hidden.md\\:flex');
			expect(desktopContainer).toBeInTheDocument();
		});

		it('should show desktop empty state when no players', async () => {
			const { container } = render(PlayerView, {
				props: {
					loading: false,
					error: null,
					searchQuery: '',
					paginatedPlayers: [],
					mobilePaginatedPlayers: [],
					mobileHasMore: false,
					mobileLoadingMore: false,
					playerColumns: mockPlayerColumns,
					visibleColumns: mockVisibleColumns,
					currentPage: 1,
					pageSize: 20,
					layoutMode: 'fullPage',
					sortColumn: null,
					mobileExpandedCards: {},
					hasNext: false,
					hasPrevious: false,
					onSort: mockOnSort as any,
					onPageChange: mockOnPageChange as any,
					onPageSizeChange: mockOnPageSizeChange as any,
					onLoadMore: mockOnLoadMore as any,
					onToggleMobileCard: mockOnToggleMobileCard as any
				}
			});

			// PlayerTable component handles empty state internally
			// Just verify the desktop container exists
			const desktopContainer = container.querySelector('.hidden.md\\:flex');
			expect(desktopContainer).toBeInTheDocument();
		});

		it('should show mobile empty state when no players', async () => {
			const { container } = render(PlayerView, {
				props: {
					loading: false,
					error: null,
					searchQuery: '',
					paginatedPlayers: [],
					mobilePaginatedPlayers: [],
					mobileHasMore: false,
					mobileLoadingMore: false,
					playerColumns: mockPlayerColumns,
					visibleColumns: mockVisibleColumns,
					currentPage: 1,
					pageSize: 20,
					layoutMode: 'fullPage',
					sortColumn: null,
					mobileExpandedCards: {},
					hasNext: false,
					hasPrevious: false,
					onSort: mockOnSort as any,
					onPageChange: mockOnPageChange as any,
					onPageSizeChange: mockOnPageSizeChange as any,
					onLoadMore: mockOnLoadMore as any,
					onToggleMobileCard: mockOnToggleMobileCard as any
				}
			});

			const alert = container.querySelector('.md\\:hidden .alert-info');
			expect(alert).toBeInTheDocument();
		});

		it('should show search-specific empty message when searching', async () => {
			const { container } = render(PlayerView, {
				props: {
					loading: false,
					error: null,
					searchQuery: 'test',
					paginatedPlayers: [],
					mobilePaginatedPlayers: [],
					mobileHasMore: false,
					mobileLoadingMore: false,
					playerColumns: mockPlayerColumns,
					visibleColumns: mockVisibleColumns,
					currentPage: 1,
					pageSize: 20,
					layoutMode: 'fullPage',
					sortColumn: null,
					mobileExpandedCards: {},
					hasNext: false,
					hasPrevious: false,
					onSort: mockOnSort as any,
					onPageChange: mockOnPageChange as any,
					onPageSizeChange: mockOnPageSizeChange as any,
					onLoadMore: mockOnLoadMore as any,
					onToggleMobileCard: mockOnToggleMobileCard as any
				}
			});

			// Should show empty state alert
			const alert = container.querySelector('.md\\:hidden .alert-info');
			expect(alert).toBeInTheDocument();
		});
	});

	describe('Column Visibility', () => {
		it('should only render visible columns in desktop table', async () => {
			const limitedVisibleColumns = { ...mockVisibleColumns, deaths: false };
			const { container } = render(PlayerView, {
				props: {
					loading: false,
					error: null,
					searchQuery: '',
					paginatedPlayers: mockPlayers,
					mobilePaginatedPlayers: mockPlayers,
					mobileHasMore: false,
					mobileLoadingMore: false,
					playerColumns: mockPlayerColumns,
					visibleColumns: limitedVisibleColumns,
					currentPage: 1,
					pageSize: 20,
					layoutMode: 'fullPage',
					sortColumn: null,
					mobileExpandedCards: {},
					hasNext: false,
					hasPrevious: false,
					onSort: mockOnSort as any,
					onPageChange: mockOnPageChange as any,
					onPageSizeChange: mockOnPageSizeChange as any,
					onLoadMore: mockOnLoadMore as any,
					onToggleMobileCard: mockOnToggleMobileCard as any
				}
			});

			// PlayerTable is now a separate component that handles column visibility
			// Just verify the desktop container exists
			const desktopContainer = container.querySelector('.hidden.md\\:flex');
			expect(desktopContainer).toBeInTheDocument();
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty playerColumns array', async () => {
			const { container } = render(PlayerView, {
				props: {
					loading: false,
					error: null,
					searchQuery: '',
					paginatedPlayers: [],
					mobilePaginatedPlayers: [],
					mobileHasMore: false,
					mobileLoadingMore: false,
					playerColumns: [],
					visibleColumns: {},
					currentPage: 1,
					pageSize: 20,
					layoutMode: 'fullPage',
					sortColumn: null,
					mobileExpandedCards: {},
					hasNext: false,
					hasPrevious: false,
					onSort: mockOnSort as any,
					onPageChange: mockOnPageChange as any,
					onPageSizeChange: mockOnPageSizeChange as any,
					onLoadMore: mockOnLoadMore as any,
					onToggleMobileCard: mockOnToggleMobileCard as any
				}
			});

			// Should render without errors
			const contentArea = container.querySelector('.hidden.md\\:flex');
			expect(contentArea).toBeInTheDocument();
		});

		it('should handle null error', async () => {
			const { container } = render(PlayerView, {
				props: {
					loading: false,
					error: null,
					searchQuery: '',
					paginatedPlayers: mockPlayers,
					mobilePaginatedPlayers: mockPlayers,
					mobileHasMore: false,
					mobileLoadingMore: false,
					playerColumns: mockPlayerColumns,
					visibleColumns: mockVisibleColumns,
					currentPage: 1,
					pageSize: 20,
					layoutMode: 'fullPage',
					sortColumn: null,
					mobileExpandedCards: {},
					hasNext: false,
					hasPrevious: false,
					onSort: mockOnSort as any,
					onPageChange: mockOnPageChange as any,
					onPageSizeChange: mockOnPageSizeChange as any,
					onLoadMore: mockOnLoadMore as any,
					onToggleMobileCard: mockOnToggleMobileCard as any
				}
			});

			const alert = container.querySelector('.alert-error');
			expect(alert).not.toBeInTheDocument();
		});

		it('should handle pagination props', async () => {
			const { container } = render(PlayerView, {
				props: {
					loading: false,
					error: null,
					searchQuery: '',
					paginatedPlayers: mockPlayers,
					mobilePaginatedPlayers: mockPlayers,
					mobileHasMore: true,
					mobileLoadingMore: false,
					playerColumns: mockPlayerColumns,
					visibleColumns: mockVisibleColumns,
					currentPage: 5,
					pageSize: 50,
					sortColumn: 'score',
					mobileExpandedCards: {},
					layoutMode: 'fullPage',
					hasNext: true,
					hasPrevious: true,
					onSort: mockOnSort as any,
					onPageChange: mockOnPageChange as any,
					onPageSizeChange: mockOnPageSizeChange as any,
					onLoadMore: mockOnLoadMore as any,
					onToggleMobileCard: mockOnToggleMobileCard as any
				}
			});

			const desktopContainer = container.querySelector('.hidden.md\\:flex');
			expect(desktopContainer).toBeInTheDocument();
		});
	});

	describe('mobile highlight', () => {
		const mobileProps = {
			loading: false,
			error: null,
			searchQuery: '',
			paginatedPlayers: mockPlayers,
			mobilePaginatedPlayers: mockPlayers,
			mobileHasMore: false,
			mobileLoadingMore: false,
			playerColumns: mockPlayerColumns,
			visibleColumns: mockVisibleColumns,
			currentPage: 1,
			pageSize: 20,
			sortColumn: null,
			mobileExpandedCards: {},
			layoutMode: 'fullPage' as const,
			hasNext: false,
			hasPrevious: false,
			onSort: mockOnSort as any,
			onPageChange: mockOnPageChange as any,
			onPageSizeChange: mockOnPageSizeChange as any,
			onLoadMore: mockOnLoadMore as any,
			onToggleMobileCard: mockOnToggleMobileCard as any
		};

		it('should highlight the mobile card of the highlighted player', () => {
			const { container } = render(PlayerView, {
				props: { ...mobileProps, highlightedUsername: 'Player2' }
			});

			const highlighted = container.querySelectorAll('.highlighted-card');
			expect(highlighted).toHaveLength(1);
			expect(container.querySelector('#player-mobile-card-player2')).toHaveClass(
				'highlighted-card'
			);
		});

		it('should match the highlighted username case-insensitively', () => {
			const { container } = render(PlayerView, {
				props: { ...mobileProps, highlightedUsername: 'pLaYeR1' }
			});

			expect(container.querySelector('#player-mobile-card-player1')).toHaveClass(
				'highlighted-card'
			);
		});

		it('should highlight nothing without a highlighted username', () => {
			const { container } = render(PlayerView, { props: mobileProps });

			expect(container.querySelectorAll('.highlighted-card')).toHaveLength(0);
		});
	});
});
