

import CryptoJS from 'crypto-js';

export function decryptAES(encryptedText: string, key: string, iv: string): string {
    try {
        // 将密钥和IV转为WordArray格式（CryptoJS需要）
        const keyBytes = CryptoJS.enc.Utf8.parse(key);
        const ivBytes = CryptoJS.enc.Utf8.parse(iv);
        // 解密
        const decrypted = CryptoJS.AES.decrypt(encryptedText.toString(), keyBytes, {
            iv: ivBytes,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        // 将解密结果转为UTF-8字符串
        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        // console.error('解密失败:', error);
        // throw new Error('解密失败，请检查密钥、IV和加密模式是否匹配');
        return '';
    }
}

