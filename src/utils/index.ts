// src/utils/index.ts

/**
 * Converts a string to an ArrayBuffer. Assumes one byte per character,
 * suitable for standard ASCII characters. Non-ASCII characters (i.e., characters
 * where codePoint > 0xFF) will not be converted correctly.
 * @param str The ASCII string to convert.
 * @returns An ArrayBuffer representing the ASCII string.
 * @throws Will throw an error if the input is not a string or contains non-ASCII characters.
 */
const convertStrToArrayBuffer = (str: string): ArrayBuffer => {
    for (let i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) > 0xff) {
            throw new Error(
                'String contains non-ASCII characters, which are not supported by this function.'
            )
        }
    }

    const buf = new ArrayBuffer(str.length)
    const bufView = new Uint8Array(buf)
    for (let i = 0; i < str.length; i++) {
        bufView[i] = str.charCodeAt(i)
    }

    return buf
}

/**
 * Pads a Base64 string to a length that's a multiple of 4.
 * @param stringBase64 The Base64 string to pad.
 * @returns A padded Base64 string.
 */
const padStringBase64 = (stringBase64: string): string => {
    const padding = '='.repeat((4 - (stringBase64.length % 4)) % 4)
    return stringBase64 + padding
}

/**
 * Converts an ArrayBuffer to a Base64 string.
 * @param arrayBuffer The ArrayBuffer to convert.
 * @returns A Base64 encoded string.
 */
const convertArraybufferToBase64 = (arrayBuffer: ArrayBuffer): string => {
    try {
        return Buffer.from(arrayBuffer).toString('base64')
    } catch (error) {
        throw new Error(
            `Error converting ArrayBuffer to Base64: ${
                (error as Error).message
            }`
        )
    }
}

/**
 * Converts a Base64 string to an ArrayBuffer.
 * @param stringBase64 The Base64 string to convert.
 * @returns An ArrayBuffer representation of the Base64 string.
 */
const convertBase64ToArraybuffer = (stringBase64: string): ArrayBuffer => {
    try {
        return convertStrToArrayBuffer(
            Buffer.from(padStringBase64(stringBase64), 'base64').toString(
                'latin1'
            )
        )
    } catch (error) {
        throw new Error(
            `Error converting Base64 to ArrayBuffer: ${
                (error as Error).message
            }`
        )
    }
}

/**
 * Converts a Base64 string to a plain string.
 * @param stringBase64 The Base64 string to convert.
 * @returns A plain string representation of the Base64 string.
 */
const convertBase64ToPlainString = (stringBase64: string): string => {
    try {
        return Buffer.from(padStringBase64(stringBase64), 'base64').toString(
            'latin1'
        )
    } catch (error) {
        throw new Error(
            `Error converting Base64 to plain string: ${
                (error as Error).message
            }`
        )
    }
}

export {
    convertStrToArrayBuffer,
    padStringBase64,
    convertArraybufferToBase64,
    convertBase64ToArraybuffer,
    convertBase64ToPlainString,
}
