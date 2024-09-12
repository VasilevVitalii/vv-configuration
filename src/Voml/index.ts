import * as vv from 'vv-common'
import * as fs from 'fs'
import { Exists, ExistsSync } from '../fileExists'

export type TVomlParam = {
    name: string,
    default: string
}

export type TVomlSection = {
    note?: string[],
    name?: string,
    params: TVomlParam[]
}

export type TVoml = {
    note?: string[],
    sections: TVomlSection[]
}

export type TVomlResult = {
    section: string,
    param: string,
    value: string
}

type TReadFunctionResult = {
    error?: string,
    result?: TVomlResult[],
    canUpdate?: boolean
}

export function ReadSync(param: { fullFileName: string, layout: TVoml }): TReadFunctionResult {
    const res = prepareRead(param)
    if (res.error) {
        return res
    }

    try {
        const existsMode = ExistsSync(param.fullFileName)
        const existsText = existsMode === 'none' ? '' : fs.readFileSync(param.fullFileName, 'utf8')
        fileParsing(existsText, res.result)
        if (existsMode !== 'read') {
            (res as any).canUpdate = true
            const prettyText = getPretty(param.layout, res.result)
            if (existsText !== prettyText) {
                fs.writeFileSync(param.fullFileName, prettyText, 'utf8')
            }
        }
        return res
    } catch (err) {
        return {
            error: `${err}`
        }
    }
}

export async function Read(param: { fullFileName: string, layout: TVoml }): Promise<TReadFunctionResult> {
    const res = prepareRead(param)
    if (res.error) {
        return res
    }

    try {
        const existsMode = await Exists(param.fullFileName)
        const existsText = existsMode === 'none' ? '' : await fs.promises.readFile(param.fullFileName, 'utf8')
        fileParsing(existsText, res.result)
        if (existsMode !== 'read') {
            (res as any).canUpdate = true
            const prettyText = getPretty(param.layout, res.result)
            if (existsText !== prettyText) {
                await fs.promises.writeFile(param.fullFileName, prettyText, 'utf8')
            }
        }
        return res
    } catch (err) {
        return {
            error: `${err}`
        }
    }
}

export function SaveSync(param: { fullFileName: string, layout: TVoml, conf: TVomlResult[] }): void {
    if (!param || !param.fullFileName || !param.layout || !param.conf) return
    const prettyText = getPretty(param?.layout, param?.conf)
    fs.writeFileSync(param.fullFileName, prettyText, 'utf8')
}

export async function Save(param: { fullFileName: string, layout: TVoml, conf: TVomlResult[] }): Promise<void> {
    if (!param || !param.fullFileName || !param.layout || !param.conf) return
    const prettyText = getPretty(param?.layout, param?.conf)
    await fs.promises.writeFile(param.fullFileName, prettyText, 'utf8')
}

function prepareRead(param: { fullFileName: string, layout: TVoml }): TReadFunctionResult {
    const res = {
        error: undefined,
        result: undefined,
        canUpdate: undefined
    } as TReadFunctionResult

    if (!param) {
        res.error = 'param is empty'
        return res
    }
    if (!param.fullFileName) {
        res.error = 'param.fullFileName is empty'
        return res
    }
    if (!param.layout) {
        res.error = 'param.layout is empty'
        return res
    }

    const result = [] as TVomlResult[]
    const errors = [] as string[]

    (param.layout.sections || []).forEach(section => {
        const sectionName = nz(section.name)
        if (result.some(f => vv.equal(f.section, sectionName))) {
            errors.push(`section with name "${sectionName}" occurs more than once`)
            return
        }
        (section?.params || []).forEach((param, paramIdx) => {
            if (!param.name) {
                errors.push(`empty name in param #${paramIdx} in section "${sectionName}"`)
                return
            }
            if (result.some(f => vv.equal(f.section, sectionName) && vv.equal(f.param, param.name))) {
                errors.push(`param with name "${param.name}" in section "${sectionName}" occurs more than once`)
                return
            }
            result.push({ section: sectionName, param: param.name, value: param.default })
        })
    })
    if (errors.length > 0) {
        res.error = errors.join('; ')
    } else {
        res.result = result
    }

    return res
}

function fileParsing(existsText: string, result: TVomlResult[]): void {
    existsText.split(`\n`).map(m => { return m.trimStart() }).filter(f => f && !f.startsWith('#')).forEach(line => {
        const lp = lineParsing(line)
        if (!lp) return

        const fnd = result.find(f => vv.equal(f.section, lp.section) && vv.equal(f.param, lp.param))
        if (!fnd) return

        fnd.value = lp.value
    })
}

function lineParsing(line: string): TVomlResult {
    const index = line.indexOf('=');

    const nameFull = index < 0 ? line : line.substring(0, index).trim().split('.')
    const value = index < 0 ? '' : line.substring(index + 1).trim()

    return nameFull.length === 2 ? { section: nameFull[0], param: nameFull[1], value } :
        nameFull.length === 1 ? { section: '', param: nameFull[0], value } : undefined;
}

function getPretty(layout: TVoml, result: TVomlResult[]): string {
    const schema = [] as (
        { type: 'line' } |
        { type: 'empty' } |
        { type: 'title', text: string } |
        { type: 'note', text: string } |
        { type: 'text', text: string }
    )[]

    if (layout.note && layout.note.length > 0) {
        schema.push({type: 'line'})
        schema.push({type: 'line'})
        layout.note.forEach(item => {
            schema.push({type: 'title', text: item})
        })
        schema.push({type: 'line'})
        schema.push({type: 'line'})
        schema.push({type: 'empty'})
    }

    (layout.sections || []).forEach(section => {
        schema.push({type: 'empty'})
        schema.push({type: 'line'})

        if (section.note && section.note.length > 0) {
            section.note.forEach(item => {
                schema.push({type: 'note', text: item})
            })
        }
        const textDefaultNote = [] as string[]
        const textVariable = [] as string[]
        const sectionName = nz(section.name)
        const resultParam = result.filter(f => vv.equal(f.section, sectionName))

        section.params.forEach(item => {
            const variable = `${sectionName ? sectionName + '.' : ''}${item.name}`
            textDefaultNote.push(`default for "${variable}" = "${nz(item.default)}"`)
            const val = resultParam.find(f => vv.equal(f.param, item.name))
            textVariable.push(`${variable} = ${nz(val?.value)}`)
        })

        textDefaultNote.forEach(item => {
            schema.push({type: 'note', text: item})
        })
        schema.push({type: 'line'})
        textVariable.forEach(item => {
            schema.push({type: 'text', text: item})
        })
    })

    const width = Math.max(...schema.filter(f => f.type === 'title' || f.type === 'note' || f.type === 'text').map(m => { return m.text.length })) + 8
    const pretty = [] as string[]
    schema.forEach(item => {
        if (item.type === 'line') {
            pretty.push('#'.repeat(width))
        } else if (item.type === 'empty') {
            pretty.push('')
        } else if (item.type === 'title') {
            const totalPadding = width - item.text.length - 6
            const leftPadding = Math.floor(totalPadding / 2)
            const rightPadding = totalPadding - leftPadding
            pretty.push(`## ${' '.repeat(leftPadding)}${item.text}${' '.repeat(rightPadding)} ##`)
        } else if (item.type === 'note') {
            const rightPadding = width - item.text.length - 4
            pretty.push(`# ${item.text}${' '.repeat(rightPadding)} #`)
        } else {
            pretty.push(item.text)
        }
    })

    return pretty.join(`\n`)
}

function nz(val: string): string {
    return vv.nz(val, '') || ''
}