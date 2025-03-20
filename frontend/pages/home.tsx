import {useEffect, useState} from "react";
import {Container, Typography} from "@mui/material";
import {PostList} from "@/src/components/forum/PostList";
import {Post} from "@/src/components/forum/PostItem";
import SearchBar from "@/src/components/forum/SearchBar";
import {fetchPosts} from "@/services/api";

const HomePage = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPosts = async (query) => {
        try {
            setLoading(true);
            const response = await fetchPosts(1, 10, query);
            setPosts(response['data']);
        } catch (error) {
            console.error("Failed to load posts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = async (query) => {
        await loadPosts(query);
    };

    useEffect(() => {
        loadPosts(null).then();
    }, []);

    return (
        <Container maxWidth="md">
            <Typography variant="h4" sx={{my: 3}}>
                Latest Posts
            </Typography>
            <SearchBar onSubmit={handleSearchSubmit}/>
            <PostList posts={posts} loading={loading}/>
        </Container>
    );
};

export default HomePage;
