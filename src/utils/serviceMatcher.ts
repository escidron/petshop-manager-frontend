import type { Pet } from "../features/pets/types";
import type { Service } from "../features/tenant_services/types";

export const isServiceCompatibleWithPet = (
    service: Service,
    pet: Pet
) => {
    // Espécie continua obrigatória
    if (service.species && service.species !== pet.species) {
        return false;
    }

    // 🔥 Só valida porte se o pet tiver porte
    if (pet.size && service.size && service.size !== pet.size) {
        return false;
    }

    // 🔥 Só valida pelagem se o pet tiver pelagem
    if (pet.coat_type && service.coat_type && service.coat_type !== pet.coat_type) {
        return false;
    }

    return true;
};

function getServiceScore(service: Service, pet: Pet) {
    let score = 0;

    // espécie sempre conta
    if (service.species === pet.species) {
        score += 2;
    }

    // 🔥 só compara size se o pet tiver size
    if (pet.size && service.size === pet.size) {
        score += 2;
    }

    // 🔥 se o pet NÃO tiver size, não penaliza
    if (!pet.size && service.size) {
        score += 1; // dá peso leve para específicos
    }

    // serviço totalmente geral
    if (!service.size) {
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