/**
 * History Filter Utility
 * 
 * Implements 180-day history visibility limit for tasks, events, and other data.
 * Items older than 180 days will be filtered out from views.
 */

const HISTORY_LIMIT_DAYS = 180;

/**
 * Get the cutoff date for history visibility (180 days ago)
 */
export const getHistoryCutoffDate = (): Date => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - HISTORY_LIMIT_DAYS);
  cutoff.setHours(0, 0, 0, 0);
  return cutoff;
};

/**
 * Get the cutoff timestamp as ISO string
 */
export const getHistoryCutoffISO = (): string => {
  return getHistoryCutoffDate().toISOString();
};

/**
 * Check if a date is within the visible history window (last 180 days)
 */
export const isWithinHistoryWindow = (dateString: string | Date): boolean => {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  const cutoff = getHistoryCutoffDate();
  return date >= cutoff;
};

/**
 * Filter an array of items by their date field
 * Only returns items within the last 180 days
 */
export const filterByHistoryWindow = <T extends { [key: string]: unknown }>(
  items: T[],
  dateField: keyof T
): T[] => {
  const cutoff = getHistoryCutoffDate();
  return items.filter((item) => {
    const dateValue = item[dateField];
    if (typeof dateValue !== "string") return true;
    const date = new Date(dateValue);
    return date >= cutoff;
  });
};

/**
 * Filter tasks by their creation date
 */
export const filterTasksByHistory = <T extends { createdAt: string }>(tasks: T[]): T[] => {
  return filterByHistoryWindow(tasks, "createdAt");
};

/**
 * Filter events by their date
 */
export const filterEventsByHistory = <T extends { date: string }>(events: T[]): T[] => {
  return filterByHistoryWindow(events, "date");
};

/**
 * Filter deadlines by their due date
 */
export const filterDeadlinesByHistory = <T extends { dueDate: string }>(deadlines: T[]): T[] => {
  return filterByHistoryWindow(deadlines, "dueDate");
};

/**
 * Filter rewards by their redemption date (only if redeemed)
 */
export const filterRewardsByHistory = <T extends { redeemedAt?: string | null; createdAt: string }>(
  rewards: T[]
): T[] => {
  const cutoff = getHistoryCutoffDate();
  return rewards.filter((reward) => {
    // If redeemed, filter by redemption date
    if (reward.redeemedAt) {
      return new Date(reward.redeemedAt) >= cutoff;
    }
    // If not redeemed, always show (or use createdAt)
    return true;
  });
};

/**
 * Get a human-readable string for the history limit
 */
export const getHistoryLimitDescription = (): string => {
  return `Showing data from the last ${HISTORY_LIMIT_DAYS} days`;
};

/**
 * Check if an item is about to expire from history (within 7 days)
 */
export const isAboutToExpireFromHistory = (dateString: string): boolean => {
  const date = new Date(dateString);
  const cutoff = getHistoryCutoffDate();
  const warningDate = new Date(cutoff);
  warningDate.setDate(warningDate.getDate() + 7);
  return date <= warningDate && date >= cutoff;
};

/**
 * Media Auto-Deletion Policy
 * Media files should be deleted 30 days after the associated event passes
 */
const MEDIA_RETENTION_DAYS = 30;

/**
 * Get the cutoff date for media retention (30 days after event)
 */
export const getMediaRetentionCutoffDate = (eventDate: string | Date): Date => {
  const date = typeof eventDate === "string" ? new Date(eventDate) : eventDate;
  const cutoff = new Date(date);
  cutoff.setDate(cutoff.getDate() + MEDIA_RETENTION_DAYS);
  return cutoff;
};

/**
 * Check if media should be deleted (event date + 30 days has passed)
 */
export const shouldDeleteMedia = (eventDate: string | Date): boolean => {
  const cutoff = getMediaRetentionCutoffDate(eventDate);
  return new Date() >= cutoff;
};

/**
 * Filter media items by their event date + retention period
 */
export const filterMediaByRetention = <T extends { eventDate: string }>(media: T[]): T[] => {
  return media.filter((item) => !shouldDeleteMedia(item.eventDate));
};

/**
 * Get days remaining before media deletion
 */
export const getDaysUntilMediaDeletion = (eventDate: string | Date): number => {
  const cutoff = getMediaRetentionCutoffDate(eventDate);
  const now = new Date();
  const diffMs = cutoff.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};
