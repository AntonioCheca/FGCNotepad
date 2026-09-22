import React from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import {CharacterResource, CharacterResourceInput} from "@/src/types/characterResource";

export function useCharacterResources() {
    const {request} = useApi();

    const listResources = React.useCallback(async (characterName?: string): Promise<CharacterResource[]> => {
        const payload = await request(() => api.get("/moderation/resources", {params: characterName ? {characterName} : undefined}));
        return (payload as {resources: CharacterResource[]}).resources;
    }, [request]);

    const createResource = React.useCallback(async (input: CharacterResourceInput): Promise<CharacterResource> => {
        return request(() => api.post("/moderation/resources", input));
    }, [request]);

    const updateResource = React.useCallback(async (id: number, input: Partial<CharacterResourceInput>): Promise<CharacterResource> => {
        return request(() => api.patch(`/moderation/resources/${id}`, input));
    }, [request]);

    const deleteResource = React.useCallback(async (id: number): Promise<void> => {
        await request(() => api.delete(`/moderation/resources/${id}`));
    }, [request]);

    return {listResources, createResource, updateResource, deleteResource};
}
