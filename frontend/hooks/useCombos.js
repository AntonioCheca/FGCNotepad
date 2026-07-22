import {useCallback} from "react";
import useApi from "@/hooks/useApi";
import api from "@/services/api";

const useCombos = () => {
    const {request} = useApi();

    const fetchCombos = useCallback(async (options = {}) => {
        try {
            const data = await request(() =>
                api.get("/combo-sequences", {params: {...options}})
            );
            return data;
        } catch (error) {
            console.error("Error fetching combos", error);
            throw error;
        }
    }, [request]);

    const fetchLeafs = useCallback(async (characterId) => {
        try {
            if (!characterId) {
                return [];
            }

            const data = await request(() =>
                api.get("/combo-sequences/leafs/list", {
                    params: {character_id: characterId},
                })
            );

            return data;
        } catch (error) {
            console.error("[useCombos] Error fetching leafs:", error);
            throw error;
        }
    }, [request]);

    const createCombo = useCallback(async (comboData) => {
        try {
            const data = await request(() =>
                api.post("/combo-sequences", comboData)
            );
            return data;
        } catch (error) {
            console.error("Error creating combo", error);
            throw error;
        }
    }, [request]);

    const createFullCombo = useCallback(async (payload) => {
        try {
            const data = await request(() =>
                api.post("/combo-sequences/full", payload)
            );
            return data;
        } catch (error) {
            console.error("Error creating full combo", error);
            throw error;
        }
    }, [request]);

    const translateComboNotation = useCallback(async (payload) => {
        try {
            return await request(() =>
                api.post("/combo-sequences/translate", payload)
            );
        } catch (error) {
            console.error("Error translating combo notation", error);
            throw error;
        }
    }, [request]);

    const estimateComboDamage = useCallback(async (payload) => {
        try {
            return await request(() =>
                api.post("/combo-sequences/estimate-damage", payload)
            );
        } catch (error) {
            console.error("Error estimating combo damage", error);
            throw error;
        }
    }, [request]);

    const estimateComboResources = useCallback(async (payload) => {
        try {
            return await request(() =>
                api.post("/combo-sequences/estimate-resources", payload)
            );
        } catch (error) {
            console.error("Error estimating combo resources", error);
            throw error;
        }
    }, [request]);

    const fetchRequirementObjects = useCallback(async () => {
        try {
            return await request(() =>
                api.get("/combo-sequences/requirements/objects")
            );
        } catch (error) {
            console.error("Error fetching requirement objects", error);
            throw error;
        }
    }, [request]);

    const getCombo = useCallback(async (id) => {
        try {
            const data = await request(() =>
                api.get(`/combo-sequences/${id}`)
            );
            return data;
        } catch (error) {
            console.error(`Error fetching combo with ID ${id}`, error);
            throw error;
        }
    }, [request]);

    const updateCombo = useCallback(async (id, updateData) => {
        try {
            const data = await request(() =>
                api.patch(`/combo-sequences/${id}`, updateData)
            );
            return data;
        } catch (error) {
            console.error(`Error updating combo with ID ${id}`, error);
            throw error;
        }
    }, [request]);

    const deleteCombo = useCallback(async (id) => {
        try {
            await request(() =>
                api.delete(`/combo-sequences/${id}`)
            );
        } catch (error) {
            console.error(`Error deleting combo with ID ${id}`, error);
            throw error;
        }
    }, [request]);

    return {
        fetchCombos,
        fetchLeafs,
        createCombo,
        createFullCombo,
        translateComboNotation,
        estimateComboDamage,
        estimateComboResources,
        fetchRequirementObjects,
        getCombo,
        updateCombo,
        deleteCombo
    };
};

export default useCombos;
