/**
 * Timezone Utilities Service
 * 
 * Provides UTC conversion functions, display formatting, and timezone list provider
 * using date-fns-tz for IANA timezone support.
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

import { format, parseISO, isValid } from 'date-fns';
import { 
  toZonedTime, 
  fromZonedTime, 
  formatInTimeZone 
} from 'date-fns-tz';

/**
 * Common IANA timezone list with display names
 * Organized by region for easy selection
 */
export interface TimezoneOption {
  value: string;      // IANA timezone identifier
  label: string;      // Human-readable label
  offset: string;     // UTC offset string (e.g., "+05:30")
  region: string;     // Geographic region
}

/**
 * Get the current UTC offset for a timezone
 * @param timezone - IANA timezone identifier
 * @param date - Optional date to calculate offset for (defaults to now)
 * @returns UTC offset string (e.g., "+05:30", "-08:00")
 */
export function getTimezoneOffset(timezone: string, date: Date = new Date()): string {
  try {
    const formatted = formatInTimeZone(date, timezone, 'xxx');
    return formatted;
  } catch {
    return '+00:00';
  }
}

/**
 * Convert a local time in a specific timezone to UTC
 * 
 * @param localDate - The local date/time
 * @param timezone - IANA timezone identifier (e.g., 'Asia/Kolkata')
 * @returns Date object in UTC
 * 
 * Requirements: 3.2 - Store interview times in UTC format internally
 */
export function toUTC(localDate: Date | string, timezone: string): Date {
  const date = typeof localDate === 'string' ? parseISO(localDate) : localDate;
  
  if (!isValid(date)) {
    throw new Error('Invalid date provided');
  }
  
  // fromZonedTime converts a date that represents local time in the given timezone to UTC
  return fromZonedTime(date, timezone);
}

/**
 * Convert a UTC time to a specific timezone
 * 
 * @param utcDate - The UTC date/time
 * @param timezone - IANA timezone identifier (e.g., 'America/New_York')
 * @returns Date object representing the local time in the target timezone
 * 
 * Requirements: 3.3 - Convert UTC to viewer's local timezone for display
 */
export function fromUTC(utcDate: Date | string, timezone: string): Date {
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  
  if (!isValid(date)) {
    throw new Error('Invalid date provided');
  }
  
  // toZonedTime converts a UTC date to the local time in the given timezone
  return toZonedTime(date, timezone);
}

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
export function formatInTimezone(
  date: Date | string, 
  timezone: string, 
  formatStr: string = 'PPpp'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) {
    throw new Error('Invalid date provided');
  }
  
  return formatInTimeZone(dateObj, timezone, formatStr);
}

/**
 * Format date only (without time) in a specific timezone
 * 
 * @param date - The date to format
 * @param timezone - IANA timezone identifier
 * @returns Formatted date string (e.g., "December 23, 2025")
 */
export function formatDateInTimezone(date: Date | string, timezone: string): string {
  return formatInTimezone(date, timezone, 'MMMM d, yyyy');
}

/**
 * Format time only (without date) in a specific timezone
 * 
 * @param date - The date to format
 * @param timezone - IANA timezone identifier
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export function formatTimeInTimezone(date: Date | string, timezone: string): string {
  return formatInTimezone(date, timezone, 'h:mm a');
}

/**
 * Format date and time with timezone abbreviation
 * 
 * @param date - The date to format
 * @param timezone - IANA timezone identifier
 * @returns Formatted string (e.g., "December 23, 2025 at 2:30 PM IST")
 */
export function formatDateTimeWithZone(date: Date | string, timezone: string): string {
  return formatInTimezone(date, timezone, "MMMM d, yyyy 'at' h:mm a zzz");
}

/**
 * Format for email notifications - includes full date, time, and timezone
 * 
 * @param date - The date to format
 * @param timezone - IANA timezone identifier
 * @returns Formatted string suitable for email (e.g., "Tuesday, December 23, 2025 at 2:30 PM (IST)")
 * 
 * Requirements: 3.4 - Include interview time in recipient's timezone in emails
 */
export function formatForEmail(date: Date | string, timezone: string): string {
  return formatInTimezone(date, timezone, "EEEE, MMMM d, yyyy 'at' h:mm a (zzz)");
}

/**
 * Format for calendar display - shorter format
 * 
 * @param date - The date to format
 * @param timezone - IANA timezone identifier
 * @returns Formatted string (e.g., "Dec 23, 2:30 PM")
 */
export function formatForCalendar(date: Date | string, timezone: string): string {
  return formatInTimezone(date, timezone, 'MMM d, h:mm a');
}

/**
 * Get ISO string representation of a date in a specific timezone
 * Useful for API responses
 * 
 * @param date - The date
 * @param timezone - IANA timezone identifier
 * @returns ISO 8601 formatted string with timezone offset
 */
export function toISOStringInTimezone(date: Date | string, timezone: string): string {
  return formatInTimezone(date, timezone, "yyyy-MM-dd'T'HH:mm:ssxxx");
}

/**
 * Check if a timezone identifier is valid
 * 
 * @param timezone - IANA timezone identifier to validate
 * @returns true if valid, false otherwise
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    // Attempt to format a date in the timezone - will throw if invalid
    formatInTimeZone(new Date(), timezone, 'z');
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the user's browser/system timezone
 * Falls back to UTC if detection fails
 * 
 * @returns IANA timezone identifier
 */
export function getSystemTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}


/**
 * Comprehensive list of common IANA timezones
 * Organized by region with display labels and UTC offsets
 * 
 * Requirements: 3.1 - Allow selection of timezone from standard timezone list (IANA format)
 */
export const TIMEZONE_LIST: TimezoneOption[] = [
  // UTC
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: '+00:00', region: 'UTC' },
  
  // Americas - North
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)', offset: '-05:00', region: 'Americas' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)', offset: '-06:00', region: 'Americas' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)', offset: '-07:00', region: 'Americas' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)', offset: '-08:00', region: 'Americas' },
  { value: 'America/Anchorage', label: 'Alaska', offset: '-09:00', region: 'Americas' },
  { value: 'America/Phoenix', label: 'Arizona', offset: '-07:00', region: 'Americas' },
  { value: 'America/Toronto', label: 'Toronto', offset: '-05:00', region: 'Americas' },
  { value: 'America/Vancouver', label: 'Vancouver', offset: '-08:00', region: 'Americas' },
  { value: 'America/Edmonton', label: 'Edmonton', offset: '-07:00', region: 'Americas' },
  { value: 'America/Winnipeg', label: 'Winnipeg', offset: '-06:00', region: 'Americas' },
  { value: 'America/Halifax', label: 'Halifax', offset: '-04:00', region: 'Americas' },
  { value: 'America/St_Johns', label: 'Newfoundland', offset: '-03:30', region: 'Americas' },
  
  // Americas - Central & South
  { value: 'America/Mexico_City', label: 'Mexico City', offset: '-06:00', region: 'Americas' },
  { value: 'America/Bogota', label: 'Bogota', offset: '-05:00', region: 'Americas' },
  { value: 'America/Lima', label: 'Lima', offset: '-05:00', region: 'Americas' },
  { value: 'America/Santiago', label: 'Santiago', offset: '-03:00', region: 'Americas' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires', offset: '-03:00', region: 'Americas' },
  { value: 'America/Sao_Paulo', label: 'Sao Paulo', offset: '-03:00', region: 'Americas' },
  { value: 'America/Caracas', label: 'Caracas', offset: '-04:00', region: 'Americas' },
  
  // Europe
  { value: 'Europe/London', label: 'London', offset: '+00:00', region: 'Europe' },
  { value: 'Europe/Dublin', label: 'Dublin', offset: '+00:00', region: 'Europe' },
  { value: 'Europe/Lisbon', label: 'Lisbon', offset: '+00:00', region: 'Europe' },
  { value: 'Europe/Paris', label: 'Paris', offset: '+01:00', region: 'Europe' },
  { value: 'Europe/Berlin', label: 'Berlin', offset: '+01:00', region: 'Europe' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam', offset: '+01:00', region: 'Europe' },
  { value: 'Europe/Brussels', label: 'Brussels', offset: '+01:00', region: 'Europe' },
  { value: 'Europe/Madrid', label: 'Madrid', offset: '+01:00', region: 'Europe' },
  { value: 'Europe/Rome', label: 'Rome', offset: '+01:00', region: 'Europe' },
  { value: 'Europe/Vienna', label: 'Vienna', offset: '+01:00', region: 'Europe' },
  { value: 'Europe/Zurich', label: 'Zurich', offset: '+01:00', region: 'Europe' },
  { value: 'Europe/Stockholm', label: 'Stockholm', offset: '+01:00', region: 'Europe' },
  { value: 'Europe/Oslo', label: 'Oslo', offset: '+01:00', region: 'Europe' },
  { value: 'Europe/Copenhagen', label: 'Copenhagen', offset: '+01:00', region: 'Europe' },
  { value: 'Europe/Helsinki', label: 'Helsinki', offset: '+02:00', region: 'Europe' },
  { value: 'Europe/Athens', label: 'Athens', offset: '+02:00', region: 'Europe' },
  { value: 'Europe/Bucharest', label: 'Bucharest', offset: '+02:00', region: 'Europe' },
  { value: 'Europe/Kiev', label: 'Kyiv', offset: '+02:00', region: 'Europe' },
  { value: 'Europe/Moscow', label: 'Moscow', offset: '+03:00', region: 'Europe' },
  { value: 'Europe/Istanbul', label: 'Istanbul', offset: '+03:00', region: 'Europe' },
  
  // Asia
  { value: 'Asia/Dubai', label: 'Dubai', offset: '+04:00', region: 'Asia' },
  { value: 'Asia/Karachi', label: 'Karachi', offset: '+05:00', region: 'Asia' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (Kolkata)', offset: '+05:30', region: 'Asia' },
  { value: 'Asia/Colombo', label: 'Sri Lanka', offset: '+05:30', region: 'Asia' },
  { value: 'Asia/Kathmandu', label: 'Kathmandu', offset: '+05:45', region: 'Asia' },
  { value: 'Asia/Dhaka', label: 'Dhaka', offset: '+06:00', region: 'Asia' },
  { value: 'Asia/Yangon', label: 'Yangon', offset: '+06:30', region: 'Asia' },
  { value: 'Asia/Bangkok', label: 'Bangkok', offset: '+07:00', region: 'Asia' },
  { value: 'Asia/Jakarta', label: 'Jakarta', offset: '+07:00', region: 'Asia' },
  { value: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh City', offset: '+07:00', region: 'Asia' },
  { value: 'Asia/Singapore', label: 'Singapore', offset: '+08:00', region: 'Asia' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong', offset: '+08:00', region: 'Asia' },
  { value: 'Asia/Taipei', label: 'Taipei', offset: '+08:00', region: 'Asia' },
  { value: 'Asia/Shanghai', label: 'Shanghai', offset: '+08:00', region: 'Asia' },
  { value: 'Asia/Manila', label: 'Manila', offset: '+08:00', region: 'Asia' },
  { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur', offset: '+08:00', region: 'Asia' },
  { value: 'Asia/Seoul', label: 'Seoul', offset: '+09:00', region: 'Asia' },
  { value: 'Asia/Tokyo', label: 'Tokyo', offset: '+09:00', region: 'Asia' },
  
  // Middle East
  { value: 'Asia/Jerusalem', label: 'Jerusalem', offset: '+02:00', region: 'Middle East' },
  { value: 'Asia/Beirut', label: 'Beirut', offset: '+02:00', region: 'Middle East' },
  { value: 'Asia/Baghdad', label: 'Baghdad', offset: '+03:00', region: 'Middle East' },
  { value: 'Asia/Kuwait', label: 'Kuwait', offset: '+03:00', region: 'Middle East' },
  { value: 'Asia/Riyadh', label: 'Riyadh', offset: '+03:00', region: 'Middle East' },
  { value: 'Asia/Tehran', label: 'Tehran', offset: '+03:30', region: 'Middle East' },
  
  // Australia & Pacific
  { value: 'Australia/Perth', label: 'Perth', offset: '+08:00', region: 'Australia & Pacific' },
  { value: 'Australia/Darwin', label: 'Darwin', offset: '+09:30', region: 'Australia & Pacific' },
  { value: 'Australia/Adelaide', label: 'Adelaide', offset: '+09:30', region: 'Australia & Pacific' },
  { value: 'Australia/Brisbane', label: 'Brisbane', offset: '+10:00', region: 'Australia & Pacific' },
  { value: 'Australia/Sydney', label: 'Sydney', offset: '+10:00', region: 'Australia & Pacific' },
  { value: 'Australia/Melbourne', label: 'Melbourne', offset: '+10:00', region: 'Australia & Pacific' },
  { value: 'Australia/Hobart', label: 'Hobart', offset: '+10:00', region: 'Australia & Pacific' },
  { value: 'Pacific/Auckland', label: 'Auckland', offset: '+12:00', region: 'Australia & Pacific' },
  { value: 'Pacific/Fiji', label: 'Fiji', offset: '+12:00', region: 'Australia & Pacific' },
  { value: 'Pacific/Guam', label: 'Guam', offset: '+10:00', region: 'Australia & Pacific' },
  { value: 'Pacific/Honolulu', label: 'Hawaii', offset: '-10:00', region: 'Australia & Pacific' },
  
  // Africa
  { value: 'Africa/Cairo', label: 'Cairo', offset: '+02:00', region: 'Africa' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg', offset: '+02:00', region: 'Africa' },
  { value: 'Africa/Lagos', label: 'Lagos', offset: '+01:00', region: 'Africa' },
  { value: 'Africa/Nairobi', label: 'Nairobi', offset: '+03:00', region: 'Africa' },
  { value: 'Africa/Casablanca', label: 'Casablanca', offset: '+01:00', region: 'Africa' },
];

/**
 * Get all available timezones
 * 
 * @returns Array of timezone options
 */
export function getTimezoneList(): TimezoneOption[] {
  // Update offsets dynamically based on current date (for DST)
  const now = new Date();
  return TIMEZONE_LIST.map(tz => ({
    ...tz,
    offset: getTimezoneOffset(tz.value, now)
  }));
}

/**
 * Get timezones grouped by region
 * 
 * @returns Object with regions as keys and timezone arrays as values
 */
export function getTimezonesByRegion(): Record<string, TimezoneOption[]> {
  const timezones = getTimezoneList();
  return timezones.reduce((acc, tz) => {
    if (!acc[tz.region]) {
      acc[tz.region] = [];
    }
    acc[tz.region].push(tz);
    return acc;
  }, {} as Record<string, TimezoneOption[]>);
}

/**
 * Search timezones by label or value
 * 
 * @param query - Search query string
 * @returns Filtered array of timezone options
 */
export function searchTimezones(query: string): TimezoneOption[] {
  const lowerQuery = query.toLowerCase();
  return getTimezoneList().filter(tz => 
    tz.label.toLowerCase().includes(lowerQuery) ||
    tz.value.toLowerCase().includes(lowerQuery) ||
    tz.region.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get a timezone option by its IANA identifier
 * 
 * @param timezone - IANA timezone identifier
 * @returns TimezoneOption or undefined if not found
 */
export function getTimezoneByValue(timezone: string): TimezoneOption | undefined {
  return getTimezoneList().find(tz => tz.value === timezone);
}

/**
 * Get display label for a timezone
 * 
 * @param timezone - IANA timezone identifier
 * @returns Display label or the timezone value if not found
 */
export function getTimezoneLabel(timezone: string): string {
  const tz = getTimezoneByValue(timezone);
  return tz ? tz.label : timezone;
}

/**
 * Calculate the time difference between two timezones
 * 
 * @param timezone1 - First IANA timezone identifier
 * @param timezone2 - Second IANA timezone identifier
 * @param date - Optional date to calculate for (defaults to now)
 * @returns Difference in hours (positive if timezone1 is ahead)
 */
export function getTimezoneDifference(
  timezone1: string, 
  timezone2: string, 
  date: Date = new Date()
): number {
  const time1 = toZonedTime(date, timezone1);
  const time2 = toZonedTime(date, timezone2);
  return (time1.getTime() - time2.getTime()) / (1000 * 60 * 60);
}

// TimezoneOption is already exported at the top of the file
