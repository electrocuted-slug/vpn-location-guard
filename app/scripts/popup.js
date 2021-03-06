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

var audio = [
    document.querySelector('input[id="audio-on"]'),
    document.querySelector('input[id="audio-off"]')
]

var characters = [
    document.querySelector('input[id="vader"]'),
    document.querySelector('input[id="nyan"]'),
    document.querySelector('input[id="yoda"]')
]

var clear = document.querySelector('input[id="clear"]');
var clear_host = document.querySelector('input[id="clear-hostname"]');

checkDisplay = () => {
    if (typeof (browser) === 'undefined') window.browser = chrome;

    if (browser == undefined) {
        console.log(`${TAG} no browser!`)
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
                site[1].parentNode.style.display = 'inline'
                break
        }
    })
    browser.runtime.sendMessage({
        key: 'v1.storage',
        method: 'get',
        method_key: st.audio_key
    }).then((play_audio) => {
        if (play_audio) {
            audio[0].checked = true
        } else {
            audio[1].checked = true
        }
    })
    browser.runtime.sendMessage({
        key: 'v1.storage',
        method: 'get',
        method_key: st.character_key
    }).then(character => {
        if (character === "yoda") {
            characters[2].checked = true
        } else if (character === "nyan") {
            characters[1].checked = true
        } else {
            characters[0].checked = true
        }
    })
}

var query = {
    active: true,
    currentWindow: true
};
chrome.tabs.query(query, (tabs) => {
    try {
        let url = new URL(tabs[0].url)
        document.querySelector('p[id="clear-hostname"').textContent = "Clear " + url.hostname
    } catch (e) {
        document.querySelector('p[id="clear-hostname"').textContent = "Clear Site"
        console.warn(e)
    }
    checkDisplay()
})

checkDisplay()

override.forEach((ov) => {
    ov.addEventListener('change', () => {
        if (ov.id !== "neutral" && ov.checked == true) {
            console.log(ov.id)
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
            browser.runtime.sendMessage({
                key: 'v1.storage',
                method: 'set_host',
                method_value: s.id === "secure2"
            })
        }
    })
})

audio.forEach((a) => {
    a.addEventListener('change', () => {
        if (a.checked == true) {
            browser.runtime.sendMessage({
                key: 'v1.storage',
                method: 'set',
                method_key: st.audio_key,
                method_value: a.id === "audio-on"
            })
        }
    })
})

characters.forEach((c) => {
    c.addEventListener('change', () => {
        if (c.checked == true) {
            browser.runtime.sendMessage({
                key: 'v1.storage',
                method: 'set',
                method_key: st.character_key,
                method_value: c.id
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

clear_host.addEventListener('click', () => {
    browser.runtime.sendMessage({
        key: 'v1.storage',
        method: 'clear_host',
    })
    checkDisplay()
})