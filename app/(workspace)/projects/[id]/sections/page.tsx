"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import styles from "./page.module.css"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import CreateSectionForm from "@/components/layout/sections/createSectionForm"
import { Section } from "@/types/section"

type Project = {
    id: string,
    name: string,
    description: string | null,
    currentUserRole: "OWNER" | "MEMBER"
}

type SectionsResponse = {
    project: Project,
    sections: Section[]
}

export default function ProjectSectionsPage() {
    const [project, setProject] = useState<Project | null>(null);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);

    const params = useParams()
    const id = params.id as string;



    useEffect(() => {
        async function getProject() {
            try {
                const res = await fetch(`/api/projects/${id}/sections`);
                if (!res.ok) throw new Error();
                const data: SectionsResponse = await res.json();
                setProject(data.project);
                setSections(data.sections);
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

    function handleCreated(newSection: Section) {
        setSections((previous) => [...previous, newSection]);
    }

    return (
        <section className={styles["sectionCardList"]}>
            {project.currentUserRole === "OWNER" && ( <CreateSectionForm projectId={id} onCreated={handleCreated}/>)}
            {sections.map((section, index) => (
                <Button className={styles["sectionCardItem"]} asChild key={section.id}>
                    <Link className={styles["sectionCardItem__link"]} href={`/projects/${project.id}/sections/${section.id}`}>
                        <span className={styles['']}>{index + 1}</span>
                        <span className={styles['']}>{section.name}</span>
                        <p className={styles[``]}>{section.author.name}</p>
                    </Link>
                </Button>
            ))}
        </section>
    )
}