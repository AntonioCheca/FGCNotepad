// hooks/usePosts.js
import useApi from "@/hooks/useApi";
import api from "@/services/api";

const usePosts = () => {
    const {request} = useApi();

    const createPost = async (title, body, tags = []) => {
        try {
            // Assuming response.data contains the post object
            return await request(() => api.post("/posts", {title, body, tags}));  // Return the data so the caller can handle it
        } catch (error) {
            console.error("Error creating post", error);
            throw error;  // Re-throw the error to be handled elsewhere
        }
    };

    const fetchPosts = async (page = 1, size = 10, textQuery = "", includedTags = [], excludedTags = []) => {
        try {
            const response = await request(() =>
                api.get("/posts", {
                    params: {
                        page: Number(page),
                        size: Number(size),
                        query: textQuery || "",
                        includedTags: includedTags.length ? includedTags.join(",") : undefined,
                        excludedTags: excludedTags.length ? excludedTags.join(",") : undefined,
                    },
                })
            );

            return response.data;
        } catch (error) {
            console.error("Error creating post", error);
            throw error;  // Re-throw the error to be handled elsewhere
        }
    }

    const getSpecificPost = async (id) => {
        try {
            return await request(() => api.get(`/posts/${id}`));
        } catch (error) {
            console.error("Error creating post", error);
            throw error;  // Re-throw the error to be handled elsewhere
        }
    }

    return {createPost, fetchPosts, getSpecificPost};
};


export default usePosts;
