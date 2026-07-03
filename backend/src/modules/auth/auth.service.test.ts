import { usersTable } from "@/db/schema/users";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { LoginUser, RegisterUser } from "./auth.service";

const testEmail = 'register-test@example.com';

describe('registerUser', () => {
    afterEach(async () => {
        await db.delete(usersTable).where(eq(usersTable.email, testEmail));
    })

    it('Успешная регистрация и не палит ли хешированный пароль', async () => {
        const result = await RegisterUser({ email: testEmail, username: 'testuser', password: 'passwordtest' });

        expect(result?.user.email).toBe(testEmail);
        expect(result?.user).not.toHaveProperty('passwordHash');
        expect(result?.accessToken).toBeTypeOf('string');
        expect(result?.refreshToken).toBeTypeOf('string');
    });

    it('Проверка на занятость почты', async () => {
        await RegisterUser({ email: testEmail, username: 'randomusername', password: 'password123' })

        await expect(
            RegisterUser({ email: testEmail, username: 'other', password: 'password123' })
        ).rejects.toThrow('Email уже занят');
    });
});

describe('loginUser', ()=> {
    it('Успешный логин и не палится пароль', async () => {
        RegisterUser({ email: testEmail, username: 'testuser', password:"password123"})

        const result = await LoginUser({email: testEmail, password:"password123"});
        expect(result?.accessToken).toBeTypeOf('string');
        expect(result?.refreshToken).toBeTypeOf('string');
        expect(result.user.email).toBe(testEmail);
        expect(result.user.id).toBeTypeOf('string');
        expect(result.user.username).toBeTypeOf('string');
        expect(result.user.username).toBe('testuser');
    })
})