import { getCurrentUser } from "@/lib/session"
import ProjectsHeader from "@/components/layout/projects/projectsHeader"
import ProjectsBreadcrumb from "@/components/layout/projects/projectsBreadcrumb"

export default async function ProjectsLayout({ children }: { children: React.ReactNode}) {

    const user = await getCurrentUser();

    return (
        <div>
            <ProjectsHeader user={user}/>
            <ProjectsBreadcrumb/>
            <div>{children}</div>
        </div>
    )
}