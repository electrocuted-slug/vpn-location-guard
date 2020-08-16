const st = require('./storage-vars')
const TAG = "popup:: "

var override = document.querySelector('input[id="override"]');
var site = document.querySelector('input[id="site"]');

(() => {
    if (browser == undefined) {
        console.log("no browser!")
        return
    }
    browser.runtime.sendMessage({
        key: 'v1.storage', 
        method: 'get',
        method_key: st.override_key
    }).then((temp_override) => {
        var myoverride = temp_override
        if (myoverride == undefined) {
            myoverride = false
        }
        /*
            browser.runtime.sendMessage({
                key: 'v1.storage', 
                method: 'set',
                method_key: st.override_key,
                method_value: myoverride
            }).then((err) => 
            {
                if (err) console.log(err)
            })
        }
        */
        override.checked = myoverride
    })
    browser.runtime.sendMessage({
        key: 'v1.storage', 
        method: 'get_host'
    }).then((temp_site) => {
        var mysite = temp_site
        console.log(mysite)
        if (mysite == undefined) {
            mysite = true
        }
            /*
            browser.runtime.sendMessage({
                key: 'v1.storage', 
                method: 'set_host',
                method_value: mysite
            }).then((err) => 
            {
                if (err) console.log(err)
            })
        }
        */
        site.checked = mysite
    })
})();

override.addEventListener('change', () => {
    if(override.checked) {
        browser.runtime.sendMessage({
            key: 'v1.storage', 
            method: 'set',
            method_key: st.override_key,
            method_value: true
        })
    } else {
        browser.runtime.sendMessage({
            key: 'v1.storage', 
            method: 'set',
            method_key: st.override_key,
            method_value: false
        })
    }
})


site.addEventListener('change', () => {
    if(site.checked) {
        browser.runtime.sendMessage({
            key: 'v1.storage', 
            method: 'set_host',
            method_value: true
        })
    } else {
        browser.runtime.sendMessage({
            key: 'v1.storage', 
            method: 'set_host',
            method_value: false
        })
    }
})