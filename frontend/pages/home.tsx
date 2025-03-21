import {useEffect, useState} from "react";
import {Container, Typography} from "@mui/material";
import {PostList} from "@/src/components/forum/PostList";
import {Post} from "@/src/components/forum/PostItem";
import SearchBar from "@/src/components/forum/SearchBar";
import {fetchPosts} from "@/services/api";

const HomePage = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPosts = async (searchParams) => {
        try {
            setLoading(true);
            const {textQuery, includedTags, excludedTags} = searchParams;
            const response = await fetchPosts(1, 10, textQuery, includedTags, excludedTags);
            setPosts(response['data']);
        } catch (error) {
            console.error("Failed to load posts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPosts({textQuery: "", includedTags: [], excludedTags: []});
    }, []);

    return (
        <Container maxWidth="md">
            <Typography variant="h4" sx={{my: 3}}>
                Latest Posts
            </Typography>
            <SearchBar onSubmit={loadPosts}/>
            <PostList posts={posts} loading={loading}/>
        </Container>
    );
};

export default HomePage;
