/**
* Centralized browser storage utilities.
* Handles JSON data safely in localStorage.
*/
 
export function isStorageAvailable() {
  if (typeof window === "undefined") {
    return false;
  }
 
  try {
    const testKey = "__promo_roi_storage_test__";
 
    window.localStorage.setItem(testKey, "true");
    window.localStorage.removeItem(testKey);
 
    return true;
  } catch (error) {
    console.error("Browser storage is unavailable:", error);
    return false;
  }
}
 
/**
* Read and parse data from localStorage.
*/
export function readStorage(key, fallbackValue = null) {
  if (typeof window === "undefined" || !key) {
    return fallbackValue;
  }
 
  try {
    const storedValue = window.localStorage.getItem(key);
 
    if (storedValue === null) {
      return fallbackValue;
    }
 
    return JSON.parse(storedValue);
  } catch (error) {
    console.error(`Unable to read storage key "${key}":`, error);
    return fallbackValue;
  }
}
 
/**
* Convert data to JSON and save it in localStorage.
*/
export function writeStorage(key, value) {
  if (typeof window === "undefined" || !key) {
    return false;
  }
 
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Unable to save storage key "${key}":`, error);
    return false;
  }
}
 
/**
* Remove data from localStorage.
*/
export function removeStorage(key) {
  if (typeof window === "undefined" || !key) {
    return false;
  }
 
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Unable to remove storage key "${key}":`, error);
    return false;
  }
}