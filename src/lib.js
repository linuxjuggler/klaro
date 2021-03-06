/* globals module, require, VERSION */
import React from 'react'
import App from 'components/app.js'
import ConsentManager from 'consent-manager'
import {render} from 'react-dom'
import {convertToMap, update} from 'utils/maps'
import {t, language} from 'utils/i18n'
import {currentScript} from 'utils/compat'
export {update as updateConfig} from 'utils/config'

let defaultConfig
const defaultTranslations = new Map([])

// IE compatibility
if (window.btoa === undefined)
    window.btoa = false

// When webpack's hot loading is enabled, enable Preact's support for the
// React Dev Tools browser extension.
if(module.hot)
    require('preact/debug')

function getElementID(config){
    return config.elementID || 'klaro'
}

function getElement(config){
    const id = getElementID(config)
    let element = document.getElementById(id)
    if (element === null){
        element = document.createElement('div')
        element.id = id
        document.body.appendChild(element)
    }
    return element
}

export function getConfigTranslations(config){
    const trans = new Map([])
    update(trans, defaultTranslations)
    update(trans, convertToMap(config.translations || {}))
    return trans
}

let cnt = 1
export function renderKlaro(config, show, modal){
    if (config === undefined)
        return

    // we are using a count here so that we're able to repeatedly open the modal...
    let showCnt = 0
    if (show)
        showCnt = cnt++
    const element = getElement(config)
    const manager = getManager(config)
    const lang = config.lang || language()
    const configTranslations = getConfigTranslations(config)
    const tt = (...args) => t(configTranslations, lang, config.fallbackLang || 'en', ...args)
    const app = render(<App t={tt}
        lang={lang}
        manager={manager}
        config={config}
        modal={modal}
        show={showCnt} />, element)
    return app
}

export function setup(){
    const script = currentScript("klaro");
    if (script !== undefined){
        const configName = script.getAttribute('data-config') || "klaroConfig"
        defaultConfig = window[configName]
        if (defaultConfig !== undefined){

            // deprecated: config settings should only be loaded via the config
            const scriptStylePrefix = script.getAttribute('data-style-prefix')
            const scriptNoAutoLoad = script.getAttribute('data-no-auto-load') === "true"
            if (scriptStylePrefix === undefined)
                defaultConfig.stylePrefix = scriptStylePrefix

            if (scriptNoAutoLoad)
                defaultConfig.noAutoLoad = true

            const initialize = () => {
                if (!defaultConfig.noAutoLoad)
                    renderKlaro(defaultConfig)
            }

            window.addEventListener('DOMContentLoaded', initialize)
        }
    }
}

export function show(config, modal){
    config = config || defaultConfig
    renderKlaro(config, true, modal)
    return false
}

/* Consent Managers */

const managers = {}

export function resetManagers(){
    for(const key in Object.keys(managers))
        delete managers[key]
}

export function getManager(config){
    config = config || defaultConfig
    const name = config.storageName || config.cookieName || 'default' // deprecated: cookieName
    if (managers[name] === undefined)
        managers[name] = new ConsentManager(config)
    return managers[name]
}

export function version(){
    // we remove the 'v'
    if (VERSION[0] === 'v')
        return VERSION.slice(1)
    return VERSION
}

export {language, defaultConfig, defaultTranslations}
