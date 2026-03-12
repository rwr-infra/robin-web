import { request } from '$lib/request';
import type { RequestOptions } from '$lib/request';
import type { IDisplayServerItem } from '$lib/models/server.model';
import { parseServerListFromString } from '$lib/share/utils';

const SERVER_API_URL = '/api';

interface IServerListParams {
	start: number;
	size: number;
	names: 1 | 0;
	timeout?: number;
}

interface IServerService {
	list(params?: IServerListParams): Promise<IDisplayServerItem[]>;
	listAll(options?: { timeout?: number }): Promise<IDisplayServerItem[]>;
}

export const ServerService: IServerService = {
	async list(params) {
		const queryParams = {
			start: params?.start ?? 0,
			size: params?.size ?? 20,
			names: params?.names ?? 1
		};

		const reqUrl = `${SERVER_API_URL}/server_list?start=${queryParams.start}&size=${queryParams.size}&names=${queryParams.names}`;

		// Pass timeout if provided
		const requestOptions: RequestOptions = {};
		if (params?.timeout) {
			requestOptions.timeout = params.timeout;
		}

		try {
			// Add a timestamp to prevent caching
			const timestampedUrl = `${reqUrl}&_t=${Date.now()}`;
			const data = await request<string>(timestampedUrl, requestOptions, 'text');
			return parseServerListFromString(data);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(`Error fetching server list: ${message}`);
			// Rethrow the error to allow proper handling in listAll
			throw error;
		}
	},

	async listAll(options = {}) {
		const getErrorMessage = (error: unknown): string =>
			error instanceof Error ? error.message : String(error);

		let start = 0;
		const size = 100;
		const totalServerList: IDisplayServerItem[] = [];
		let hasMoreData = true;
		const requestTimeout = options.timeout || 20000; // Default timeout for each request

		// Maximum number of batches to try (to prevent infinite loops)
		const MAX_BATCHES = 10;
		let batchCount = 0;
		let lastError: unknown = null;

		try {
			while (hasMoreData && batchCount < MAX_BATCHES) {
				batchCount++;

				try {
					// Use Promise.race to implement a timeout for each batch
					const newServerList = await ServerService.list({
						start,
						size,
						names: 1,
						timeout: requestTimeout
					});

					if (newServerList.length === 0) {
						// No more data to fetch
						hasMoreData = false;
					} else {
						totalServerList.push(...newServerList);
						start += size;

						// If we got fewer items than requested, we've reached the end
						if (newServerList.length < size) {
							hasMoreData = false;
						}
					}
				} catch (error: unknown) {
					lastError = error;
					const message = getErrorMessage(error);
					console.error(`Error in batch ${batchCount}: ${message}`);
					// Stop fetching more data on error
					hasMoreData = false;
				}
			}

			// If we have data but also encountered an error, log a warning but return the data we have
			if (lastError && totalServerList.length > 0) {
				console.warn(
					`Returning ${totalServerList.length} servers despite error: ${getErrorMessage(lastError)}`
				);
			}

			// If we have no data and encountered an error, throw the error
			if (lastError && totalServerList.length === 0) {
				throw lastError;
			}

			return totalServerList;
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(`Error in listAll: ${message}`);
			// Return whatever data we managed to collect before the error
			return totalServerList;
		}
	}
};
