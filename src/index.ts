// fido2Component.ts

import {
    Fido2Lib,
    Fido2LibOptions,
    AttestationOptions,
    ExpectedAssertionResult,
    PublicKeyCredentialCreationOptions,
    Attestation,
    AuthenticatorSelectionCriteria,
} from 'fido2-lib'

import {
    convertStrToArrayBuffer,
    convertArraybufferToBase64,
    convertBase64ToArraybuffer,
    convertBase64ToPlainString,
} from './utils'

const defaultConfig: Fido2LibOptions = {
    challengeSize: 128,
    attestation: 'direct',
    cryptoParams: [-7, -257],
    authenticatorAttachment: 'cross-platform', // 'platform', 'cross-platform', or 'null'
    authenticatorRequireResidentKey: false,
    authenticatorUserVerification: 'preferred',
    timeout: 60000, // 60 seconds
}

type User = {
    id: string
    name: string
    displayName: string
}
export const createFido2Component = (config: Fido2LibOptions) => {
    const fido2Lib = new Fido2Lib({ ...defaultConfig, ...config })
    const defaultExpectations = {
        challenge: '',
        origin: 'https://example.com',
        factor: 'either',
    }

    const getAttestationOptions = async (user: User) => {
        try {
            const userIdBuffer = convertStrToArrayBuffer(user.id)
            const fido2User = {
                id: userIdBuffer, // Buffer type for id
                name: user.name,
                displayName: user.displayName,
            }
            const attestationOptions = await fido2Lib.attestationOptions({
                user: fido2User,
            } as AttestationOptions)
            const {
                challenge: challengeArrayBuffer,
                user: { id: userIdArrayBuffer },
            } = attestationOptions
            return {
                ...attestationOptions,
                challenge: convertArraybufferToBase64(challengeArrayBuffer),
                user: {
                    ...attestationOptions.user,
                    id: convertBase64ToPlainString(
                        convertArraybufferToBase64(userIdArrayBuffer)
                    ),
                },
            }
        } catch (err) {
            return Promise.reject(err)
        }
    }

    const checkAttestationResult = async ({
        attestationResponse: { id, ...attestationRes },
        challenge,
    }) => {
        attestationRes.id = convertBase64ToArraybuffer(id)
        const expectations = {
            ...defaultExpectations,
            challenge,
        }
        try {
            const attestationResult = await fido2Lib.attestationResult(
                attestationRes,
                expectations
            )
            return {
                publicKeyJwk: attestationResult.authnrData.get(
                    'credentialPublicKeyJwk'
                ),
                publicKeyPem: attestationResult.authnrData.get(
                    'credentialPublicKeyPem'
                ),
                counter: attestationResult.authnrData.get('counter'),
            }
        } catch (err) {
            return Promise.reject(err)
        }
    }

    const getAssertionOptions = async () => {
        try {
            const { challenge, ...assertionOptions } =
                await fido2Lib.assertionOptions()
            assertionOptions.challenge = convertArraybufferToBase64(challenge)
            return assertionOptions
        } catch (err) {
            return Promise.reject(err)
        }
    }

    const getAssertionUserId = async ({ response: { userId } }) => {
        return convertBase64ToPlainString(userId)
    }
    const checkAssertionResult = async ({
        assertionResponse: {
            id,
            response: { authenticatorData, userId, ...response },
            ...assertionRes
        },
        challenge,
        publicKeyPem,
        counter,
    }) => {
        try {
            assertionRes.userHandle = convertBase64ToPlainString(userId)
            const expected = {
                ...defaultExpectations,
                challenge,
                publicKey: publicKeyPem,
                prevCounter: counter,
                userHandle: userId,
            }

            const res = {
                ...assertionRes,
                id: convertBase64ToArraybuffer(id),
                response: {
                    ...response,
                    authenticatorData:
                        convertBase64ToArraybuffer(authenticatorData),
                    userHandle: userId,
                },
            }

            await fido2Lib.assertionResult(res, expected)
            return true
        } catch (err) {
            return Promise.reject(err)
        }
    }

    return {
        getAttestationOptions: getAttestationOptions(fido2Lib),
        checkAttestationResult,
        getAssertionOptions,
        getAssertionUserId,
        checkAssertionResult,
    }
}
