import type { Pet } from "../features/pets/types";
import type { Service } from "../features/tenant_services/types";

const normalize = (val?: string | null) => (val ? val.trim().toLowerCase() : "");

export const isServiceCompatibleWithPet = (
    service: Service,
    pet: Pet
) => {
    // Espécie: só valida se o serviço especificou espécies e o pet tem espécie
    const serviceSpecies = (Array.isArray(service.species)
        ? service.species
        : (service.species ? [service.species as any] : []))
        .map(normalize)
        .filter(Boolean);

    const petSpecies = normalize(pet.species);
    if (serviceSpecies.length > 0 && petSpecies && !serviceSpecies.includes(petSpecies)) {
        return false;
    }

    // 🔥 Só valida porte se o pet tiver porte e o serviço especificou portes
    const serviceSizes = (Array.isArray(service.sizes)
        ? service.sizes
        : (service.size ? service.size.split(",") : []))
        .map(normalize)
        .filter(Boolean);

    const petSize = normalize(pet.size);
    if (petSize && serviceSizes.length > 0 && !serviceSizes.includes(petSize)) {
        return false;
    }

    // 🔥 Só valida pelagem se o pet tiver pelagem e o serviço especificou pelagens
    const serviceCoats = (Array.isArray(service.coat_types)
        ? service.coat_types
        : (service.coat_type ? service.coat_type.split(",") : []))
        .map(normalize)
        .filter(Boolean);

    const petCoat = normalize(pet.coat_type);
    if (petCoat && serviceCoats.length > 0 && !serviceCoats.includes(petCoat)) {
        return false;
    }

    return true;
};

function getServiceScore(service: Service, pet: Pet) {
    let score = 0;

    const serviceSpecies = (Array.isArray(service.species)
        ? service.species
        : (service.species ? [service.species as any] : []))
        .map(normalize)
        .filter(Boolean);

    const petSpecies = normalize(pet.species);
    if (petSpecies && serviceSpecies.includes(petSpecies)) {
        score += 2;
    }

    const serviceSizes = (Array.isArray(service.sizes)
        ? service.sizes
        : (service.size ? service.size.split(",") : []))
        .map(normalize)
        .filter(Boolean);

    const petSize = normalize(pet.size);
    if (petSize && serviceSizes.includes(petSize)) {
        score += 2;
    } else if (!petSize && serviceSizes.length > 0) {
        score += 1;
    } else if (serviceSizes.length === 0) {
        score += 1;
    }

    return score;
}

export const getServicesForPet = (
    services: Service[],
    pet?: Pet
) => {
    if (!pet) return services;

    const filtered = services.filter((service) => {
        const compatible = isServiceCompatibleWithPet(service, pet);
        return compatible;
    });
    const sorted = filtered.sort((a, b) => {
        const scoreA = getServiceScore(a, pet);
        const scoreB = getServiceScore(b, pet);

        return scoreB - scoreA;
    });

    return sorted;
};

export const getPackageServices = (
    pkg: { items?: Array<{ service?: Service; service_id?: number | null }> },
    allServices?: Service[]
): Service[] => {
    if (!pkg.items) return [];
    return pkg.items
        .map((item) => {
            if (item.service) return item.service;
            if (item.service_id && allServices) {
                return allServices.find((s) => s.id === item.service_id);
            }
            return undefined;
        })
        .filter((s): s is Service => !!s);
};

export const getIncompatibleServicesForPet = (
    pkg: { items?: Array<{ service?: Service; service_id?: number | null }> },
    pet: Pet,
    allServices?: Service[]
): Service[] => {
    const pkgServices = getPackageServices(pkg, allServices);
    return pkgServices.filter((service) => !isServiceCompatibleWithPet(service, pet));
};

export const isPackageCompatibleWithPet = (
    pkg: { items?: Array<{ service?: Service; service_id?: number | null }> },
    pet: Pet,
    allServices?: Service[]
): boolean => {
    const incompatible = getIncompatibleServicesForPet(pkg, pet, allServices);
    return incompatible.length === 0;
};

export const isPackageCompatibleWithAnyPet = (
    pkg: { items?: Array<{ service?: Service; service_id?: number | null }> },
    pets: Pet[],
    allServices?: Service[]
): boolean => {
    const activePets = pets.filter((p) => !p.is_deceased);
    if (activePets.length === 0) return true;
    const pkgServices = getPackageServices(pkg, allServices);
    if (pkgServices.length === 0) return true;
    return activePets.some((pet) => isPackageCompatibleWithPet(pkg, pet, allServices));
};

export const getCompatiblePetsForPackage = (
    pkg: { items?: Array<{ service?: Service; service_id?: number | null }> },
    pets: Pet[],
    allServices?: Service[]
): Pet[] => {
    const activePets = pets.filter((p) => !p.is_deceased);
    return activePets.filter((pet) => isPackageCompatibleWithPet(pkg, pet, allServices));
};

export const isServiceCompatibleWithAnyPet = (
    service: Service,
    pets: Pet[]
): boolean => {
    const activePets = pets.filter((p) => !p.is_deceased);
    if (activePets.length === 0) return true;
    return activePets.some((pet) => isServiceCompatibleWithPet(service, pet));
};

export const getCompatiblePetsForService = (
    service: Service,
    pets: Pet[]
): Pet[] => {
    const activePets = pets.filter((p) => !p.is_deceased);
    return activePets.filter((pet) => isServiceCompatibleWithPet(service, pet));
};