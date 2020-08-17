const st = require('./storage-vars')
const TAG = "popup:: "

var override = [
    document.querySelector('input[id="secure"]'),
    document.querySelector('input[id="neutral"]'),
    document.querySelector('input[id="insecure"]')
]
var site = [
    document.querySelector('input[id="secure2"]'),
    document.querySelector('input[id="neutral2"]'),
    document.querySelector('input[id="insecure2"]')
]
var clear = document.querySelector('input[id="clear"]');

checkDisplay = () => {
    if (typeof (browser) === 'undefined') window.browser = chrome;

    if (browser == undefined) {
        console.log("no browser!")
        return
    }
    browser.runtime.sendMessage({
        key: 'v1.storage',
        method: 'get',
        method_key: st.override_key
    }).then((temp_override) => {
        switch (temp_override) {
            case true:
                override[0].checked = true
                override[1].parentNode.style.display = 'none'
                break
            case false:
                override[2].checked = true
                override[1].parentNode.style.display = 'none'
                break
            case undefined:
                override[1].checked = true
                override[1].parentNode.style.display = 'inline'
                break
        }
    })
    browser.runtime.sendMessage({
        key: 'v1.storage',
        method: 'get_host'
    }).then((temp_site) => {
        switch (temp_site) {
            case true:
                site[0].checked = true
                site[1].parentNode.style.display = 'none'
                break
            case false:
                site[2].checked = true
                site[1].parentNode.style.display = 'none'
                break
            case undefined:
                site[1].checked = true
                override[1].parentNode.style.display = 'inline'
                break
        }
    })
}

checkDisplay()

override.forEach((ov) => {
    ov.addEventListener('change', () => {
        if (ov.id !== "neutral" && ov.checked == true) {
            override[1].parentNode.style.display = 'none'
            browser.runtime.sendMessage({
                key: 'v1.storage',
                method: 'set',
                method_key: st.override_key,
                method_value: ov.id === "secure"
            })
        }
    })
})

site.forEach((s) => {
    s.addEventListener('change', () => {
        if (s.id !== "neutral2" && s.checked == true) {
            site[1].parentNode.style.display = 'none'
            var value = s.id === "secure2"
            browser.runtime.sendMessage({
                key: 'v1.storage',
                method: 'set_host',
                method_value: value
            })
        }
    })
})

clear.addEventListener('click', () => {
    browser.runtime.sendMessage({
        key: 'v1.storage',
        method: 'clear',
    })
    checkDisplay()
})