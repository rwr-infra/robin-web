const BASE_URL = import.meta.env.VITE_API_URL || '';

type ResponseType = 'json' | 'text';

export interface RequestOptions extends RequestInit {
	timeout?: number;
}

// Default timeout increased to 20 seconds to give more time for API response
export async function request<T>(
	url: string,
	options: RequestOptions = {},
	responseType: ResponseType = 'json',
	timeout: number = 20000
): Promise<T> {
	const controller = new AbortController();
	const { signal } = controller;
	const fetchOptions = { ...options, signal };

	// Use options.timeout if provided, otherwise use the default timeout
	const effectiveTimeout = options.timeout !== undefined ? options.timeout : timeout;

	const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);

	try {
		const res = await fetch(BASE_URL + url, fetchOptions);

		if (!res.ok) {
			// Log the error details for debugging
			console.error(`HTTP error ${res.status}: ${res.statusText} for ${url}`);
			throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
		}

		let response: T;

		if (responseType === 'json') {
			response = await res.json();
		} else {
			response = (await res.text()) as T;
		}

		return response;
	} catch (error: unknown) {
		// Enhanced error logging
		if (error instanceof Error && error.name === 'AbortError') {
			console.error(`Request to ${url} timed out after ${effectiveTimeout}ms`);
			throw new Error(`Request timed out after ${effectiveTimeout}ms`);
		} else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
			// Network errors like CORS, network disconnection
			console.error(`Network error for ${url}: ${error.message}`);
			throw new Error(`Network error: ${error.message}`);
		} else {
			console.error(`Error fetching ${url}:`, error);
			throw error;
		}
	} finally {
		clearTimeout(timeoutId);
	}
}
