import {useState} from "react";
import MoveSelector from "@/src/components/forum/MoveSelector";

export default function PostForm() {
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [linkedMoves, setLinkedMoves] = useState<{ id: string; name: string }[]>([]);

    const handleAddMove = (move: { id: string; name: string }) => {
        setLinkedMoves([...linkedMoves, move]);
        setBody((prev) => prev + ` [[move:${move.id}]] `);
    };

    const handleRemoveMove = (id: string) => {
        setLinkedMoves(linkedMoves.filter((m) => m.id !== id));
        setBody((prev) => prev.replace(` [[move:${id}]] `, ""));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const postData = {title, body};
        const response = await fetch("/api/posts", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(postData),
        });
        if (response.ok) {
            alert("Post created successfully!");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded space-y-4">
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post Title"
                className="w-full p-2 border rounded"
            />
            <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your post in Markdown..."
                rows={6}
                className="w-full p-2 border rounded"
            />
            <MoveSelector onSelectMove={handleAddMove}/>
            <div className="flex flex-wrap gap-2">
                {linkedMoves.map((move) => (
                    <span key={move.id} className="px-2 py-1 bg-blue-200 rounded text-sm">
                        {move.name}
                        <button onClick={() => handleRemoveMove(move.id)}>❌</button>
                    </span>
                ))}
            </div>
            <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">
                Submit Post
            </button>
        </form>
    );
}
