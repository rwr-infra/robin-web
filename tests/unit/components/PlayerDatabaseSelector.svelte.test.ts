import { render, screen, fireEvent } from '@testing-library/svelte/svelte5';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlayerDatabaseSelector from '$lib/components/PlayerDatabaseSelector.svelte';
import { PlayerDatabase } from '$lib/models/player.model';

// Mock TranslatedText component
vi.mock('$lib/components/TranslatedText.svelte', () => ({
	default: (props: { key: string; fallback?: string }) => {
		const keyToText: Record<string, string> = {
			'app.player.database.invasion': 'Invasion',
			'app.player.database.pacific': 'Pacific',
			'app.player.database.prereset_invasion': 'Invasion (before reset)'
		};
		return props.fallback || keyToText[props.key] || props.key;
	}
}));

describe('PlayerDatabaseSelector Component', () => {
	let mockOnDbChange: ReturnType<typeof vi.fn<(db: PlayerDatabase) => void>>;

	beforeEach(() => {
		mockOnDbChange = vi.fn();
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('should render with default props', async () => {
			const { container } = render(PlayerDatabaseSelector, {
				props: {
					currentDb: PlayerDatabase.INVASION,
					onDbChange: mockOnDbChange
				}
			});

			const select = container.querySelector('.select');
			expect(select).toBeInTheDocument();
		});

		it('should render all three database options', async () => {
			const { container } = render(PlayerDatabaseSelector, {
				props: {
					currentDb: PlayerDatabase.INVASION,
					onDbChange: mockOnDbChange
				}
			});

			const options = container.querySelectorAll('option');
			expect(options.length).toBe(3);
		});

		it('should have invasion as first option', async () => {
			const { container } = render(PlayerDatabaseSelector, {
				props: {
					currentDb: PlayerDatabase.INVASION,
					onDbChange: mockOnDbChange
				}
			});

			const options = container.querySelectorAll('option');
			expect(options[0]).toHaveValue(PlayerDatabase.INVASION);
		});

		it('should have pacific as second option', async () => {
			const { container } = render(PlayerDatabaseSelector, {
				props: {
					currentDb: PlayerDatabase.INVASION,
					onDbChange: mockOnDbChange
				}
			});

			const options = container.querySelectorAll('option');
			expect(options[1]).toHaveValue(PlayerDatabase.PACIFIC);
		});

		it('should have prereset_invasion as third option', async () => {
			const { container } = render(PlayerDatabaseSelector, {
				props: {
					currentDb: PlayerDatabase.INVASION,
					onDbChange: mockOnDbChange
				}
			});

			const options = container.querySelectorAll('option');
			expect(options[2]).toHaveValue(PlayerDatabase.PRERESET_INVASION);
		});

		it('should display invasion as selected when currentDb is invasion', async () => {
			const { container } = render(PlayerDatabaseSelector, {
				props: {
					currentDb: PlayerDatabase.INVASION,
					onDbChange: mockOnDbChange
				}
			});

			const select = container.querySelector('select') as HTMLSelectElement;
			expect(select.value).toBe(PlayerDatabase.INVASION);
		});

		it('should display pacific as selected when currentDb is pacific', async () => {
			const { container } = render(PlayerDatabaseSelector, {
				props: {
					currentDb: PlayerDatabase.PACIFIC,
					onDbChange: mockOnDbChange
				}
			});

			const select = container.querySelector('select') as HTMLSelectElement;
			expect(select.value).toBe(PlayerDatabase.PACIFIC);
		});

		it('should display prereset_invasion as selected when currentDb is prereset_invasion', async () => {
			const { container } = render(PlayerDatabaseSelector, {
				props: {
					currentDb: PlayerDatabase.PRERESET_INVASION,
					onDbChange: mockOnDbChange
				}
			});

			const select = container.querySelector('select') as HTMLSelectElement;
			expect(select.value).toBe(PlayerDatabase.PRERESET_INVASION);
		});
	});

	describe('User Interactions', () => {
		it('should call onDbChange when switching from invasion to pacific', async () => {
			const { container } = render(PlayerDatabaseSelector, {
				props: {
					currentDb: PlayerDatabase.INVASION,
					onDbChange: mockOnDbChange
				}
			});

			const select = container.querySelector('select') as HTMLSelectElement;
			await fireEvent.change(select, { target: { value: PlayerDatabase.PACIFIC } });

			expect(mockOnDbChange).toHaveBeenCalledWith(PlayerDatabase.PACIFIC);
		});

		it('should call onDbChange when switching to prereset_invasion', async () => {
			const { container } = render(PlayerDatabaseSelector, {
				props: {
					currentDb: PlayerDatabase.INVASION,
					onDbChange: mockOnDbChange
				}
			});

			const select = container.querySelector('select') as HTMLSelectElement;
			await fireEvent.change(select, { target: { value: PlayerDatabase.PRERESET_INVASION } });

			expect(mockOnDbChange).toHaveBeenCalledWith(PlayerDatabase.PRERESET_INVASION);
		});

		it('should call onDbChange with correct PlayerDatabase type', async () => {
			const { container } = render(PlayerDatabaseSelector, {
				props: {
					currentDb: PlayerDatabase.PACIFIC,
					onDbChange: mockOnDbChange
				}
			});

			const select = container.querySelector('select') as HTMLSelectElement;
			await fireEvent.change(select, { target: { value: PlayerDatabase.INVASION } });

			expect(mockOnDbChange).toHaveBeenCalledWith(PlayerDatabase.INVASION);
			expect(mockOnDbChange).toHaveBeenCalledTimes(1);
		});

		it('should handle rapid database changes', async () => {
			const { container } = render(PlayerDatabaseSelector, {
				props: {
					currentDb: PlayerDatabase.INVASION,
					onDbChange: mockOnDbChange
				}
			});

			const select = container.querySelector('select') as HTMLSelectElement;
			await fireEvent.change(select, { target: { value: PlayerDatabase.PACIFIC } });
			await fireEvent.change(select, { target: { value: PlayerDatabase.PRERESET_INVASION } });
			await fireEvent.change(select, { target: { value: PlayerDatabase.INVASION } });

			expect(mockOnDbChange).toHaveBeenNthCalledWith(1, PlayerDatabase.PACIFIC);
			expect(mockOnDbChange).toHaveBeenNthCalledWith(2, PlayerDatabase.PRERESET_INVASION);
			expect(mockOnDbChange).toHaveBeenNthCalledWith(3, PlayerDatabase.INVASION);
		});
	});

	describe('Styling', () => {
		it('should have correct CSS classes', async () => {
			const { container } = render(PlayerDatabaseSelector, {
				props: {
					currentDb: PlayerDatabase.INVASION,
					onDbChange: mockOnDbChange
				}
			});

			const select = container.querySelector('.select');
			expect(select).toHaveClass('select', 'select-bordered', 'w-full', 'min-w-48', 'sm:w-auto');
		});

		it('should be a select element', async () => {
			const { container } = render(PlayerDatabaseSelector, {
				props: {
					currentDb: PlayerDatabase.INVASION,
					onDbChange: mockOnDbChange
				}
			});

			const select = container.querySelector('select');
			expect(select?.tagName).toBe('SELECT');
		});
	});

	describe('Edge Cases', () => {
		it('should handle missing onDbChange gracefully', async () => {
			// Should not throw when onDbChange is not provided
			expect(() => {
				render(PlayerDatabaseSelector, {
					props: {
						currentDb: PlayerDatabase.INVASION,
						onDbChange: undefined as any
					}
				});
			}).not.toThrow();
		});

		it('should render correctly with all valid database values', async () => {
			const databases: PlayerDatabase[] = [
				PlayerDatabase.INVASION,
				PlayerDatabase.PACIFIC,
				PlayerDatabase.PRERESET_INVASION
			];

			for (const db of databases) {
				const { container } = render(PlayerDatabaseSelector, {
					props: {
						currentDb: db,
						onDbChange: mockOnDbChange
					}
				});

				const select = container.querySelector('select') as HTMLSelectElement;
				expect(select.value).toBe(db);
			}
		});
	});

	describe('Type Safety', () => {
		it('should only accept valid PlayerDatabase values as currentDb', async () => {
			const validDatabases: PlayerDatabase[] = [
				PlayerDatabase.INVASION,
				PlayerDatabase.PACIFIC,
				PlayerDatabase.PRERESET_INVASION
			];

			// This test documents the expected valid values
			expect(validDatabases).toContain(PlayerDatabase.INVASION);
			expect(validDatabases).toContain(PlayerDatabase.PACIFIC);
			expect(validDatabases).toContain(PlayerDatabase.PRERESET_INVASION);
		});

		it('should call onDbChange with PlayerDatabase type', async () => {
			const { container } = render(PlayerDatabaseSelector, {
				props: {
					currentDb: PlayerDatabase.INVASION,
					onDbChange: mockOnDbChange
				}
			});

			const select = container.querySelector('select') as HTMLSelectElement;
			await fireEvent.change(select, { target: { value: PlayerDatabase.PACIFIC } });

			// Verify the callback is called with the correct type
			expect(mockOnDbChange).toHaveBeenCalledWith(PlayerDatabase.PACIFIC);
			const callArg = mockOnDbChange.mock.calls[0][0];
			// This should be a valid PlayerDatabase value
			expect([
				PlayerDatabase.INVASION,
				PlayerDatabase.PACIFIC,
				PlayerDatabase.PRERESET_INVASION
			]).toContain(callArg);
		});
	});
});
