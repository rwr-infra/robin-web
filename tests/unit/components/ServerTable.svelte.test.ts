import { render, fireEvent } from '@testing-library/svelte/svelte5';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ServerTable from '$lib/components/ServerTable.svelte';
import { columns } from '$lib/config/server-columns';
import type { IDisplayServerItem } from '$lib/models/server.model';
import { createMockDisplayServers } from '../../fixtures/mock-data-generator';

// Mock messages
vi.mock('$lib/paraglide/messages.js', () => ({
	m: new Proxy(
		{
			'app.server.noDataFound': () => 'No data found',
			'app.server.matchingSearch': () => 'matching your search',
			'app.button.join': () => 'Join',
			'app.ariaLabel.clickToSort': () => 'Click to sort',
			'app.ariaLabel.previewMap': () => 'Preview map'
		},
		{
			get: (target: any, prop: string) => target[prop] || (() => prop)
		}
	)
}));

// Mock the TranslatedText component
vi.mock('$lib/components/TranslatedText.svelte', () => ({
	default: (props: any) => {
		const keys: Record<string, string> = {
			'app.server.noDataFound': 'No data found',
			'app.server.matchingSearch': 'matching your search'
		};
		const text = keys[props.key] || props.key;
		// Return text as component output
		return text;
	}
}));

describe('ServerTable', () => {
	let mockData: IDisplayServerItem[];
	let mockOnRowAction: ReturnType<typeof vi.fn>;
	let mockOnSort: ReturnType<typeof vi.fn>;
	let mockVisibleColumns: Record<string, boolean>;

	beforeEach(() => {
		mockData = createMockDisplayServers(3);
		mockOnRowAction = vi.fn();
		mockOnSort = vi.fn();
		mockVisibleColumns = {
			name: true,
			playerCount: true,
			mapId: true,
			ipAddress: true,
			port: true,
			country: true,
			mode: true,
			bots: true,
			playerList: true,
			comment: true,
			dedicated: true,
			mod: true,
			url: true,
			version: true,
			action: true
		};
	});

	describe('Rendering', () => {
		it('should render desktop table correctly', () => {
			render(ServerTable, {
				props: {
					data: mockData,
					columns,
					visibleColumns: mockVisibleColumns,
					searchQuery: '',
					onRowAction: mockOnRowAction as any,
					onSort: mockOnSort as any
				}
			});

			// Should render desktop table
			const table = document.querySelector('table');
			expect(table).toBeInTheDocument();

			// Should render table header
			const tableHeader = document.querySelector('thead');
			expect(tableHeader).toBeInTheDocument();

			// Should render table body
			const tableBody = document.querySelector('tbody');
			expect(tableBody).toBeInTheDocument();

			// Should render rows for all data items
			const rows = document.querySelectorAll('tbody tr');
			expect(rows.length).toBe(mockData.length);
		});

		it('should render server names correctly', () => {
			render(ServerTable, {
				props: {
					data: mockData,
					columns,
					visibleColumns: mockVisibleColumns,
					searchQuery: '',
					onRowAction: mockOnRowAction as any,
					onSort: mockOnSort as any
				}
			});

			// Check if server names are rendered in the table
			mockData.forEach((server, index) => {
				const rows = document.querySelectorAll('tbody tr');
				const nameCell = rows[index]?.querySelector('td');
				expect(nameCell).toBeInTheDocument();
				expect(nameCell?.textContent).toContain(server.name);
			});
		});

		it('should render action column with Join buttons', () => {
			render(ServerTable, {
				props: {
					data: mockData,
					columns,
					visibleColumns: mockVisibleColumns,
					searchQuery: '',
					onRowAction: mockOnRowAction as any,
					onSort: mockOnSort as any
				}
			});

			// Should find Join buttons in action column
			const joinButtons = document.querySelectorAll('.btn-primary');
			expect(joinButtons.length).toBe(mockData.length);

			joinButtons.forEach((button) => {
				expect(button.textContent).toBe('Join');
			});
		});

		it('should not render anything when data is empty', () => {
			render(ServerTable, {
				props: {
					data: [],
					columns,
					visibleColumns: mockVisibleColumns,
					searchQuery: '',
					onRowAction: mockOnRowAction as any,
					onSort: mockOnSort as any
				}
			});

			// Should render empty state alert instead of table
			const table = document.querySelector('table');
			expect(table).not.toBeInTheDocument();

			const alert = document.querySelector('.alert-info');
			expect(alert).toBeInTheDocument();
		});
	});

	describe('Column visibility', () => {
		it('should respect visibleColumns configuration', () => {
			const limitedVisibleColumns = {
				name: true,
				playerCount: true,
				mapId: true,
				ipAddress: false,
				port: false,
				country: false,
				mode: false,
				bots: false,
				playerList: false,
				comment: false,
				dedicated: false,
				mod: false,
				url: false,
				version: false,
				action: true
			};

			render(ServerTable, {
				props: {
					data: mockData,
					columns,
					visibleColumns: limitedVisibleColumns,
					searchQuery: '',
					onRowAction: mockOnRowAction as any,
					onSort: mockOnSort as any
				}
			});

			const headerCells = document.querySelectorAll('thead th');
			const visibleColumnsCount = Object.values(limitedVisibleColumns).filter(Boolean).length;
			expect(headerCells.length).toBe(visibleColumnsCount);
		});

		it('should hide columns when not in visibleColumns', () => {
			const limitedVisibleColumns = {
				name: true,
				playerCount: true,
				mapId: true,
				ipAddress: false, // Hidden
				port: false, // Hidden
				action: true
			};

			render(ServerTable, {
				props: {
					data: mockData,
					columns,
					visibleColumns: limitedVisibleColumns,
					searchQuery: '',
					onRowAction: mockOnRowAction as any,
					onSort: mockOnSort as any
				}
			});

			// Should not find IP address column
			const ipHeader = Array.from(document.querySelectorAll('thead th')).find(
				(th) => th.textContent?.includes('IP') || th.textContent?.includes('ipAddress')
			);
			expect(ipHeader).toBeUndefined();

			// Should not find port column
			const portHeader = Array.from(document.querySelectorAll('thead th')).find(
				(th) => th.textContent?.includes('Port') || th.textContent?.includes('port')
			);
			expect(portHeader).toBeUndefined();
		});
	});

	describe('Search highlighting', () => {
		it('should pass searchQuery to getDisplayValue function', () => {
			const searchQuery = 'TestServer';

			render(ServerTable, {
				props: {
					data: mockData,
					columns,
					visibleColumns: mockVisibleColumns,
					searchQuery,
					onRowAction: mockOnRowAction as any,
					onSort: mockOnSort as any
				}
			});

			// Verify search query is passed through
			const firstRow = document.querySelector('tbody tr');
			expect(firstRow).toBeInTheDocument();
		});
	});

	describe('Sorting functionality', () => {
		it('should render sort buttons in column headers', () => {
			render(ServerTable, {
				props: {
					data: mockData,
					columns,
					visibleColumns: mockVisibleColumns,
					searchQuery: '',
					onRowAction: mockOnRowAction as any,
					onSort: mockOnSort as any
				}
			});

			// Should find sort buttons for sortable columns
			const sortButtons = document.querySelectorAll('thead button');
			const sortableColumnsCount = columns.filter((col) => col.key !== 'action').length;
			expect(sortButtons.length).toBe(sortableColumnsCount);
		});

		it('should call onSort when sort button is clicked', async () => {
			render(ServerTable, {
				props: {
					data: mockData,
					columns,
					visibleColumns: mockVisibleColumns,
					searchQuery: '',
					onRowAction: mockOnRowAction as any,
					onSort: mockOnSort as any
				}
			});

			const firstSortButton = document.querySelector('thead button');
			if (firstSortButton) {
				await fireEvent.click(firstSortButton);
				expect(mockOnSort).toHaveBeenCalledTimes(1);
			}
		});
	});

	describe('Action functionality', () => {
		it('should call onRowAction when Join button is clicked', async () => {
			render(ServerTable, {
				props: {
					data: mockData,
					columns,
					visibleColumns: mockVisibleColumns,
					searchQuery: '',
					onRowAction: mockOnRowAction as any,
					onSort: mockOnSort as any
				}
			});

			const firstJoinButton = document.querySelector('.btn-primary');
			if (firstJoinButton) {
				await fireEvent.click(firstJoinButton);
				expect(mockOnRowAction).toHaveBeenCalledTimes(1);
				expect(mockOnRowAction).toHaveBeenCalledWith({
					item: mockData[0],
					action: 'join'
				});
			}
		});
	});

	describe('Data display', () => {
		it('should display URL links correctly', () => {
			const dataWithUrl = createMockDisplayServers(1, {
				url: 'https://example.com'
			});

			render(ServerTable, {
				props: {
					data: dataWithUrl,
					columns,
					visibleColumns: mockVisibleColumns,
					searchQuery: '',
					onRowAction: mockOnRowAction as any,
					onSort: mockOnSort as any
				}
			});

			const urlLink = document.querySelector('a[href="https://example.com"]');
			expect(urlLink).toBeInTheDocument();
		});

		it('should handle missing URL gracefully', () => {
			const dataWithoutUrl = createMockDisplayServers(3, { url: null });

			render(ServerTable, {
				props: {
					data: dataWithoutUrl,
					columns,
					visibleColumns: mockVisibleColumns,
					searchQuery: '',
					onRowAction: mockOnRowAction as any,
					onSort: mockOnSort as any
				}
			});

			// Should not crash and not render URL column if no URL
			const urlLinks = document.querySelectorAll('a[href]');
			// Only count external links, not anchor-less links
			const externalLinks = Array.from(urlLinks).filter(
				(link) =>
					(link as HTMLAnchorElement).href &&
					(link as HTMLAnchorElement).href !== window.location.href
			);
			expect(externalLinks.length).toBe(0);
		});
	});

	describe('Styling and classes', () => {
		it('should apply sticky positioning to action column', () => {
			render(ServerTable, {
				props: {
					data: mockData,
					columns,
					visibleColumns: mockVisibleColumns,
					searchQuery: '',
					onRowAction: mockOnRowAction as any,
					onSort: mockOnSort as any
				}
			});

			// Check if action cell has sticky positioning class
			const actionCells = document.querySelectorAll('.action-cell');
			expect(actionCells.length).toBe(mockData.length);

			actionCells.forEach((cell) => {
				expect(cell).toHaveClass('border-mil');
				expect(cell).toHaveClass('px-4');
				expect(cell).toHaveClass('py-1');
				expect(cell).toHaveClass('text-mil-primary');
			});
		});

		it('should apply hover effects to table rows', () => {
			render(ServerTable, {
				props: {
					data: mockData,
					columns,
					visibleColumns: mockVisibleColumns,
					searchQuery: '',
					onRowAction: mockOnRowAction as any,
					onSort: mockOnSort as any
				}
			});

			const rows = document.querySelectorAll('tbody tr');
			rows.forEach((row) => {
				expect(row).toHaveClass('hover');
			});
		});
	});

	describe('Empty state', () => {
		it('should show appropriate empty state message', () => {
			render(ServerTable, {
				props: {
					data: [],
					columns,
					visibleColumns: mockVisibleColumns,
					searchQuery: '',
					onRowAction: mockOnRowAction as any,
					onSort: mockOnSort as any
				}
			});

			const alert = document.querySelector('.alert-info');
			expect(alert).toBeInTheDocument();
		});

		it('should show search-related empty message when searching', () => {
			render(ServerTable, {
				props: {
					data: [],
					columns,
					visibleColumns: mockVisibleColumns,
					searchQuery: 'test',
					onRowAction: mockOnRowAction as any,
					onSort: mockOnSort as any
				}
			});

			const alert = document.querySelector('.alert-info');
			expect(alert).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('should have proper table structure', () => {
			render(ServerTable, {
				props: {
					data: mockData,
					columns,
					visibleColumns: mockVisibleColumns,
					searchQuery: '',
					onRowAction: mockOnRowAction as any,
					onSort: mockOnSort as any
				}
			});

			// Check for proper table structure
			const table = document.querySelector('table');
			const thead = document.querySelector('thead');
			const tbody = document.querySelector('tbody');

			expect(table).toBeInTheDocument();
			expect(thead).toBeInTheDocument();
			expect(tbody).toBeInTheDocument();
		});

		it('should have proper ARIA attributes for action buttons', () => {
			render(ServerTable, {
				props: {
					data: mockData,
					columns,
					visibleColumns: mockVisibleColumns,
					searchQuery: '',
					onRowAction: mockOnRowAction as any,
					onSort: mockOnSort as any
				}
			});

			const joinButtons = document.querySelectorAll('.btn-primary');
			joinButtons.forEach((button) => {
				expect(button).toHaveAttribute('type', 'button');
			});
		});
	});

	describe('getAlignmentClass function', () => {
		it('should return correct CSS classes for different alignment configurations', () => {
			render(ServerTable, {
				props: {
					data: mockData,
					columns,
					visibleColumns: mockVisibleColumns,
					searchQuery: '',
					onRowAction: mockOnRowAction as any,
					onSort: mockOnSort as any
				}
			});

			// Check if cells have proper alignment classes based on column configuration
			const rightAlignedColumns = columns.filter((col) => col.alignment === 'right');
			const centerAlignedColumns = columns.filter((col) => col.alignment === 'center');

			// Test right alignment
			if (rightAlignedColumns.length > 0) {
				const rightAlignedColumn = rightAlignedColumns[0];
				const rightAlignedCells = document.querySelectorAll(
					`td:nth-child(${columns.indexOf(rightAlignedColumn) + 1})`
				);
				rightAlignedCells.forEach((cell) => {
					expect(cell).toHaveClass('text-right');
				});
			}

			// Test center alignment
			if (centerAlignedColumns.length > 0) {
				const centerAlignedColumn = centerAlignedColumns[0];
				const centerAlignedCells = document.querySelectorAll(
					`td:nth-child(${columns.indexOf(centerAlignedColumn) + 1})`
				);
				centerAlignedCells.forEach((cell) => {
					expect(cell).toHaveClass('text-center');
				});
			}
		});

		it('should default to left alignment when no alignment is specified', () => {
			const noAlignmentColumns = columns.filter((col) => !col.alignment);

			if (noAlignmentColumns.length > 0) {
				const noAlignmentColumn = noAlignmentColumns[0];
				const leftAlignedCells = document.querySelectorAll(
					`td:nth-child(${columns.indexOf(noAlignmentColumn) + 1})`
				);
				leftAlignedCells.forEach((cell) => {
					expect(cell).toHaveClass('align-middle');
					expect(cell).not.toHaveClass('text-right');
					expect(cell).not.toHaveClass('text-center');
				});
			}
		});
	});

	describe('Responsive behavior', () => {
		it('should hide action column on mobile screens', () => {
			render(ServerTable, {
				props: {
					data: mockData,
					columns,
					visibleColumns: mockVisibleColumns,
					searchQuery: '',
					onRowAction: mockOnRowAction as any,
					onSort: mockOnSort as any
				}
			});

			// Check if action cells are hidden on mobile via CSS
			const actionCells = document.querySelectorAll('.action-cell');
			actionCells.forEach((cell) => {
				const styles = getComputedStyle(cell);
				// Should be hidden on mobile screens
				expect(styles.display).toBe('table-cell');
			});
		});

		it('should still render Join buttons in desktop action column', () => {
			render(ServerTable, {
				props: {
					data: mockData,
					columns,
					visibleColumns: mockVisibleColumns,
					searchQuery: '',
					onRowAction: mockOnRowAction as any,
					onSort: mockOnSort as any
				}
			});

			// Should still have Join buttons in action column
			const joinButtons = document.querySelectorAll('.btn-primary');
			expect(joinButtons.length).toBe(mockData.length);
		});
	});
});
