import { loadTrips } from './store.js';
import { isFull, totalRevenue as calcRevenue } from './reservations.js';
import { renderTripCard } from './render.js';

const CARDS_PER_PAGE = 6;

let allTrips = [];      // all trips loaded from storage
let filtered = [];      // trips after search/filter
let currentPage = 1;

// --- Stats ---

function renderStats() {
    let totalPassengers = 0;
    let totalRevenue = 0;
    let fullTrips = 0;

    for (let i = 0; i < allTrips.length; i++) {
        const trip = allTrips[i];
        totalPassengers += trip.reservations.length;
        totalRevenue += calcRevenue(trip);
        if (isFull(trip)) {
            fullTrips++;
        }
    }

    // Append the value span inside each stat card
    appendStat('trajets', allTrips.length);
    appendStat('num_passagers', totalPassengers);
    appendStat('recette', totalRevenue + ' MAD');
    appendStat('trajets_complete', fullTrips);
}

function appendStat(id, value) {
    const card = document.getElementById(id);
    // Remove old value span if it exists
    const old = card.querySelector('.stat-value');
    if (old) {
        card.removeChild(old);
    }
    const span = document.createElement('span');
    span.className = 'text-xl font-semibold stat-value';
    span.textContent = value;
    card.appendChild(span);
}

// --- Cards ---

function renderCards() {
    const container = document.getElementById('AllCards');
    container.innerHTML = '';

    const start = (currentPage - 1) * CARDS_PER_PAGE;
    const end = start + CARDS_PER_PAGE;
    const pageTrips = filtered.slice(start, end);

    if (pageTrips.length === 0) {
        container.innerHTML = '<p class="text-slate-400 col-span-3 text-center py-10">Aucun trajet trouvé.</p>';
        return;
    }

    for (let i = 0; i < pageTrips.length; i++) {
        container.innerHTML += renderTripCard(pageTrips[i]);
    }
}

// --- Pagination ---

function renderPagination() {
    const container = document.getElementById('pagination');
    container.innerHTML = '';

    const totalPages = Math.ceil(filtered.length / CARDS_PER_PAGE) || 1;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = i;

        if (i === currentPage) {
            btn.className = 'w-10 h-10 border rounded-xl font-medium bg-blue-600 text-white';
        } else {
            btn.className = 'w-10 h-10 border rounded-xl font-medium bg-white hover:bg-blue-100';
        }

        // Capture i in a closure so each button knows its page number
        (function (page) {
            btn.addEventListener('click', function () {
                currentPage = page;
                renderCards();
                renderPagination();
            });
        })(i);

        container.appendChild(btn);
    }
}

// --- Search & Filter ---

function applyFilters() {
    const query = document.getElementById('search').value.toLowerCase().trim();
    const status = document.getElementById('tries').value;

    filtered = [];

    for (let i = 0; i < allTrips.length; i++) {
        const trip = allTrips[i];

        const matchCity =
            trip.departure.toLowerCase().includes(query) ||
            trip.destination.toLowerCase().includes(query);

        let matchStatus = true;
        if (status === 'Disponible') {
            matchStatus = !isFull(trip);
        } else if (status === 'Complete') {
            matchStatus = isFull(trip);
        }

        if (matchCity && matchStatus) {
            filtered.push(trip);
        }
    }

    currentPage = 1;
    renderCards();
    renderPagination();
}

// --- Init ---

async function init() {
    allTrips = await loadTrips();
    filtered = allTrips;

    renderStats();
    renderCards();
    renderPagination();

    document.getElementById('search').addEventListener('input', applyFilters);
    document.getElementById('tries').addEventListener('change', applyFilters);
}

init();
