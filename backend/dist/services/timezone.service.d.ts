/**
 * Timezone Utilities Service
 *
 * Provides UTC conversion functions, display formatting, and timezone list provider
 * using date-fns-tz for IANA timezone support.
 *
 * Requirements: 3.1, 3.2, 3.3
 */
/**
 * Common IANA timezone list with display names
 * Organized by region for easy selection
 */
export interface TimezoneOption {
    value: string;
    label: string;
    offset: string;
    region: string;
}
/**
 * Get the current UTC offset for a timezone
 * @param timezone - IANA timezone identifier
 * @param date - Optional date to calculate offset for (defaults to now)
 * @returns UTC offset string (e.g., "+05:30", "-08:00")
 */
export declare function getTimezoneOffset(timezone: string, date?: Date): string;
/**
 * Convert a local time in a specific timezone to UTC
 *
 * @param localDate - The local date/time
 * @param timezone - IANA timezone identifier (e.g., 'Asia/Kolkata')
 * @returns Date object in UTC
 *
 * Requirements: 3.2 - Store interview times in UTC format internally
 */
export declare function toUTC(localDate: Date | string, timezone: string): Date;
/**
 * Convert a UTC time to a specific timezone
 *
 * @param utcDate - The UTC date/time
 * @param timezone - IANA timezone identifier (e.g., 'America/New_York')
 * @returns Date object representing the local time in the target timezone
 *
 * Requirements: 3.3 - Convert UTC to viewer's local timezone for display
 */
export declare function fromUTC(utcDate: Date | string, timezone: string): Date;
/**
 * Format a date for display in a specific timezone
 *
 * @param date - The date to format (assumed to be in UTC)
 * @param timezone - IANA timezone identifier
 * @param formatStr - date-fns format string (default: 'PPpp' for full date and time)
 * @returns Formatted date string in the target timezone
 *
 * Requirements: 3.3, 3.4 - Display times in recipient's timezone
 */
export declare function formatInTimezone(date: Date | string, timezone: string, formatStr?: string): string;
/**
 * Format date only (without time) in a specific timezone
 *
 * @param date - The date to format
 * @param timezone - IANA timezone identifier
 * @returns Formatted date string (e.g., "December 23, 2025")
 */
export declare function formatDateInTimezone(date: Date | string, timezone: string): string;
/**
 * Format time only (without date) in a specific timezone
 *
 * @param date - The date to format
 * @param timezone - IANA timezone identifier
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export declare function formatTimeInTimezone(date: Date | string, timezone: string): string;
/**
 * Format date and time with timezone abbreviation
 *
 * @param date - The date to format
 * @param timezone - IANA timezone identifier
 * @returns Formatted string (e.g., "December 23, 2025 at 2:30 PM IST")
 */
export declare function formatDateTimeWithZone(date: Date | string, timezone: string): string;
/**
 * Format for email notifications - includes full date, time, and timezone
 *
 * @param date - The date to format
 * @param timezone - IANA timezone identifier
 * @returns Formatted string suitable for email (e.g., "Tuesday, December 23, 2025 at 2:30 PM (IST)")
 *
 * Requirements: 3.4 - Include interview time in recipient's timezone in emails
 */
export declare function formatForEmail(date: Date | string, timezone: string): string;
/**
 * Format for calendar display - shorter format
 *
 * @param date - The date to format
 * @param timezone - IANA timezone identifier
 * @returns Formatted string (e.g., "Dec 23, 2:30 PM")
 */
export declare function formatForCalendar(date: Date | string, timezone: string): string;
/**
 * Get ISO string representation of a date in a specific timezone
 * Useful for API responses
 *
 * @param date - The date
 * @param timezone - IANA timezone identifier
 * @returns ISO 8601 formatted string with timezone offset
 */
export declare function toISOStringInTimezone(date: Date | string, timezone: string): string;
/**
 * Check if a timezone identifier is valid
 *
 * @param timezone - IANA timezone identifier to validate
 * @returns true if valid, false otherwise
 */
export declare function isValidTimezone(timezone: string): boolean;
/**
 * Get the user's browser/system timezone
 * Falls back to UTC if detection fails
 *
 * @returns IANA timezone identifier
 */
export declare function getSystemTimezone(): string;
/**
 * Comprehensive list of common IANA timezones
 * Organized by region with display labels and UTC offsets
 *
 * Requirements: 3.1 - Allow selection of timezone from standard timezone list (IANA format)
 */
export declare const TIMEZONE_LIST: TimezoneOption[];
/**
 * Get all available timezones
 *
 * @returns Array of timezone options
 */
export declare function getTimezoneList(): TimezoneOption[];
/**
 * Get timezones grouped by region
 *
 * @returns Object with regions as keys and timezone arrays as values
 */
export declare function getTimezonesByRegion(): Record<string, TimezoneOption[]>;
/**
 * Search timezones by label or value
 *
 * @param query - Search query string
 * @returns Filtered array of timezone options
 */
export declare function searchTimezones(query: string): TimezoneOption[];
/**
 * Get a timezone option by its IANA identifier
 *
 * @param timezone - IANA timezone identifier
 * @returns TimezoneOption or undefined if not found
 */
export declare function getTimezoneByValue(timezone: string): TimezoneOption | undefined;
/**
 * Get display label for a timezone
 *
 * @param timezone - IANA timezone identifier
 * @returns Display label or the timezone value if not found
 */
export declare function getTimezoneLabel(timezone: string): string;
/**
 * Calculate the time difference between two timezones
 *
 * @param timezone1 - First IANA timezone identifier
 * @param timezone2 - Second IANA timezone identifier
 * @param date - Optional date to calculate for (defaults to now)
 * @returns Difference in hours (positive if timezone1 is ahead)
 */
export declare function getTimezoneDifference(timezone1: string, timezone2: string, date?: Date): number;
//# sourceMappingURL=timezone.service.d.ts.map