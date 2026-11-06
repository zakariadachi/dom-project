const STORAGE_KEY = 'busdirect_trips';

// Load trips: from localStorage if saved, otherwise fetch the JSON file
export async function loadTrips() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        return JSON.parse(saved);
    }
    const response = await fetch('./data/trips.json');
    const data = await response.json();
    saveTrips(data);
    return data;
}

// Save the full trips array to localStorage
export function saveTrips(trips) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

// Find one trip by its id
export function getTrip(trips, id) {
    for (let i = 0; i < trips.length; i++) {
        if (trips[i].id === id) {
            return trips[i];
        }
    }
    return null;
}

// Replace the old version of a trip with the updated one, then save
export function updateTrip(trips, updatedTrip) {
    const newTrips = [];
    for (let i = 0; i < trips.length; i++) {
        if (trips[i].id === updatedTrip.id) {
            newTrips.push(updatedTrip);
        } else {
            newTrips.push(trips[i]);
        }
    }
    saveTrips(newTrips);
    return newTrips;
}
