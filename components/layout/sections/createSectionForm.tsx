'use client'
import { Button } from "@/components/ui/button";
import type { Section } from "@/types/section"
import { useState } from "react";
import styles from "./createSectionForm.module.css"
import { Input } from "@/components/ui/input";

type Props = {
    projectId: string,
    onCreated: (section: Section) => void;
}

export default function CreateSectionForm({projectId, onCreated}: Props) {
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        

        try {
            const trimmedName = name.trim();
            if(trimmedName.length < 3 || trimmedName.length > 40) {
                setError("Название должно содержать от 3 до 40 символов")
                return
            }
            setError('');
            setLoading(true);

            const response = await fetch(`/api/projects/${projectId}/sections`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({name: trimmedName})
                })

            const data = await response.json();

            if (!response.ok) {
                setError("Не удалось создать секцию")
                return
            }

            onCreated(data);
            setName('');
            setError('');
        } catch (error) {
            console.error(error);
            setError("Ошибка запроса")
        } finally {
            setLoading(false);
        }
    }

    return (
        <form className={styles['createSectionForm']} onSubmit={handleSubmit}>
            <Input className={styles["createSectionForm__input"]}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название секции"
            minLength={3}
            maxLength={40}
            required
            />
            <Button className={styles["createSectionForm__button-submit"]} type="submit" disabled={loading}>{loading ? "Создание..." : "Создать"}</Button>
            {error && <p role="alert">{error}</p>}
        </form>
    )

}