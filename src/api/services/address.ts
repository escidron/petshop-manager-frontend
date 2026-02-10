import apiClient from "../apiClient";

export type AddressResponse = {
    cep: string;
    street: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
};


export const getAddressByCep = async (
    cep: string
): Promise<AddressResponse> => {
    const cleanCep = cep.replace(/\D/g, "");

    const response = await apiClient.get(
        `/api/v1/address/${cleanCep}`
    );

    return response.data;
};