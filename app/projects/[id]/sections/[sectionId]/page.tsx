import styles from "./page.module.css"

export default async function SectionPage({params}:{params:Promise<{ id: string, sectionId: string }>}) {
    const { sectionId } = await params;

    return (
        <section className={styles["section"]}>
            <h1 className={styles["section__header"]}>Секция: {sectionId}</h1>
            <p className={styles["section__desc"]}>Здесь будут доски и задачи</p>
        </section>
    )
}