/**
 * Data Security - Capa de Privacidad y Cifrado (Data Layer).
 */
export interface IDataSecurity {
  /**
   * Cifra datos en reposo (AES-256-GCM) para persistencia en base de datos.
   */
  encryptSensitiveData(plainText: string, keyId: string): Promise<IEncryptedPayload>;

  /**
   * Descifra datos en reposo validados.
   */
  decryptSensitiveData(payload: IEncryptedPayload, keyId: string): Promise<string>;

  /**
   * Sanitiza y enmascara datos personales crudos (PII) antes de enviarlos a LLMs.
   */
  scrubSensitiveInformation(payload: any): any;
}

export interface IEncryptedPayload {
  cipherText: string;
  iv: string;
  authTag: string;
  keyId: string;
}
