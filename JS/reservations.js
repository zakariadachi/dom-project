// Seats 1 to 4 are VIP
export function isVIP(seat) {
    return seat >= 1 && seat <= 4;
}

// VIP seats cost 10% more
export function seatPrice(basePrice, seat) {
    if (isVIP(seat)) {
        return Math.round(basePrice * 1.1);
    }
    return basePrice;
}

// Number of free seats on a trip
export function freeSeats(trip) {
    return trip.capacity - trip.reservations.length;
}

// Is the trip fully booked?
export function isFull(trip) {
    return freeSeats(trip) === 0;
}

// Total revenue: sum of each reservation's seat price
export function totalRevenue(trip) {
    let total = 0;
    for (let i = 0; i < trip.reservations.length; i++) {
        total += seatPrice(trip.price, trip.reservations[i].seat);
    }
    return total;
}

// Find the first free non-VIP seat (seats 5+), fallback to any free seat
export function firstFreeNonVIP(trip) {
    const takenSeats = [];
    for (let i = 0; i < trip.reservations.length; i++) {
        takenSeats.push(trip.reservations[i].seat);
    }

    // Try non-VIP seats first (5 to 20)
    for (let s = 5; s <= trip.capacity; s++) {
        if (!takenSeats.includes(s)) {
            return s;
        }
    }
    // Fallback: any free seat (1 to 4)
    for (let s = 1; s <= trip.capacity; s++) {
        if (!takenSeats.includes(s)) {
            return s;
        }
    }
    return null;
}

// Add a new reservation (auto-assign seat if none given)
export function addReservation(trip, name, phone, seat) {
    const assignedSeat = seat ? seat : firstFreeNonVIP(trip);
    const newReservation = { seat: assignedSeat, name: name, phone: phone };
    const newReservations = trip.reservations.concat([newReservation]);
    return { ...trip, reservations: newReservations };
}

// Update an existing reservation (change name, phone, or seat)
export function modifyReservation(trip, oldSeat, name, phone, newSeat) {
    const newReservations = [];
    for (let i = 0; i < trip.reservations.length; i++) {
        const r = trip.reservations[i];
        if (r.seat === oldSeat) {
            newReservations.push({ seat: newSeat, name: name, phone: phone });
        } else {
            newReservations.push(r);
        }
    }
    return { ...trip, reservations: newReservations };
}

// Cancel a reservation; if someone is waiting, they get the freed seat
export function cancelReservation(trip, seat) {
    // Remove the reservation
    const newReservations = [];
    for (let i = 0; i < trip.reservations.length; i++) {
        if (trip.reservations[i].seat !== seat) {
            newReservations.push(trip.reservations[i]);
        }
    }

    let newWaitingList = trip.waitingList.slice(); // copy

    // If someone is waiting, promote the first person
    if (newWaitingList.length > 0) {
        const [first, ...rest] = newWaitingList;
        newReservations.push({ seat: seat, name: first.name, phone: first.phone });
        newWaitingList = rest;
    }

    return { ...trip, reservations: newReservations, waitingList: newWaitingList };
}

// Add a passenger to the waiting list
export function addToWaitingList(trip, name, phone) {
    const newWaitingList = trip.waitingList.concat([{ name: name, phone: phone }]);
    return { ...trip, waitingList: newWaitingList };
}

// Remove a passenger from the waiting list by index
export function removeFromWaitingList(trip, index) {
    const newWaitingList = [];
    for (let i = 0; i < trip.waitingList.length; i++) {
        if (i !== index) {
            newWaitingList.push(trip.waitingList[i]);
        }
    }
    return { ...trip, waitingList: newWaitingList };
}
