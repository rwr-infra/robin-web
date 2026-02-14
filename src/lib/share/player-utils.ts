import type { IPlayerItem, PlayerDatabase } from '$lib/models/player.model';
import type { Nullable } from '$lib/share/types';
import { XMLParser } from 'fast-xml-parser';

export interface PlayerListResult {
	players: IPlayerItem[];
	hasNext: boolean;
	hasPrevious: boolean;
}

function parseNumber(value: unknown): Nullable<number> {
	// Handle primitive numbers directly
	if (typeof value === 'number') return value;
	if (typeof value === 'string') {
		const trimmed = value.trim();
		if (trimmed === '' || trimmed === '-') {
			return null;
		}
		const parsed = Number(trimmed);
		return isNaN(parsed) ? null : parsed;
	}
	return null;
}

function extractCellText(cell: unknown): string {
	// Handle primitive values directly (number, string, boolean)
	if (typeof cell === 'string') return cell.trim();
	if (typeof cell === 'number') return String(cell);
	if (cell && typeof cell === 'object') {
		const cellRecord = cell as Record<string, unknown>;
		const textNode = cellRecord['#text'];
		if (typeof textNode === 'string') return textNode.trim();
		if (cellRecord.a) {
			// Handle <a href="...">text</a> structure
			const link = cellRecord.a;
			const linkText =
				typeof link === 'object' && link !== null
					? ((link as Record<string, unknown>)['#text'] ?? link)
					: link;
			return typeof linkText === 'string' ? linkText.trim() : '';
		}
		if (cellRecord.img) {
			// Handle cell with <img> tag
			return '';
		}
	}
	return '';
}

function extractImgSrc(cell: unknown): Nullable<string> {
	if (!cell) return null;
	// Handle primitive values
	if (typeof cell !== 'object') return null;
	const img = (cell as Record<string, unknown>).img;
	if (!img) return null;
	if (typeof img !== 'object') return null;
	const imgRecord = img as Record<string, unknown>;
	const src = imgRecord['@_src'] ?? imgRecord.src;
	return typeof src === 'string' ? src : null;
}

function generatePlayerId(username: string, db: PlayerDatabase): string {
	return `${db}:${username}`;
}

// Find pagination links in the HTML to determine if there are more pages
function findPaginationLinks(parsed: unknown): { hasNext: boolean; hasPrevious: boolean } {
	let hasNext = false;
	let hasPrevious = false;

	// Helper function to search for links with "Next" or "Previous" text
	const findLinks = (obj: unknown): void => {
		if (!obj || typeof obj !== 'object') return;
		if (Array.isArray(obj)) {
			for (const item of obj) {
				findLinks(item);
			}
			return;
		}

		const record = obj as Record<string, unknown>;

		// Check if this object is a link element with text content
		if (record.a && typeof record.a === 'object') {
			const links = Array.isArray(record.a) ? record.a : [record.a];
			for (const link of links) {
				const text =
					typeof link === 'object' && link !== null
						? ((link as Record<string, unknown>)['#text'] ?? link)
						: link;
				if (typeof text === 'string') {
					const upperText = text.toUpperCase().trim();
					if (upperText === 'NEXT') {
						hasNext = true;
					} else if (upperText === 'PREVIOUS') {
						hasPrevious = true;
					}
				}
			}
		}

		for (const key in record) {
			if (key === '#text' || key === '#comment') continue;
			findLinks(record[key]);
		}
	};

	findLinks(parsed);
	return { hasNext, hasPrevious };
}

export function parsePlayerListFromString(htmlString: string, db: PlayerDatabase): IPlayerItem[] {
	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: '@_',
		textNodeName: '#text',
		parseAttributeValue: true,
		trimValues: true,
		allowBooleanAttributes: true
	});

	try {
		const parsed = parser.parse(htmlString);
		// The HTML structure is: html > head, html > body > table
		// But the parser might structure it differently
		let table = parsed.html?.body?.table;
		if (!table) {
			table = parsed.table;
		}
		if (!table) {
			table = parsed.html?.table;
		}
		if (!table) {
			table = parsed.body?.table;
		}
		if (!table) {
			// Try to find table anywhere in the parsed structure
			const findTable = (obj: unknown): Record<string, unknown> | null => {
				if (!obj || typeof obj !== 'object') return null;
				if (Array.isArray(obj)) {
					for (const item of obj) {
						const result = findTable(item);
						if (result && Array.isArray(result.tr)) return result;
					}
					return null;
				}
				const record = obj as Record<string, unknown>;
				if (record.tr && Array.isArray(record.tr)) return record;
				for (const key in record) {
					if (key === '#text' || key === '#comment') continue;
					const result = findTable(record[key]);
					if (result && Array.isArray(result.tr)) return result;
				}
				return null;
			};
			table = findTable(parsed);
		}

		if (!table) {
			console.warn('[player-utils] No table found in player list response');
			return [];
		}

		const rows = table.tr;
		if (!rows) {
			console.warn('[player-utils] No rows found in table');
			return [];
		}

		const rowArray = Array.isArray(rows) ? rows : [rows];

		// Filter out header rows (rows with <th> elements)
		const dataRows = rowArray.filter((row: unknown) => {
			if (!row || typeof row !== 'object') {
				return false;
			}
			return !(row as Record<string, unknown>).th;
		});

		return dataRows.map((row: unknown) => {
			const rowRecord = row as Record<string, unknown>;
			const cells = rowRecord.td || [];
			const cellArray = Array.isArray(cells) ? cells : [];

			const rowNumber = Number(extractCellText(cellArray[0])) || 0;
			const username = extractCellText(cellArray[1]) || '';
			const kills = parseNumber(extractCellText(cellArray[2]));
			const deaths = parseNumber(extractCellText(cellArray[3]));
			const score = parseNumber(extractCellText(cellArray[4]));
			const kd = parseNumber(extractCellText(cellArray[5]));
			const timePlayed = extractCellText(cellArray[6]) || null;
			const longestKillStreak = parseNumber(extractCellText(cellArray[7]));
			const targetsDestroyed = parseNumber(extractCellText(cellArray[8]));
			const vehiclesDestroyed = parseNumber(extractCellText(cellArray[9]));
			const soldiersHealed = parseNumber(extractCellText(cellArray[10]));
			const teamkills = parseNumber(extractCellText(cellArray[11]));
			const distanceMoved = extractCellText(cellArray[12]) || null;
			const shotsFired = parseNumber(extractCellText(cellArray[13]));
			const throwablesThrown = parseNumber(extractCellText(cellArray[14]));
			const rankProgression = parseNumber(extractCellText(cellArray[15]));
			const rankName = extractCellText(cellArray[16]) || null;
			const rankIcon = extractImgSrc(cellArray[17]);

			return {
				id: generatePlayerId(username, db),
				username,
				db,
				rowNumber,
				rankProgression,
				kills,
				deaths,
				kd,
				score,
				timePlayed,
				teamkills,
				longestKillStreak,
				targetsDestroyed,
				vehiclesDestroyed,
				soldiersHealed,
				distanceMoved,
				shotsFired,
				throwablesThrown,
				rankName,
				rankIcon
			};
		});
	} catch (error) {
		console.error('Error parsing player list HTML:', error);
		return [];
	}
}

export function parsePlayerListWithPagination(
	htmlString: string,
	db: PlayerDatabase
): PlayerListResult {
	const players = parsePlayerListFromString(htmlString, db);

	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: '@_',
		textNodeName: '#text',
		parseAttributeValue: true,
		trimValues: true,
		allowBooleanAttributes: true
	});

	try {
		const parsed = parser.parse(htmlString);
		const { hasNext, hasPrevious } = findPaginationLinks(parsed);

		return {
			players,
			hasNext,
			hasPrevious
		};
	} catch (error) {
		console.error('Error parsing pagination links:', error);
		return {
			players,
			hasNext: false,
			hasPrevious: false
		};
	}
}
