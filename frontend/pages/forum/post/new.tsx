"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import PostForm from "@/src/components/forms/PostForm";
import {createPost} from "@/services/api";

export default function NewPostPage() {
    console.log('Hello World!');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (title: string, body: string) => {
        console.log('Submitted form!');
        setLoading(true);
        setError(null);

        try {
            console.log("Sending create Post");
            const data = await createPost(title, body);
            console.log("Post created??");
            router.push(`/posts/${data.id}`);
        } catch (err: any) {
            setError(err.response?.data?.message || "An error occurred");
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
