(() => {
    var st = require('./storage-vars')
    var inject = require('./inject')

    if(typeof(browser) === 'undefined')
        window.browser = chrome;

    function insertScript(inline, data) {
        var script = document.createElement('script');
        script.setAttribute('id', '__vlg_script');
        if(inline)
            script.appendChild(document.createTextNode(data));
        else
            script.setAttribute('src', data);

        var _parent = document.head || document.body || document.documentElement;
        var firstChild = (_parent.childNodes && (_parent.childNodes.length > 0)) ? _parent.childNodes[0] : null;
        if(firstChild)
            _parent.insertBefore(script, firstChild);
        else
            _parent.appendChild(script);
    }

	var code =
		"(" + inject + ")();" +
    insertScript(true, code)

    var s = document.getElementById('__vlg_script')
    if(s) {
        s.remove()
        var url = browser.runtime.getURL("scripts/inject.js")
        insertScript(false, url);
    }

    var TAG = "contentscript:: "
    var tabid

    messageListener = (data, sender, sendResponse) => {
        if (data.key === "v1.geo_done") {
            handleSuccess(data)
        }
        return Promise.resolve("v1.geo_done good")
    }

    handleSuccess = (data) => {
        var eventDetail = cloneInto(data, document.defaultView)            
        document.dispatchEvent(new CustomEvent('v1.dispatched_outside', {detail: eventDetail}))
    }

    function setupBrowserEventListeners() {
        browser.runtime.sendMessage({key: 'v1.get_tabid' }).then((resp) => {
            tabid = resp
        })
        chrome.runtime.onMessage.addListener(messageListener);
        browser.runtime.sendMessage({
            key: 'v1.injected',
            href: location.href,
            tabid: tabid
        })
    }

    document.addEventListener('v1.dispatched_inside', (data) => {
        var send = data.detail
        browser.storage.local.get(st.override_key).then((active) => {
            let override = active[st.override_key]
            browser.storage.local.get(send.hostname).then((allowed) => {
                let host_allowed = allowed[send.hostname]
                if (send === undefined) send = {}
                let final_out = host_allowed || override
                send.active = final_out
                send.tabid = tabid
                if (host_allowed == undefined && (override == false || override == undefined)) {
                    swal({
                        title: "Share FAKE location for " + send.hostname + " ?",
                        text: "You can change this later back clicking the app icon.",
                        icon: "info",
                        buttons: true
                    }).then((decision) => {
                        if (decision) final_out = true
                        else final_out = false
                        browser.storage.local.set({[send.hostname]: final_out}).then((err) => {
                            if (err) console.error(err)
                            else {
                                send.active = final_out
                                send.key = 'v1.geo'
                                send.tabid = tabid
                                send.allow_host = final_out
                                browser.runtime.sendMessage(send).then(handleSuccess, handleError)
                            }
                        })
                    })
                } else if ((override == false && host_allowed == false) || send.typ === 'cw') {
                    var eventDetail = cloneInto(send, document.defaultView)  
                    document.dispatchEvent(new CustomEvent('v1.dispatched_outside', {detail: eventDetail}))
                    return
                } else {
                    send.key = 'v1.geo'
                    send.tabid = tabid
                    send.allow_host = final_out
                    browser.runtime.sendMessage(send).then(handleSuccess, handleError)
                }
            })
        })
    })

    setupBrowserEventListeners()
})()