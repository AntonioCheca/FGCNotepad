import {useState} from "react";
import PostForm from "@/src/components/forms/PostForm";
import {useRouter} from "next/navigation";

export default function NewPostPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (title: string, body: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({title, body}),
            });

            if (!response.ok) {
                throw new Error("Failed to create post");
            }

            const data = await response.json();
            router.push(`/posts/${data.id}`); // Redirect to the created post
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Create a New Post</h1>
            {error && <p className="text-red-500">{error}</p>}
            <PostForm onSubmit={handleSubmit} loading={loading}/>
        </div>
    );
}
