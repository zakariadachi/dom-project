import { isVIP, freeSeats, isFull, totalRevenue, seatPrice } from './reservations.js';

// Show a feedback message, then hide it after 3 seconds
export function showMessage(el, text, isError) {
    el.textContent = text;
    if (isError) {
        el.className = 'mt-3 text-sm font-medium text-red-600';
    } else {
        el.className = 'mt-3 text-sm font-medium text-green-700';
    }
    setTimeout(function () {
        el.textContent = '';
        el.className = '';
    }, 3000);
}

// Draw the 20 seats in the grid
export function renderSeatGrid(trip, onSeatClick) {
    const grid = document.getElementById('seatGrid');
    grid.innerHTML = '';

    for (let i = 1; i <= trip.capacity; i++) {
        const seat = document.createElement('div');
        seat.id = 'seat-' + i;

        // Check if this seat is reserved
        let occupiedBy = null;
        for (let j = 0; j < trip.reservations.length; j++) {
            if (trip.reservations[j].seat === i) {
                occupiedBy = trip.reservations[j].name;
                break;
            }
        }

        const vip = isVIP(i);
        const occupied = occupiedBy !== null;

        // Pick color based on VIP and occupied status
        if (occupied && vip) {
            seat.className = 'flex flex-col items-center justify-center rounded-xl border py-4 text-xs font-medium bg-amber-400 border-amber-500 text-white';
        } else if (occupied && !vip) {
            seat.className = 'flex flex-col items-center justify-center rounded-xl border py-4 text-xs font-medium bg-green-500 border-green-600 text-white';
        } else if (!occupied && vip) {
            seat.className = 'flex flex-col items-center justify-center rounded-xl border py-4 text-xs font-medium bg-amber-50 border-amber-300 text-amber-700 cursor-pointer hover:bg-amber-100';
        } else {
            seat.className = 'flex flex-col items-center justify-center rounded-xl border py-4 text-xs font-medium bg-white border-slate-200 text-slate-500 cursor-pointer hover:border-blue-400';
        }

        // Seat number
        const number = document.createElement('span');
        number.className = 'text-base font-bold';
        number.textContent = i < 10 ? '0' + i : '' + i;
        seat.appendChild(number);

        // Label below the number
        const label = document.createElement('span');
        label.className = 'mt-1';
        if (occupied) {
            label.textContent = occupiedBy.split(' ')[0]; // first name only
        } else if (vip) {
            label.textContent = 'VIP';
        } else {
            label.textContent = 'Libre';
        }
        seat.appendChild(label);

        // Clicking a free seat fills the seat input
        if (!occupied) {
            seat.addEventListener('click', function () {
                onSeatClick(i);
            });
        }

        grid.appendChild(seat);

        // Add an empty column after every 2nd seat to create the aisle
        if (i % 4 === 2) {
            grid.appendChild(document.createElement('div'));
        }
    }
}

// Update the stats bar (free seats + revenue)
export function renderStats(trip) {
    document.getElementById('places').textContent = freeSeats(trip) + ' / ' + trip.capacity;
    document.getElementById('prix').textContent = totalRevenue(trip) + ' DH';
}

// Fill the trip header section
export function renderTripHeader(trip) {
    document.getElementById('tripRoute').textContent = trip.departure + ' → ' + trip.destination;
    document.getElementById('tripPrice').textContent = trip.price + ' DH / place';
    document.getElementById('tripTime').textContent = trip.departureTime + ' → ' + trip.arrivalTime;
}

// Fill both passenger dropdowns (modify + cancel)
export function renderPassengerSelects(trip) {
    const selects = ['changeSelect', 'supSelect'];

    for (let s = 0; s < selects.length; s++) {
        const sel = document.getElementById(selects[s]);
        sel.innerHTML = '<option value="">-- Choisir un passager --</option>';

        for (let i = 0; i < trip.reservations.length; i++) {
            const r = trip.reservations[i];
            const opt = document.createElement('option');
            opt.value = r.seat;
            const seatLabel = r.seat < 10 ? '0' + r.seat : '' + r.seat;
            opt.textContent = r.name + ' (siège ' + seatLabel + ')';
            sel.appendChild(opt);
        }
    }
}

// Render the waiting list and the "add to waiting list" form
export function renderWaitingList(trip, onRemove) {
    const section = document.getElementById('liste_attente');
    section.innerHTML = '';

    const title = document.createElement('h2');
    title.className = 'text-base font-semibold mb-3';
    title.textContent = "Liste d'attente (" + trip.waitingList.length + ')';
    section.appendChild(title);

    if (trip.waitingList.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'text-sm text-gray-400';
        empty.textContent = 'Aucun passager en attente.';
        section.appendChild(empty);
    } else {
        for (let i = 0; i < trip.waitingList.length; i++) {
            const p = trip.waitingList[i];

            const row = document.createElement('div');
            row.className = 'flex items-center justify-between py-2 border-b border-slate-100 text-sm';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'font-medium text-slate-700';
            nameSpan.textContent = '#' + (i + 1) + ' — ' + p.name;

            const phoneSpan = document.createElement('span');
            phoneSpan.className = 'text-slate-400';
            phoneSpan.textContent = p.phone;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'text-red-500 hover:text-red-700 font-medium ml-2';
            removeBtn.textContent = 'Retirer';

            // Use a closure to capture the correct index
            (function (index) {
                removeBtn.addEventListener('click', function () {
                    onRemove(index);
                });
            })(i);

            row.appendChild(nameSpan);
            row.appendChild(phoneSpan);
            row.appendChild(removeBtn);
            section.appendChild(row);
        }
    }

    // Show the "add to waiting list" form only when the trip is full
    if (isFull(trip)) {
        const form = document.createElement('div');
        form.id = 'waitingForm';
        form.className = 'mt-4 flex flex-col gap-3';
        form.innerHTML = `
            <h3 class="text-sm font-semibold text-slate-600 mt-2">Inscrire en liste d'attente</h3>
            <input type="text" id="waitName" placeholder="Nom du passager"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 bg-[#F0F4FF] text-sm">
            <input type="text" id="waitPhone" placeholder="Téléphone (06/07XXXXXXXX)"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 bg-[#F0F4FF] text-sm">
            <button id="waitBtn" class="px-3 py-2 rounded-xl bg-[#0039A6] text-white text-sm font-medium">Ajouter</button>
            <p id="waitMessage" class="text-sm font-medium"></p>`;
        section.appendChild(form);
    }
}

// Build one trip card for the index page
export function renderTripCard(trip) {
    const free = freeSeats(trip);
    const full = isFull(trip);

    let badgeHTML = '';
    if (full) {
        badgeHTML = '<span class="px-2 py-1 text-xs font-semibold bg-red-100 text-red-600 rounded-full">Complet</span>';
    } else {
        badgeHTML = '<span class="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">Disponible</span>';
    }

    return `
        <div class="shadow w-full rounded-xl p-4 bg-white flex flex-col gap-3">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-xs text-gray-400 uppercase tracking-wide">Trajet #${trip.id}</p>
                    <p class="text-lg font-bold text-slate-800">${trip.departure} → ${trip.destination}</p>
                </div>
                ${badgeHTML}
            </div>
            <div class="flex justify-between text-slate-600 text-sm">
                <span>🕐 ${trip.departureTime} → ${trip.arrivalTime}</span>
                <span class="font-semibold">${trip.price} MAD</span>
            </div>
            <div class="flex justify-between text-xs text-slate-500">
                <span>Places libres : <strong>${free}</strong></span>
                <span>En attente : <strong>${trip.waitingList.length}</strong></span>
            </div>
            <a href="./cabine.html?id=${trip.id}"
                class="mt-auto flex justify-center items-center w-full h-10 bg-blue-700 text-white rounded-lg hover:bg-blue-600 text-sm font-medium">
                Ouvrir la cabine
            </a>
        </div>`;
}
