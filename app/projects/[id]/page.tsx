"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import styles from "./page.module.css"

type Project = {
    id: string
    name: string,
    description: string | null,
    projectMembers: {
        userId: string,
        role: "OWNER" | "MEMBER"
    }[],
    sections: {
        id: string,
        name: string,
        createdAt: Date,
        updatedAt: Date,
    }[]
}

export default function ProjectPage() {
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const params = useParams()
    const id = params.id as string;

    useEffect(() => {
        async function getProject() {
            try {
                const res = await fetch(`/api/projects/${id}`);
                if (!res.ok) throw new Error();
                const data: Project = await res.json();
                setProject(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }

        getProject()
    }, [id]);

    if(loading) return <p>Загрузка...</p>
    if(!project) return <p>Проект не найден</p>

    return (
        <section className={styles["project"]}>
            
        </section>
    )
}