import { signAccessToken, verifyAccessToken, verifyRefreshToken } from "./jwt";

describe('jwt utils', () => {

    it('Подписывает и проверяет access-токен, возвращает тот же userId', ()=> {
        const token = signAccessToken({ userId: 'abc-123'});
        const payload = verifyAccessToken(token);
        expect(payload?.userId).toBe('abc-123');
    });

    it('Возвращает null на битый токен', ()=> {
        const payload = verifyAccessToken('мусор12312йыв-123');
        expect(payload).toBeNull();
    });

    it('Отклоняет access-токен при проверке как refresh (разные строки)', ()=> {
        const token = signAccessToken({userId: 'abc-123'});
        const payload = verifyRefreshToken(token);
        expect(payload).toBeNull();
    });

});