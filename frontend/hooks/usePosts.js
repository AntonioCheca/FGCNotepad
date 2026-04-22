// hooks/usePosts.js
import useApi from "@/hooks/useApi";
import api from "@/services/api";

const usePosts = () => {
    const {request} = useApi();

    const createPost = async (title, body, tags = []) => {
        try {
            return await request(() => api.post("/posts", {title, body, tags}));
        } catch (error) {
            console.error("Error creating post", error);
            throw error;
        }
    };

    const fetchPosts = async (page = 1, size = 10, textQuery = "", includedTags = [], excludedTags = []) => {
        try {
            const data = await request(() =>
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

            return data;
        } catch (error) {
            console.error("Error fetching posts", error);
            throw error;
        }
    }

    const getSpecificPost = async (id) => {
        try {
            return await request(() => api.get(`/posts/${id}`));
        } catch (error) {
            console.error(`Error fetching post with ID ${id}`, error);
            throw error;
        }
    }

    return {createPost, fetchPosts, getSpecificPost};
};


export default usePosts;
