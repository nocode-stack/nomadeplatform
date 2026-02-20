
// Business days utility functions for production scheduling

/**
 * Check if a date is a weekday (Monday-Friday)
 */
export const isWeekday = (date: Date): boolean => {
  const day = date.getDay();
  return day >= 1 && day <= 5; // Monday = 1, Friday = 5
};

/**
 * Get the next weekday from a given date
 * If the date is already a weekday, returns the same date
 */
export const getNextWeekday = (date: Date): Date => {
  const newDate = new Date(date);
  while (!isWeekday(newDate)) {
    newDate.setDate(newDate.getDate() + 1);
  }
  return newDate;
};

/**
 * Get the previous weekday from a given date
 * If the date is already a weekday, returns the same date
 */
export const getPreviousWeekday = (date: Date): Date => {
  const newDate = new Date(date);
  while (!isWeekday(newDate)) {
    newDate.setDate(newDate.getDate() - 1);
  }
  return newDate;
};

/**
 * Add business days to a date (excluding weekends)
 */
export const addBusinessDays = (startDate: Date, businessDays: number): Date => {
  const result = new Date(startDate);
  let daysToAdd = businessDays;
  
  while (daysToAdd > 0) {
    result.setDate(result.getDate() + 1);
    if (isWeekday(result)) {
      daysToAdd--;
    }
  }
  
  return result;
};

/**
 * Calculate business days between two dates (excluding weekends)
 */
export const getBusinessDaysBetween = (startDate: Date, endDate: Date): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let businessDays = 0;
  
  const current = new Date(start);
  while (current <= end) {
    if (isWeekday(current)) {
      businessDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return businessDays;
};

/**
 * Format date to YYYY-MM-DD string
 */
export const formatDateForInput = (date: Date | string): string => {
  if (typeof date === 'string') {
    return date;
  }
  return date.toISOString().split('T')[0];
};

/**
 * Get next weekday as formatted string for date input
 */
export const getNextWeekdayString = (dateString?: string): string => {
  const today = dateString ? new Date(dateString) : new Date();
  const nextWeekday = getNextWeekday(today);
  return formatDateForInput(nextWeekday);
};
