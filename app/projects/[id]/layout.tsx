import styles from './layout.module.css';

export default async function ProjectLayout({ children, params }: {children: React.ReactNode, params: Promise<{id: string}>}) {
    const { id } = await params;

    return (
        <div className=''>
            <nav></nav>
            <main>
                {children}
            </main>
        </div>
    )
}