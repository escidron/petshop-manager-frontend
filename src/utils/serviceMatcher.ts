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