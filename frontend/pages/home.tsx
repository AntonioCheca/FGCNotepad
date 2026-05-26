import {useCallback, useEffect, useState} from "react";
import {PostList} from "@/src/components/forum/PostList";
import {Post} from "@/src/components/forum/PostItem";
import SearchBar from "@/src/components/forum/SearchBar";
import usePosts from "@/hooks/usePosts";
import {AppContainer} from "@/src/components/ui/AppContainer";
import {AppTypography} from "@/src/components/ui/AppTypography";

interface PostSearchParams {
    textQuery: string;
    includedTags: string[];
    excludedTags: string[];
}

const HomePage = () => {
    const {fetchPosts} = usePosts();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPosts = useCallback(async (searchParams: PostSearchParams) => {
        try {
            setLoading(true);
            const {textQuery, includedTags, excludedTags} = searchParams;
            const fetchedPosts = await fetchPosts(1, 10, textQuery, includedTags, excludedTags);
            setPosts(fetchedPosts);
        } catch (error) {
            console.error("Failed to load posts:", error);
        } finally {
            setLoading(false);
        }
    }, [fetchPosts]);

    useEffect(() => {
        loadPosts({textQuery: "", includedTags: [], excludedTags: []});
    }, [loadPosts]);

    return (
        <AppContainer maxWidth="md">
            <AppTypography variant="h4" sx={{my: 3}}>
                Latest Posts
            </AppTypography>
            <SearchBar onSubmit={loadPosts}/>
            <PostList posts={posts} loading={loading}/>
        </AppContainer>
    );
};

export default HomePage;
