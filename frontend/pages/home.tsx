import {useEffect, useState} from "react";
import {Container, Typography} from "@mui/material";
import {PostList} from "@/src/components/forum/PostList";
import {Post} from "@/src/components/forum/PostItem";
import SearchBar from "@/src/components/forum/SearchBar";
import {fetchPosts} from "@/services/api";

const HomePage = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPosts = async () => {
            try {
                const response = await fetchPosts({page: 1, size: 10});
                setPosts(response['data']);
            } catch (error) {
                console.error("Failed to load posts:", error);
            } finally {
                setLoading(false);
            }
        };
        loadPosts();
    }, []);

    return (
        <Container maxWidth="md">
            <Typography variant="h4" sx={{my: 3}}>
                Latest Posts
            </Typography>
            <SearchBar/>
            <PostList posts={posts} loading={loading}/>
        </Container>
    );
};

export default HomePage;
