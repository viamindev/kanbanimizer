"use client"

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import { Button } from "@/components/ui/button";


type Project = {
    id: string;
    name: string;
    description: string | null;
    owner: {
        id: string
        name: string
    }
    projectMembers: { role: string }[]
    _count: {
        projectMembers: number
        section: number
    }
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function callProjects() {
            try {
                const response = await fetch("/api/projects")
                if (!response.ok) throw new Error("Ошибка загрузки")
                const data: Project[] = await response.json()
                setProjects(data)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        callProjects()
    }, [])

    if (loading) return <p>Загрузка...</p>

    return (
        <section className={styles["projectList"]}>
            <h1 className={styles["projectList__header"]}>Страница проектов</h1>
            {projects?.map((project, index) => (
                <Button asChild key={project.id}>
                    <Link href={`/projects/${project.id}`} className={styles['projectItem']} >
                        <span className={styles['projectItem__id']}>{index + 1}</span>
                        <h2 className={styles['projectItem__header']}>{project.name}</h2>
                        {/* {project.description && <p className={styles['projectItem__description']}>{project.description}</p>} */}
                        <p className={styles[`projectItem__ownerName`]}>{project.owner.name}</p>
                    </Link>
                </Button>
            ))}
        </section>
    )
}