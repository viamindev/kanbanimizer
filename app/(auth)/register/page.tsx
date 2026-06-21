"use client"

import { useState } from "react"
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import styles from "./page.module.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function RegisterPage() {
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const router = useRouter();

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        try {
            if (!name || name.length < 4 || typeof name != 'string') {
                setError('Неправильный формат имени, минимум 4 символа')
                return
            }

            if (!email) {
                setError('Неправильный формат почты')
                return
            }

            if (!password || password.length < 8) {
                setError('Неправильный формат пароля, минимум 8 символов')
                return
            }

            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-type": "application/json" },
                body: JSON.stringify({ name, email, password })
            })
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Ошибка регистрации")
            } else {
                setSuccess(true);

                router.push('/login')
            }

        } catch (e) {
            throw new Error('Ошибка при регистрации, повторите позже');
        }
    }

    return (
        <section className={styles['auth-register']}>
            <h1 className={styles['auth-register__header']}>Регистрация</h1>
            <form className={styles['register__form']} onSubmit={handleSubmit}>
                <Label className={styles['register__label-name']} htmlFor="name">
                    Имя пользователя:
                    <Input className={styles['register__input-name']} type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </Label>

                <Label className={styles['register__label-email']} htmlFor="email">
                    Почта:
                    <Input className={styles['register__input-email']} type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Label>

                <Label className={styles['register__label-password']} htmlFor="password">
                    Пароль:
                    <Input className={styles['register__input-password']} type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </Label>


                {error && <p className={styles['register__error']}>{error}</p>}
                {success && <p className={styles['register__success']}>Успешная регистрация</p>}

                <Button className={styles['register__button-submit']} type="submit">Зарегистрировать</Button>

            </form>
            <Button>
                <Link href={"/login"}>Войти</Link>
            </Button>
        </section>
    )
}