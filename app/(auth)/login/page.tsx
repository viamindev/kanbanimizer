"use client"
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import styles from './page.module.css';
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setError(null);

        try {
            if (!password || password.length < 8) {
                setError('Неправильный формат пароля, минимум 8 символов')
                return
            }

            const res = await signIn("credentials", {
                email,
                password,
                redirect: false
            });

            if (res?.error) {
                setError("Неверный email или пароль")
                return
            }

            router.push("/projects");

        } catch (e) {
            throw new Error('Произошла ошибка сервера')
        }
    }

    return (
        <section className={styles['auth-login']}>
            <h1 className={styles['auth-login__header']}>Вход</h1>
            <form className={styles['login__form']} onSubmit={handleSubmit} >
                <Label className={styles['login__label-email']} htmlFor="email">
                    Email:
                    <Input className={styles['login__input-email']} type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Label>

                <Label className={styles['login__label-password']} htmlFor="password">
                    Пароль:
                    <Input className={styles['login__input-password']} type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </Label>

                {error && <p className={styles['login__error']}>{error}</p>}
                <Button type="submit">Войти</Button>
            </form>
            <Button>
                <Link href={"/register"}>Регистрация</Link>
            </Button>
        </section>
    )
}