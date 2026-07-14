import { request } from '$lib/request';
import type { IAnnouncement } from '$lib/models/announcement.model';

const ANNOUNCEMENT_API_URL = '/api';

interface IAnnouncementService {
	get(): Promise<IAnnouncement>;
}

export const AnnouncementService: IAnnouncementService = {
	async get() {
		// Add a timestamp to prevent caching, mirroring the server list service
		const url = `${ANNOUNCEMENT_API_URL}/announcement?_t=${Date.now()}`;
		return request<IAnnouncement>(url, {}, 'json');
	}
};
