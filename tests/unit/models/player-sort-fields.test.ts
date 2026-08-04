import { describe, test, expect } from 'vitest';
import {
	PLAYER_SORT_FIELDS,
	SID_SORT_FIELD,
	isPlayerSortField,
	toPlayerSortField
} from '$lib/models/player.model';

describe('player sort fields', () => {
	test('should include the undocumented sid field', () => {
		expect(PLAYER_SORT_FIELDS).toContain('sid');
		expect(SID_SORT_FIELD).toBe('sid');
	});

	describe('isPlayerSortField', () => {
		test('should accept every known field', () => {
			for (const field of PLAYER_SORT_FIELDS) {
				expect(isPlayerSortField(field)).toBe(true);
			}
		});

		test('should reject unknown values', () => {
			// Upstream answers with an empty table for these, so they must never be sent
			expect(isPlayerSortField('garbage')).toBe(false);
			expect(isPlayerSortField('SID')).toBe(false);
			expect(isPlayerSortField('')).toBe(false);
			expect(isPlayerSortField(undefined)).toBe(false);
			expect(isPlayerSortField(null)).toBe(false);
			expect(isPlayerSortField(42)).toBe(false);
		});
	});

	describe('toPlayerSortField', () => {
		test('should convert camelCase column keys to snake_case fields', () => {
			expect(toPlayerSortField('rankProgression')).toBe('rank_progression');
			expect(toPlayerSortField('longestKillStreak')).toBe('longest_kill_streak');
			expect(toPlayerSortField('kills')).toBe('kills');
		});

		test('should pass sid through unchanged', () => {
			expect(toPlayerSortField('sid')).toBe('sid');
		});

		test('should return undefined for keys the player API cannot sort by', () => {
			// Server table columns can reach here through the shared `sort` URL parameter
			expect(toPlayerSortField('totalPlayers')).toBeUndefined();
			expect(toPlayerSortField('ipAddress')).toBeUndefined();
			expect(toPlayerSortField('name')).toBeUndefined();
			expect(toPlayerSortField('rankName')).toBeUndefined();
		});
	});
});
