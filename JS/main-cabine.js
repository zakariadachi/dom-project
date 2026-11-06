import { loadTrips, updateTrip, getTrip } from './store.js';
import { validateName, validatePhone } from './validators.js';
import {
    isFull, seatPrice,
    addReservation, modifyReservation, cancelReservation,
    addToWaitingList, removeFromWaitingList
} from './reservations.js';
import {
    showMessage, renderSeatGrid, renderStats, renderTripHeader,
    renderPassengerSelects, renderWaitingList
} from './render.js';

// Read the trip id from the URL: cabine.html?id=2
const params = new URLSearchParams(window.location.search);
const tripId = Number(params.get('id'));

let trips = [];

// Always get the latest version of the current trip
function currentTrip() {
    return getTrip(trips, tripId);
}

// Re-draw everything on the page after any change
function refresh() {
    const trip = currentTrip();

    renderSeatGrid(trip, function (seatNumber) {
        document.getElementById('seatInput').value = seatNumber;
    });

    renderStats(trip);
    renderPassengerSelects(trip);

    renderWaitingList(trip, function (index) {
        trips = updateTrip(trips, removeFromWaitingList(currentTrip(), index));
        refresh();
    });

    // Bind the waiting list "Ajouter" button after it is rendered
    const waitBtn = document.getElementById('waitBtn');
    if (waitBtn) {
        waitBtn.addEventListener('click', handleAddToWaitingList);
    }
}

// --- Waiting list ---

function handleAddToWaitingList() {
    const name = document.getElementById('waitName').value.trim();
    const phone = document.getElementById('waitPhone').value.trim();
    const trip = currentTrip();
    const waitMessage = document.getElementById('waitMessage');

    // Build a combined list to check uniqueness across reservations + waiting list
    const allPeople = trip.reservations.slice();
    for (let i = 0; i < trip.waitingList.length; i++) {
        // Give fake negative seats so the validator can compare seats
        allPeople.push({ name: trip.waitingList[i].name, phone: trip.waitingList[i].phone, seat: -(i + 1) });
    }

    const nameError = validateName(name, allPeople);
    if (nameError) {
        showMessage(waitMessage, nameError, true);
        return;
    }

    const phoneError = validatePhone(phone, allPeople);
    if (phoneError) {
        showMessage(waitMessage, phoneError, true);
        return;
    }

    trips = updateTrip(trips, addToWaitingList(trip, name, phone));
    document.getElementById('waitName').value = '';
    document.getElementById('waitPhone').value = '';
    refresh();
    // waitMessage may have been re-rendered, get it again
    const newWaitMessage = document.getElementById('waitMessage');
    if (newWaitMessage) {
        showMessage(newWaitMessage, name + " ajouté(e) en liste d'attente.", false);
    }
}

// --- Reserve ---

function handleReserve() {
    const name = document.getElementById('nameInput').value.trim();
    const phone = document.getElementById('phoneInput').value.trim();
    const seatVal = document.getElementById('seatInput').value.trim();
    const seat = seatVal ? Number(seatVal) : null;
    const message = document.getElementById('message');
    const trip = currentTrip();

    if (isFull(trip)) {
        showMessage(message, "Trajet complet. Inscrivez-vous en liste d'attente.", true);
        return;
    }

    const nameError = validateName(name, trip.reservations);
    if (nameError) {
        showMessage(message, nameError, true);
        return;
    }

    const phoneError = validatePhone(phone, trip.reservations);
    if (phoneError) {
        showMessage(message, phoneError, true);
        return;
    }

    if (seat !== null) {
        if (seat < 1 || seat > trip.capacity) {
            showMessage(message, 'Siège invalide (1 à ' + trip.capacity + ').', true);
            return;
        }
        for (let i = 0; i < trip.reservations.length; i++) {
            if (trip.reservations[i].seat === seat) {
                showMessage(message, 'Siège ' + seat + ' est déjà occupé.', true);
                return;
            }
        }
    }

    const updatedTrip = addReservation(trip, name, phone, seat);
    trips = updateTrip(trips, updatedTrip);

    // Find the seat that was assigned
    let assignedSeat = null;
    for (let i = 0; i < updatedTrip.reservations.length; i++) {
        if (updatedTrip.reservations[i].name === name && updatedTrip.reservations[i].phone === phone) {
            assignedSeat = updatedTrip.reservations[i].seat;
            break;
        }
    }

    const price = seatPrice(trip.price, assignedSeat);
    showMessage(message, 'Siège ' + assignedSeat + ' réservé pour ' + name + ' (' + price + ' DH).', false);

    document.getElementById('nameInput').value = '';
    document.getElementById('phoneInput').value = '';
    document.getElementById('seatInput').value = '';
    refresh();
}

// --- Modify ---

function handleModifySelect() {
    const seat = Number(document.getElementById('changeSelect').value);
    const trip = currentTrip();

    for (let i = 0; i < trip.reservations.length; i++) {
        if (trip.reservations[i].seat === seat) {
            document.getElementById('modifyNameInput').value = trip.reservations[i].name;
            document.getElementById('modifyPhoneInput').value = trip.reservations[i].phone;
            document.getElementById('newSeat').value = trip.reservations[i].seat;
            break;
        }
    }
}

function handleModify() {
    const oldSeat = Number(document.getElementById('changeSelect').value);
    const name = document.getElementById('modifyNameInput').value.trim();
    const phone = document.getElementById('modifyPhoneInput').value.trim();
    const newSeat = Number(document.getElementById('newSeat').value);
    const modifyMessage = document.getElementById('modifyMessage');
    const trip = currentTrip();

    if (!oldSeat) {
        showMessage(modifyMessage, 'Choisissez un passager.', true);
        return;
    }

    const nameError = validateName(name, trip.reservations, oldSeat);
    if (nameError) {
        showMessage(modifyMessage, nameError, true);
        return;
    }

    const phoneError = validatePhone(phone, trip.reservations, oldSeat);
    if (phoneError) {
        showMessage(modifyMessage, phoneError, true);
        return;
    }

    if (!newSeat || newSeat < 1 || newSeat > trip.capacity) {
        showMessage(modifyMessage, 'Siège invalide (1 à ' + trip.capacity + ').', true);
        return;
    }

    if (newSeat !== oldSeat) {
        for (let i = 0; i < trip.reservations.length; i++) {
            if (trip.reservations[i].seat === newSeat) {
                showMessage(modifyMessage, 'Siège ' + newSeat + ' est déjà occupé.', true);
                return;
            }
        }
    }

    trips = updateTrip(trips, modifyReservation(trip, oldSeat, name, phone, newSeat));
    showMessage(modifyMessage, 'Réservation modifiée : ' + name + ', siège ' + newSeat + '.', false);

    document.getElementById('modifyNameInput').value = '';
    document.getElementById('modifyPhoneInput').value = '';
    document.getElementById('newSeat').value = '';
    refresh();
}

// --- Cancel ---

function handleCancel() {
    const seat = Number(document.getElementById('supSelect').value);
    const supMessage = document.getElementById('supMessage');

    if (!seat) {
        showMessage(supMessage, 'Choisissez un passager.', true);
        return;
    }

    const trip = currentTrip();
    let cancelledName = '';
    for (let i = 0; i < trip.reservations.length; i++) {
        if (trip.reservations[i].seat === seat) {
            cancelledName = trip.reservations[i].name;
            break;
        }
    }

    const hadWaiting = trip.waitingList.length > 0;
    trips = updateTrip(trips, cancelReservation(trip, seat));

    // Check if someone was promoted from the waiting list
    let promotedName = null;
    if (hadWaiting) {
        const updatedTrip = currentTrip();
        for (let i = 0; i < updatedTrip.reservations.length; i++) {
            if (updatedTrip.reservations[i].seat === seat) {
                promotedName = updatedTrip.reservations[i].name;
                break;
            }
        }
    }

    let msg = 'Réservation de ' + cancelledName + ' annulée.';
    if (promotedName) {
        msg += ' ' + promotedName + " promu(e) depuis la liste d'attente (siège " + seat + ').';
    }
    showMessage(supMessage, msg, false);
    refresh();
}

// --- Init ---

async function init() {
    trips = await loadTrips();
    const trip = currentTrip();

    if (!trip) {
        document.body.innerHTML = '<p class="p-8 text-red-600 text-lg">Trajet introuvable.</p>';
        return;
    }

    renderTripHeader(trip);
    refresh();

    document.getElementById('reserveButton').addEventListener('click', handleReserve);
    document.getElementById('changeSelect').addEventListener('change', handleModifySelect);
    document.getElementById('modifyBtn').addEventListener('click', handleModify);
    document.getElementById('supBtn').addEventListener('click', handleCancel);
}

init();
