export const roundDownToNearestXMinutes = (date: Date, x: number): Date => {
    const ms = date.getTime();
    const roundedMs = Math.round(ms / (x * 60 * 1000)) * (x * 60 * 1000);
    return new Date(roundedMs);
}

export const isMultipleOfXMinutes = (ms: number, x: number): boolean => {
    return (ms % (x * 60 * 1000)) === 0;
}

export const formatDateToISO = (date: Date): string => {
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}

export const formatDateToHHMM = (date: Date): string => {
    return date.toISOString().split('T')[1].substring(0, 5); // Returns HH:MM
}

export const formatDateToHHMMWithDay = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    };
    return date.toLocaleTimeString('en-GB', options); // Returns e.g. "Mon, 14:30"
}

export const formatDateToHHMMWithDayAndMonth = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    };
    return date.toLocaleString('en-GB', options); // Returns e.g. "Mon, Jan 1, 14:30"
}