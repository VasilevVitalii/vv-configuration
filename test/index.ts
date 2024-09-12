import * as path from 'path'
import { GetConfVomlSync, SetConfVomlSync, TConfVoml } from '../src'

const confVomlLayout = {
    note: [
        'CONFIGURATION DESCRIPTION',
        'second line for description'
    ],
    sections: [
        {
            name: 'section1',
            note: [
                'section 1',
                'second line for description section 1'
            ],
            params: [
                {name: 'param1', default: 'def-section1-param1'},
                {name: 'param2', default: 'def-section1-param2'},
            ]
        },
        {
            name: 'section2',
            note: [
                'section 1'
            ],
            params: [
                {name: 'param1', default: 'def-section2-param1'},
                {name: 'param2', default: 'def-section2-param2'},
            ]
        },
        {
            note: [
                'unnamed section'
            ],
            params: [
                {name: 'param1', default: 'def-param1'},
                {name: 'param2', default: 'def-param1'},
            ]
        }
    ]
} as TConfVoml

const fullFileName = path.join(__dirname, '..','..','test', 'test.conf');

const confVoml = GetConfVomlSync({
    fullFileName: fullFileName,
    layout: confVomlLayout
})

if (confVoml.error) {
    console.error(confVoml.error)
} else {
    const someSetting = confVoml.result.find(f => f.section === 'section1' && f.param === 'param1')
    if (!['def-section1-param1', 'section1-param1'].includes(someSetting.value)) {
        someSetting.value = 'def-section1-param1'
        if (confVoml.canUpdate) {
            SetConfVomlSync({fullFileName: fullFileName, layout: confVomlLayout, conf: confVoml.result})
        }
    }
    console.log(someSetting.value)
}
