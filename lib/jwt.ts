/**
 * Simple JWT-like encoding/decoding using JSON and Base64
 * Note: This is not cryptographically signed. For production, use a proper JWT library.
 */

export function jwtEncode(payload: any): string {
    const json = JSON.stringify(payload);
    return Buffer.from(json).toString('base64');
}

export function jwtDecode(token: string): any {
    try {
        const json = Buffer.from(token, 'base64').toString('utf-8');
        return JSON.parse(json);
    } catch (error) {
        throw new Error('Invalid token');
    }
}
