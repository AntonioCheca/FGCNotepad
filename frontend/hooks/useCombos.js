// hooks/useCombos.js
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import {useState} from "react";

/**
 * Hook for interacting with ComboSequences API
 * Provides CRUD operations with authentication handled via useApi
 */
const useCombos = () => {
    const {request} = useApi();
    const [combos, setCombos] = useState([]);
    const [loading, setLoading] = useState(true);

    /**
     * Fetch a list of combos
     * @param {Object} options - Optional filters and pagination
     * @param {number} [options.page] - Page number (future use)
     * @param {number} [options.size] - Page size (future use)
     * @returns {Promise<Array>} - List of combos
     */
    const fetchCombos = async (options = {}) => {
        try {
            const response = await request(() =>
                api.get("/combo-sequences", {params: {...options}})
            );
            return response;
        } catch (error) {
            console.error("Error fetching combos", error);
            throw error;
        }
    };

    const fetchLeafs = async () => {
        try {
            console.log("[useCombos] Fetching leafs from API...");
            const response = await request(() =>
                api.get("/combo-sequences/leafs/list")
            );
            console.log("[useCombos] API response for leafs:", response);

            // if response has .data, unwrap it for clarity
            if (response?.data) {
                console.log("[useCombos] response.data:", response.data);
                return response.data;
            }

            return response;
        } catch (error) {
            console.error("[useCombos] Error fetching leafs:", error);
            throw error;
        }
    };


    /**
     * Create a new combo
     * @param {Object} comboData - ComboSequences creation payload
     * @returns {Promise<Object>} - Created combo
     */
    const createCombo = async (comboData) => {
        try {
            const response = await request(() =>
                api.post("/combo-sequences", comboData)
            );
            return response.data;
        } catch (error) {
            console.error("Error creating combo", error);
            throw error;
        }
    };

    const createFullCombo = async (payload) => {
        try {
            const response = await request(() =>
                api.post("/combo-sequences/full", payload)
            );
            return response.data;
        } catch (error) {
            console.error("Error creating full combo", error);
            throw error;
        }
    };

    const translateComboNotation = async (payload) => {
        try {
            return await request(() =>
                api.post("/combo-sequences/translate", payload)
            );
        } catch (error) {
            console.error("Error translating combo notation", error);
            throw error;
        }
    };

    /**
     * Get details for a specific combo
     * @param {number|string} id - Combo ID
     * @returns {Promise<Object>} - Combo details
     */
    const getCombo = async (id) => {
        try {
            const response = await request(() =>
                api.get(`/combo-sequences/${id}`)
            );
            return response.data;
        } catch (error) {
            console.error(`Error fetching combo with ID ${id}`, error);
            throw error;
        }
    };

    /**
     * Update an existing combo
     * @param {number|string} id - Combo ID
     * @param {Object} updateData - Partial combo data to update
     * @returns {Promise<Object>} - Updated combo
     */
    const updateCombo = async (id, updateData) => {
        try {
            const response = await request(() =>
                api.patch(`/combo-sequences/${id}`, updateData)
            );
            return response.data;
        } catch (error) {
            console.error(`Error updating combo with ID ${id}`, error);
            throw error;
        }
    };

    /**
     * Delete a combo
     * @param {number|string} id - Combo ID
     * @returns {Promise<void>}
     */
    const deleteCombo = async (id) => {
        try {
            await request(() =>
                api.delete(`/combo-sequences/${id}`)
            );
        } catch (error) {
            console.error(`Error deleting combo with ID ${id}`, error);
            throw error;
        }
    };

    return {
        fetchCombos,
        fetchLeafs,
        createCombo,
        createFullCombo,
        translateComboNotation,
        getCombo,
        updateCombo,
        deleteCombo
    };
};

export default useCombos;
