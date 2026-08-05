import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import type { PlayerDatabase } from '$lib/models/player.model';

// URL查询参数键名
export const URL_PARAMS = {
	SEARCH: 'search',
	QUICK_FILTERS: 'quickFilters',
	PAGE: 'page',
	SORT_COLUMN: 'sort',
	SORT_DIRECTION: 'dir',
	VIEW: 'view',
	PLAYER_DB: 'db',
	SID_ANCHOR: 'anchor'
} as const;

// URL状态管理接口
export interface UrlState {
	search?: string;
	quickFilters?: string[];
	page?: number;
	sortColumn?: string;
	sortDirection?: 'asc' | 'desc';
	view?: 'servers' | 'players';
	playerDb?: PlayerDatabase;
	/** Username the "similar accounts" (SID) window is anchored on */
	sidAnchor?: string;
}

// 从URL获取查询参数
export function getUrlState(): UrlState {
	if (!browser) return {};

	const urlParams = new URLSearchParams(window.location.search);
	const state: UrlState = {};

	// Only add properties if they have meaningful values
	const search = urlParams.get(URL_PARAMS.SEARCH);
	if (search) {
		state.search = search;
	}

	const quickFilters = urlParams.get(URL_PARAMS.QUICK_FILTERS);
	if (quickFilters !== null) {
		const filters = quickFilters.split(',').filter(Boolean);
		state.quickFilters = filters;
	}

	const page = urlParams.get(URL_PARAMS.PAGE);
	if (page) {
		const pageNum = parseInt(page, 10);
		if (!isNaN(pageNum)) {
			state.page = pageNum;
		}
	}

	const sortColumn = urlParams.get(URL_PARAMS.SORT_COLUMN);
	if (sortColumn) {
		state.sortColumn = sortColumn;
	}

	const sortDirection = urlParams.get(URL_PARAMS.SORT_DIRECTION);
	if (sortDirection && (sortDirection === 'asc' || sortDirection === 'desc')) {
		state.sortDirection = sortDirection;
	}

	// 视图模式
	const view = urlParams.get(URL_PARAMS.VIEW);
	if (view === 'servers' || view === 'players') {
		state.view = view;
	}

	// 玩家数据库
	const playerDb = urlParams.get(URL_PARAMS.PLAYER_DB);
	if (playerDb === 'invasion' || playerDb === 'pacific' || playerDb === 'prereset_invasion') {
		state.playerDb = playerDb as PlayerDatabase;
	}

	// 相近账号锚点玩家
	const sidAnchor = urlParams.get(URL_PARAMS.SID_ANCHOR);
	if (sidAnchor) {
		state.sidAnchor = sidAnchor;
	}

	return state;
}

// 更新URL查询参数
export function updateUrlState(state: Partial<UrlState>, replace: boolean = false): void {
	if (!browser) return;

	const urlParams = new URLSearchParams(window.location.search);

	// 更新搜索参数
	if ('search' in state) {
		if (state.search && state.search.length > 0) {
			urlParams.set(URL_PARAMS.SEARCH, state.search);
		} else {
			urlParams.delete(URL_PARAMS.SEARCH);
		}
	}

	// 更新快速筛选参数
	if (state.quickFilters !== undefined) {
		if (state.quickFilters.length > 0) {
			urlParams.set(URL_PARAMS.QUICK_FILTERS, state.quickFilters.join(','));
		} else {
			urlParams.delete(URL_PARAMS.QUICK_FILTERS);
		}
	}

	// 更新分页参数
	if (state.page !== undefined) {
		if (state.page && state.page > 1) {
			urlParams.set(URL_PARAMS.PAGE, state.page.toString());
		} else {
			urlParams.delete(URL_PARAMS.PAGE);
		}
	}

	// 更新排序参数
	if ('sortColumn' in state) {
		if (state.sortColumn) {
			urlParams.set(URL_PARAMS.SORT_COLUMN, state.sortColumn);
		} else {
			urlParams.delete(URL_PARAMS.SORT_COLUMN);
		}
	}

	if ('sortDirection' in state) {
		if (state.sortDirection) {
			urlParams.set(URL_PARAMS.SORT_DIRECTION, state.sortDirection);
		} else {
			urlParams.delete(URL_PARAMS.SORT_DIRECTION);
		}
	}

	// 更新视图模式
	if (state.view !== undefined) {
		if (state.view && state.view !== 'servers') {
			urlParams.set(URL_PARAMS.VIEW, state.view);
		} else {
			urlParams.delete(URL_PARAMS.VIEW);
		}
	}

	// 更新玩家数据库
	if (state.playerDb !== undefined) {
		if (state.playerDb && state.playerDb !== 'invasion') {
			urlParams.set(URL_PARAMS.PLAYER_DB, state.playerDb);
		} else {
			urlParams.delete(URL_PARAMS.PLAYER_DB);
		}
	}

	// 更新相近账号锚点
	if ('sidAnchor' in state) {
		if (state.sidAnchor) {
			urlParams.set(URL_PARAMS.SID_ANCHOR, state.sidAnchor);
		} else {
			urlParams.delete(URL_PARAMS.SID_ANCHOR);
		}
	}

	// 构建新的URL
	const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;

	// 使用原生History API进行导航，避免触发SvelteKit路由重新渲染
	if (replace) {
		history.replaceState(history.state, '', newUrl);
	} else {
		history.pushState(history.state, '', newUrl);
	}
}

// 清除所有URL参数
export function clearUrlState(): void {
	updateUrlState(
		{
			search: undefined,
			quickFilters: [],
			page: undefined,
			sortColumn: undefined,
			sortDirection: undefined,
			sidAnchor: undefined
		},
		true
	);
}

// 监听URL变化的响应式函数
export function createUrlStateSubscriber(callback: (state: UrlState) => void) {
	if (!browser) return () => {};

	return page.subscribe(($page) => {
		// Guard against undefined url
		if (!$page?.url?.searchParams) {
			return;
		}

		const state: UrlState = {
			search: $page.url.searchParams.get(URL_PARAMS.SEARCH) || undefined,
			quickFilters: $page.url.searchParams.get(URL_PARAMS.QUICK_FILTERS)
				? $page.url.searchParams.get(URL_PARAMS.QUICK_FILTERS)!.split(',').filter(Boolean)
				: [],
			page: $page.url.searchParams.get(URL_PARAMS.PAGE)
				? parseInt($page.url.searchParams.get(URL_PARAMS.PAGE)!, 10)
				: undefined,
			sortColumn: $page.url.searchParams.get(URL_PARAMS.SORT_COLUMN) || undefined,
			sortDirection: $page.url.searchParams.get(URL_PARAMS.SORT_DIRECTION) as
				| 'asc'
				| 'desc'
				| undefined,
			view:
				($page.url.searchParams.get(URL_PARAMS.VIEW) as 'servers' | 'players' | null) || undefined,
			playerDb:
				($page.url.searchParams.get(URL_PARAMS.PLAYER_DB) as PlayerDatabase | null) || undefined,
			sidAnchor: $page.url.searchParams.get(URL_PARAMS.SID_ANCHOR) || undefined
		};
		callback(state);
	});
}
