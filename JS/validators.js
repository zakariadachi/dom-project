// Phone must start with 06 or 07 followed by exactly 8 digits
const PHONE_REGEX = /^(06|07)\d{8}$/;

// Validate name: required + unique on the trip (excludeSeat = seat being edited)
export function validateName(name, reservations, excludeSeat) {
    if (!name) {
        return 'Le nom est obligatoire.';
    }
    for (let i = 0; i < reservations.length; i++) {
        const r = reservations[i];
        if (r.name.toLowerCase() === name.toLowerCase() && r.seat !== excludeSeat) {
            return 'Le nom "' + name + '" est déjà utilisé sur ce trajet.';
        }
    }
    return null;
}

// Validate phone: format + unique on the trip (excludeSeat = seat being edited)
export function validatePhone(phone, reservations, excludeSeat) {
    if (!PHONE_REGEX.test(phone)) {
        return 'Téléphone invalide (06 ou 07 suivi de 8 chiffres).';
    }
    for (let i = 0; i < reservations.length; i++) {
        const r = reservations[i];
        if (r.phone === phone && r.seat !== excludeSeat) {
            return 'Le numéro "' + phone + '" est déjà utilisé sur ce trajet.';
        }
    }
    return null;
}
