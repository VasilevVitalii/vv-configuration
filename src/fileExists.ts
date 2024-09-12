import { promises , constants, accessSync } from 'fs'

export async function Exists(fullPath: string): Promise<'none' | 'read' | 'write'> {
    try {
        await promises.access(fullPath, constants.R_OK);
        try {
            await promises.access(fullPath, constants.W_OK);
            return 'write'
        } catch (error) {
            return 'read'
        }
    } catch (error) {
        return 'none'
    }
}

export function ExistsSync(fullPath: string): 'none' | 'read' | 'write' {
    try {
        accessSync(fullPath, constants.R_OK);
        try {
            accessSync(fullPath, constants.W_OK);
            return 'write'
        } catch (error) {
            return 'read'
        }
    } catch (error) {
        return 'none'
    }
}