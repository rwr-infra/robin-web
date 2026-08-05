import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
	getUrlState,
	updateUrlState,
	clearUrlState,
	createUrlStateSubscriber,
	URL_PARAMS
} from '$lib/utils/url-state';
import { PlayerDatabase } from '$lib/models/player.model';

// Mock browser environment
const mockWindow = {
	location: {
		search: '',
		pathname: '/test'
	},
	history: {
		state: {},
		pushState: vi.fn(),
		replaceState: vi.fn()
	}
};

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

vi.mock('$app/environment', () => ({
	browser: true
}));

vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn()
	}
}));

describe('URL State Management', () => {
	beforeEach(() => {
		// Reset mocks
		vi.clearAllMocks();
		mockWindow.location.search = '';
		mockWindow.location.pathname = '/test';

		// Mock global window and history
		vi.stubGlobal('window', mockWindow);
		vi.stubGlobal('history', mockWindow.history);
	});

	describe('getUrlState', () => {
		test('should return empty state when no URL parameters', () => {
			mockWindow.location.search = '';
			const state = getUrlState();
			expect(state).toEqual({});
		});

		test('should parse search parameter', () => {
			mockWindow.location.search = '?search=test';
			const state = getUrlState();
			expect(state).toEqual({
				search: 'test'
			});
		});

		test('should parse quickFilters parameter', () => {
			mockWindow.location.search = '?quickFilters=invasion%2Cdominance';
			const state = getUrlState();
			expect(state).toEqual({
				quickFilters: ['invasion', 'dominance']
			});
		});

		test('should parse sort parameters', () => {
			mockWindow.location.search = '?sort=players&dir=asc';
			const state = getUrlState();
			expect(state).toEqual({
				sortColumn: 'players',
				sortDirection: 'asc'
			});
		});

		test('should parse multiple parameters', () => {
			mockWindow.location.search =
				'?search=test&quickFilters=invasion%2Cdominance&sort=players&dir=desc';
			const state = getUrlState();
			expect(state).toEqual({
				search: 'test',
				quickFilters: ['invasion', 'dominance'],
				sortColumn: 'players',
				sortDirection: 'desc'
			});
		});

		test('should handle empty quickFilters parameter', () => {
			mockWindow.location.search = '?quickFilters=';
			const state = getUrlState();
			expect(state).toEqual({
				quickFilters: []
			});
		});

		test('should parse page parameter', () => {
			mockWindow.location.search = '?page=5';
			const state = getUrlState();
			expect(state).toEqual({
				page: 5
			});
		});

		test('should parse view parameter', () => {
			mockWindow.location.search = '?view=players';
			const state = getUrlState();
			expect(state).toEqual({
				view: 'players'
			});
		});

		test('should parse playerDb parameter', () => {
			mockWindow.location.search = '?db=pacific';
			const state = getUrlState();
			expect(state).toEqual({
				playerDb: PlayerDatabase.PACIFIC
			});
		});

		test('should ignore invalid view parameter', () => {
			mockWindow.location.search = '?view=invalid';
			const state = getUrlState();
			expect(state).toEqual({});
		});

		test('should ignore invalid playerDb parameter', () => {
			mockWindow.location.search = '?db=invalid';
			const state = getUrlState();
			expect(state).toEqual({});
		});

		test('should ignore invalid page parameter', () => {
			mockWindow.location.search = '?page=abc';
			const state = getUrlState();
			expect(state).toEqual({});
		});

		test('should ignore invalid sort direction', () => {
			mockWindow.location.search = '?dir=invalid';
			const state = getUrlState();
			expect(state).toEqual({});
		});

		test('should parse desc sort direction', () => {
			mockWindow.location.search = '?sort=name&dir=desc';
			const state = getUrlState();
			expect(state).toEqual({
				sortColumn: 'name',
				sortDirection: 'desc'
			});
		});

		test('should parse all valid player databases', () => {
			const databases = ['invasion', 'pacific', 'prereset_invasion'];
			databases.forEach((db) => {
				mockWindow.location.search = `?db=${db}`;
				const state = getUrlState();
				expect(state.playerDb).toBe(db);
			});
		});

		test('should handle special characters in search', () => {
			mockWindow.location.search = '?search=test%20query%20%2B%20special';
			const state = getUrlState();
			expect(state.search).toBe('test query + special');
		});
	});

	describe('updateUrlState', () => {
		test('should update search parameter', () => {
			updateUrlState({ search: 'test query' });

			expect(mockWindow.history.pushState).toHaveBeenCalledWith(
				mockWindow.history.state,
				'',
				'/test?search=test+query'
			);
		});

		test('should remove search parameter when empty', () => {
			mockWindow.location.search = '?search=old';
			updateUrlState({ search: '' });

			expect(mockWindow.history.pushState).toHaveBeenCalledWith(
				mockWindow.history.state,
				'',
				'/test'
			);
		});

		test('should update quickFilters parameter', () => {
			updateUrlState({ quickFilters: ['invasion', 'dominance'] });

			expect(mockWindow.history.pushState).toHaveBeenCalledWith(
				mockWindow.history.state,
				'',
				'/test?quickFilters=invasion%2Cdominance'
			);
		});

		test('should remove quickFilters parameter when empty', () => {
			mockWindow.location.search = '?quickFilters=invasion';
			updateUrlState({ quickFilters: [] });

			expect(mockWindow.history.pushState).toHaveBeenCalledWith(
				mockWindow.history.state,
				'',
				'/test'
			);
		});

		test('should update page parameter', () => {
			updateUrlState({ page: 3 });

			expect(mockWindow.history.pushState).toHaveBeenCalledWith(
				mockWindow.history.state,
				'',
				'/test?page=3'
			);
		});

		test('should remove page parameter when page is 1', () => {
			mockWindow.location.search = '?page=3';
			updateUrlState({ page: 1 });

			expect(mockWindow.history.pushState).toHaveBeenCalledWith(
				mockWindow.history.state,
				'',
				'/test'
			);
		});

		test('should update sort parameters', () => {
			updateUrlState({ sortColumn: 'name', sortDirection: 'desc' });

			expect(mockWindow.history.pushState).toHaveBeenCalled();
			const callArgs = mockWindow.history.pushState.mock.calls[0];
			expect(callArgs[2]).toContain('sort=name');
			expect(callArgs[2]).toContain('dir=desc');
		});

		test('should remove sort parameters', () => {
			mockWindow.location.search = '?sort=name&dir=desc';
			updateUrlState({ sortColumn: undefined, sortDirection: undefined });

			expect(mockWindow.history.pushState).toHaveBeenCalledWith(
				mockWindow.history.state,
				'',
				'/test'
			);
		});

		test('should update view parameter', () => {
			updateUrlState({ view: 'players' });

			expect(mockWindow.history.pushState).toHaveBeenCalled();
			const callArgs = mockWindow.history.pushState.mock.calls[0];
			expect(callArgs[2]).toContain('view=players');
		});

		test('should remove view parameter when servers', () => {
			mockWindow.location.search = '?view=players';
			updateUrlState({ view: 'servers' });

			expect(mockWindow.history.pushState).toHaveBeenCalledWith(
				mockWindow.history.state,
				'',
				'/test'
			);
		});

		test('should update playerDb parameter', () => {
			updateUrlState({ playerDb: PlayerDatabase.PACIFIC });

			expect(mockWindow.history.pushState).toHaveBeenCalled();
			const callArgs = mockWindow.history.pushState.mock.calls[0];
			expect(callArgs[2]).toContain('db=pacific');
		});

		test('should remove playerDb parameter when invasion', () => {
			mockWindow.location.search = '?db=pacific';
			updateUrlState({ playerDb: PlayerDatabase.INVASION });

			expect(mockWindow.history.pushState).toHaveBeenCalledWith(
				mockWindow.history.state,
				'',
				'/test'
			);
		});

		test('should use replaceState when replace is true', () => {
			updateUrlState({ search: 'test' }, true);

			expect(mockWindow.history.replaceState).toHaveBeenCalled();
			expect(mockWindow.history.pushState).not.toHaveBeenCalled();
		});

		test('should use pushState when replace is false', () => {
			updateUrlState({ search: 'test' }, false);

			expect(mockWindow.history.pushState).toHaveBeenCalled();
			expect(mockWindow.history.replaceState).not.toHaveBeenCalled();
		});

		test('should update multiple parameters at once', () => {
			updateUrlState({
				search: 'test',
				quickFilters: ['invasion'],
				page: 2,
				sortColumn: 'score',
				sortDirection: 'desc'
			});

			expect(mockWindow.history.pushState).toHaveBeenCalled();
			const callArgs = mockWindow.history.pushState.mock.calls[0];
			const url = callArgs[2] as string;
			expect(url).toContain('search=test');
			expect(url).toContain('quickFilters=invasion');
			expect(url).toContain('page=2');
			expect(url).toContain('sort=score');
			expect(url).toContain('dir=desc');
		});

		test('should preserve existing parameters when updating one', () => {
			mockWindow.location.search = '?search=old&page=2';
			updateUrlState({ quickFilters: ['invasion'] });

			const callArgs = mockWindow.history.pushState.mock.calls[0];
			const url = callArgs[2] as string;
			expect(url).toContain('quickFilters=invasion');
		});
	});

	describe('clearUrlState', () => {
		test('should use replaceState', () => {
			clearUrlState();

			expect(mockWindow.history.replaceState).toHaveBeenCalled();
			expect(mockWindow.history.pushState).not.toHaveBeenCalled();
		});
	});

	describe('URL_PARAMS constants', () => {
		test('should have correct parameter names', () => {
			expect(URL_PARAMS.SEARCH).toBe('search');
			expect(URL_PARAMS.QUICK_FILTERS).toBe('quickFilters');
			expect(URL_PARAMS.PAGE).toBe('page');
			expect(URL_PARAMS.SORT_COLUMN).toBe('sort');
			expect(URL_PARAMS.SORT_DIRECTION).toBe('dir');
			expect(URL_PARAMS.VIEW).toBe('view');
			expect(URL_PARAMS.PLAYER_DB).toBe('db');
		});
	});

	describe('edge cases', () => {
		test('should handle undefined page parameter', () => {
			updateUrlState({ page: undefined });

			expect(mockWindow.history.pushState).toHaveBeenCalledWith(
				mockWindow.history.state,
				'',
				'/test'
			);
		});

		test('should handle empty string search', () => {
			updateUrlState({ search: '' });

			expect(mockWindow.history.pushState).toHaveBeenCalledWith(
				mockWindow.history.state,
				'',
				'/test'
			);
		});

		test('should handle undefined view', () => {
			updateUrlState({ view: undefined });

			expect(mockWindow.history.pushState).toHaveBeenCalledWith(
				mockWindow.history.state,
				'',
				'/test'
			);
		});

		test('should handle undefined playerDb', () => {
			updateUrlState({ playerDb: undefined });

			expect(mockWindow.history.pushState).toHaveBeenCalledWith(
				mockWindow.history.state,
				'',
				'/test'
			);
		});
	});

	describe('similar accounts anchor', () => {
		test('should parse the anchor parameter', () => {
			mockWindow.location.search = '?sort=sid&anchor=SGT.BONETRAIN';
			const state = getUrlState();

			expect(state.sidAnchor).toBe('SGT.BONETRAIN');
			expect(state.sortColumn).toBe('sid');
		});

		test('should ignore an empty anchor parameter', () => {
			mockWindow.location.search = '?anchor=';
			const state = getUrlState();

			expect(state.sidAnchor).toBeUndefined();
		});

		test('should write the anchor into the URL', () => {
			updateUrlState({ sidAnchor: 'SGT.BONETRAIN' });

			expect(mockWindow.history.pushState).toHaveBeenCalledWith(
				mockWindow.history.state,
				'',
				`/test?${URL_PARAMS.SID_ANCHOR}=SGT.BONETRAIN`
			);
		});

		test('should remove the anchor when cleared', () => {
			mockWindow.location.search = '?anchor=SGT.BONETRAIN';
			updateUrlState({ sidAnchor: undefined });

			expect(mockWindow.history.pushState).toHaveBeenCalledWith(
				mockWindow.history.state,
				'',
				'/test'
			);
		});

		test('should round-trip a shared neighbor link', () => {
			mockWindow.location.search = '?view=players&db=pacific&sort=sid&anchor=Someone';
			const state = getUrlState();

			expect(state).toEqual({
				view: 'players',
				playerDb: PlayerDatabase.PACIFIC,
				sortColumn: 'sid',
				sidAnchor: 'Someone'
			});
		});

		test('should drop the anchor together with the rest of the state', () => {
			mockWindow.location.search = '?search=a&anchor=Someone&sort=sid';
			clearUrlState();

			expect(mockWindow.history.replaceState).toHaveBeenCalledWith(
				mockWindow.history.state,
				'',
				'/test'
			);
		});
	});
});
