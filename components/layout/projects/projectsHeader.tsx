'use client'
import { Button } from "@/components/ui/button"
import styles from "./projectsHeader.module.css"
import { signOut } from "next-auth/react"
import { Avatar } from "@/components/ui/avatar"

export default function ProjectsHeader({user}: {user: {name: string}}) {

    return (
        <header className={styles["header"]}>
            <p className={styles["header__username"]}>{user.name}</p>
            <Avatar className={styles["header__userAvatar"]}></Avatar>
            <Button className={styles["header__signOut"]} onClick={() => signOut({callbackUrl:"/login"})}>Выйти</Button>
        </header>
    )
}