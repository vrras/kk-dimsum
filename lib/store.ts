/**
 * Utility functions for store operational logic
 */

// Function to get current date in WIB (UTC+7)
export function getCurrentWIBDate(): Date {
  // Get current UTC time
  const now = new Date();
  // Add 7 hours for WIB
  const wibTime = now.getTime() + (7 * 60 * 60 * 1000);
  return new Date(wibTime);
}

export interface StoreSettings {
  isOpen: boolean;
  openHour: string;
  closeHour: string;
  closedDays: string; // JSON string array of numbers 0-6 (0 = Sunday, 1 = Monday, etc)
}

/**
 * Checks if the store is currently open based on settings and current WIB time
 * @param settings The StoreSettings object containing operational rules
 * @returns boolean True if store is open, false otherwise
 */
export function isStoreOpen(settings: StoreSettings): boolean {
  // 1. Check manual override
  if (!settings.isOpen) {
    return false;
  }

  const nowWIB = getCurrentWIBDate();

  // 2. Check closed days
  try {
    const closedDaysArray: number[] = JSON.parse(settings.closedDays || '[]');
    // getUTCDay() since we've manually adjusted the time by +7 hours above
    const currentDay = nowWIB.getUTCDay(); 
    
    if (closedDaysArray.includes(currentDay)) {
      return false;
    }
  } catch (e) {
    console.error("Error parsing closedDays:", e);
    // Continue checking hours if parsing fails
  }

  // 3. Check operational hours
  const currentHour = nowWIB.getUTCHours();
  const currentMinute = nowWIB.getUTCMinutes();
  const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

  const openTime = settings.openHour || '08:00';
  const closeTime = settings.closeHour || '22:00';

  // Compare times as strings (e.g., "13:30" >= "08:00" && "13:30" <= "22:00")
  if (openTime <= closeTime) {
    // Normal case: open and close on the same day (e.g., 08:00 to 22:00)
    return currentTimeStr >= openTime && currentTimeStr <= closeTime;
  } else {
    // Night shift case: open tonight, close tomorrow morning (e.g., 18:00 to 02:00)
    return currentTimeStr >= openTime || currentTimeStr <= closeTime;
  }
}
