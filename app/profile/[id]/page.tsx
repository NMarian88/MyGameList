import {notFound} from "next/navigation";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
    return(
        <h1>Hello </h1>
    )
}
