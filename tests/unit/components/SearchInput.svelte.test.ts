import { render, screen, fireEvent, waitFor } from '@testing-library/svelte/svelte5';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchInput from '$lib/components/SearchInput.svelte';

describe('SearchInput Component', () => {
	let mockOnInput: ReturnType<typeof vi.fn>;
	let mockOnEnter: ReturnType<typeof vi.fn>;
	let mockOnRef: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		mockOnInput = vi.fn();
		mockOnEnter = vi.fn();
		mockOnRef = vi.fn();
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('should render with default placeholder', async () => {
			render(SearchInput, {
				props: {
					oninput: mockOnInput as any,
					onEnter: mockOnEnter as any,
					onRef: mockOnRef as any
				}
			});

			const input = screen.getByRole('searchbox');
			expect(input).toBeInTheDocument();
			expect(input).toHaveAttribute('placeholder', 'Search...');
		});

		it('should render with custom placeholder', async () => {
			render(SearchInput, {
				props: {
					placeholder: 'Search servers...',
					oninput: mockOnInput as any,
					onEnter: mockOnEnter as any,
					onRef: mockOnRef as any
				}
			});

			const input = screen.getByRole('searchbox');
			expect(input).toHaveAttribute('placeholder', 'Search servers...');
		});

		it('should render with initial value', async () => {
			render(SearchInput, {
				props: {
					value: 'initial search',
					oninput: mockOnInput as any,
					onEnter: mockOnEnter as any,
					onRef: mockOnRef as any
				}
			});

			const input = screen.getByRole('searchbox');
			expect(input).toHaveValue('initial search');
		});

		it('should render search icon', async () => {
			render(SearchInput, {
				props: {
					oninput: mockOnInput as any,
					onEnter: mockOnEnter as any,
					onRef: mockOnRef as any
				}
			});

			const icon = screen.getByRole('searchbox').previousElementSibling as SVGElement;
			expect(icon).toBeInTheDocument();
			expect(icon.tagName).toBe('svg');
		});

		it('should have proper form-control styling', async () => {
			const { container } = render(SearchInput, {
				props: {
					oninput: mockOnInput as any,
					onEnter: mockOnEnter as any,
					onRef: mockOnRef as any
				}
			});

			const wrapper = container.querySelector('.form-control');
			expect(wrapper).toBeInTheDocument();
		});
	});

	describe('Input Handling', () => {
		it('should call oninput when user types', async () => {
			render(SearchInput, {
				props: {
					oninput: mockOnInput as any,
					onEnter: mockOnEnter as any,
					onRef: mockOnRef as any
				}
			});

			const input = screen.getByRole('searchbox') as HTMLInputElement;

			await fireEvent.input(input, { target: { value: 'test search' } });

			expect(mockOnInput).toHaveBeenCalledWith('test search');
		});

		it('should update input value when value prop changes', async () => {
			const { rerender } = render(SearchInput, {
				props: {
					value: 'initial',
					oninput: mockOnInput as any,
					onEnter: mockOnEnter as any,
					onRef: mockOnRef as any
				}
			});

			const input = screen.getByRole('searchbox') as HTMLInputElement;
			expect(input.value).toBe('initial');

			await rerender({
				value: 'updated',
				oninput: mockOnInput as any,
				onEnter: mockOnEnter as any,
				onRef: mockOnRef as any
			});

			expect(input.value).toBe('updated');
		});
	});

	describe('Enter Key Handling', () => {
		it('should call onEnter when Enter key is pressed', async () => {
			render(SearchInput, {
				props: {
					oninput: mockOnInput as any,
					onEnter: mockOnEnter as any,
					onRef: mockOnRef as any
				}
			});

			const input = screen.getByRole('searchbox') as HTMLInputElement;
			input.value = 'test search';

			await fireEvent.keyDown(input, { key: 'Enter' });

			expect(mockOnEnter).toHaveBeenCalledWith('test search');
		});

		it('should not call onEnter for other keys', async () => {
			render(SearchInput, {
				props: {
					oninput: mockOnInput as any,
					onEnter: mockOnEnter as any,
					onRef: mockOnRef as any
				}
			});

			const input = screen.getByRole('searchbox') as HTMLInputElement;

			await fireEvent.keyDown(input, { key: 'Escape' });

			expect(mockOnEnter).not.toHaveBeenCalled();
		});
	});

	describe('Ref Callback', () => {
		it('should call onRef with input element when component mounts', async () => {
			render(SearchInput, {
				props: {
					oninput: mockOnInput as any,
					onEnter: mockOnEnter as any,
					onRef: mockOnRef as any
				}
			});

			await waitFor(() => {
				expect(mockOnRef).toHaveBeenCalled();
			});

			const refArg = mockOnRef.mock.calls[0][0];
			expect(refArg).toBeInstanceOf(HTMLInputElement);
		});

		it('should not call onRef if onRef is not provided', async () => {
			render(SearchInput, {
				props: {
					oninput: mockOnInput as any,
					onEnter: mockOnEnter as any
				}
			});

			// Wait a bit to ensure no call
			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(mockOnRef).not.toHaveBeenCalled();
		});
	});

	describe('Accessibility', () => {
		it('should have proper search input type', async () => {
			render(SearchInput, {
				props: {
					oninput: mockOnInput as any,
					onEnter: mockOnEnter as any,
					onRef: mockOnRef as any
				}
			});

			const input = screen.getByRole('searchbox');
			expect(input).toHaveAttribute('type', 'search');
		});

		it('should have accessible placeholder', async () => {
			render(SearchInput, {
				props: {
					placeholder: 'Search servers, maps...',
					oninput: mockOnInput as any,
					onEnter: mockOnEnter as any,
					onRef: mockOnRef as any
				}
			});

			const input = screen.getByRole('searchbox');
			expect(input).toHaveAttribute('placeholder');
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty input value', async () => {
			render(SearchInput, {
				props: {
					value: '',
					oninput: mockOnInput as any,
					onEnter: mockOnEnter as any,
					onRef: mockOnRef as any
				}
			});

			const input = screen.getByRole('searchbox') as HTMLInputElement;
			expect(input.value).toBe('');
		});

		it('should handle missing callbacks gracefully', async () => {
			render(SearchInput, {
				props: {}
			});

			const input = screen.getByRole('searchbox') as HTMLInputElement;

			// Should not throw when typing without oninput
			await fireEvent.input(input, { target: { value: 'test' } });

			// Should not throw when pressing Enter without onEnter
			await fireEvent.keyDown(input, { key: 'Enter' });
		});

		it('should handle special characters in search', async () => {
			render(SearchInput, {
				props: {
					oninput: mockOnInput as any,
					onEnter: mockOnEnter as any,
					onRef: mockOnRef as any
				}
			});

			const input = screen.getByRole('searchbox') as HTMLInputElement;
			const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';

			await fireEvent.input(input, { target: { value: specialChars } });

			expect(mockOnInput).toHaveBeenCalledWith(specialChars);
		});
	});
});
