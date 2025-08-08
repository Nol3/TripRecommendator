/**
 * Visit Tracking Utility
 * Helper functions for tracking user visits to places using localStorage
 */

/**
 * Retrieves the list of visited places for a specific username
 * @param {string} username - The username to get visits for
 * @returns {Array} Array of visited place objects
 */
function getVisited(username) { 
  return JSON.parse(localStorage.getItem('visited:'+username) || '[]'); 
}

/**
 * Saves the visited places array to localStorage for a specific username
 * @param {string} username - The username to save visits for
 * @param {Array} arr - Array of visited place objects to save
 */
function saveVisited(username, arr) { 
  localStorage.setItem('visited:'+username, JSON.stringify(arr)); 
}

/**
 * Tracks a visit to a place for a specific username
 * Avoids duplicate entries by checking if the place ID already exists
 * @param {string} username - The username to track the visit for
 * @param {Object} placeObj - The place object to track (must have an 'id' property)
 */
// eslint-disable-next-line no-unused-vars
function trackVisit(username, placeObj) {
  const list = getVisited(username);
  if (!list.find(p => p.id === placeObj.id)) {   // avoid duplicates
    list.push({...placeObj, ts: Date.now()});
    saveVisited(username, list);
  }
}
