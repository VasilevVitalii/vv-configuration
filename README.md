<div id="badges">
  <a href="https://www.linkedin.com/in/vasilev-vitalii/">
    <img src="https://img.shields.io/badge/LinkedIn-blue?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn Badge"/>
  </a>
</div>

# vv-configurator
Driver for storing app settings in a format similar to TOML

## Features
* read setting from file
* create setting file if it does not exist
* update (pretty) setting file

## License
MIT

## Install
```bash
npm i vv-configurator
```
```typescript
import { GetConfVomlSync, SetConfVomlSync, TConfVoml } from 'vv-configurator'
```
## Functions
* GetConfVomlSync - sync read (and pretty update) conf file
* GetConfVoml - async read (and pretty update) conf file
* SetConfVomlSync - sync pretty update conf file
* SetConfVoml - async pretty update conf file

## Example
```typescript
const fullFileName = '/path/to/test.conf'
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
    console.log(confVoml.result)
}
```
confVoml.result:
```json
[
    {
        "section": "section1",
        "param": "param1",
        "value": "def-section1-param1"
    },
    {
        "section": "section1",
        "param": "param2",
        "value": "def-section1-param2"
    },
    {
        "section": "section2",
        "param": "param1",
        "value": "def-section2-param1"
    },
    {
        "section": "section2",
        "param": "param2",
        "value": "def-section2-param2"
    },
    {
        "param": "param1",
        "value": "def-param1"
    },
    {
        "param": "param2",
        "value": "def-param1"
    }
]
```
file test.conf:
```
#############################################################
#############################################################
##                CONFIGURATION DESCRIPTION                ##
##               second line for description               ##
#############################################################
#############################################################


#############################################################
# section 1                                                 #
# second line for description section 1                     #
# default for "section1.param1" = "def-section1-param1"     #
# default for "section1.param2" = "def-section1-param2"     #
#############################################################
section1.param1 = def-section1-param1
section1.param2 = def-section1-param2

#############################################################
# section 1                                                 #
# default for "section2.param1" = "def-section2-param1"     #
# default for "section2.param2" = "def-section2-param2"     #
#############################################################
section2.param1 = def-section2-param1
section2.param2 = def-section2-param2

#############################################################
# unnamed section                                           #
# default for "param1" = "def-param1"                       #
# default for "param2" = "def-param1"                       #
#############################################################
param1 = def-param1
param2 = def-param1
```
