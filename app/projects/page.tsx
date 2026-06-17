"use client"

import { useState } from "react";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<string[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    return (
        <div>
            <h1>Страница проектов</h1>
            
        </div>


    )
}