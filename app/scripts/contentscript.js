(() => {
    var inject = require('./inject')

    function insertScript(inline, data) {
        var script = document.createElement('script');
        script.setAttribute('id', '__vlg_script');
        if (inline)
            script.appendChild(document.createTextNode(data));
        else
            script.setAttribute('src', data);

        var _parent = document.head || document.body || document.documentElement;
        var firstChild = (_parent.childNodes && (_parent.childNodes.length > 0)) ? _parent.childNodes[0] : null;
        if (firstChild)
            _parent.insertBefore(script, firstChild);
        else
            _parent.appendChild(script);
    }

    var code =
        "(" + inject + ")();" +
        insertScript(true, code)

    var s = document.getElementById('__vlg_script')
    if (s) {
        s.remove()
        var url = browser.runtime.getURL("scripts/inject.js")
        insertScript(false, url);
    }

    var st = require('./storage-vars')

    if (typeof (browser) === 'undefined')
        window.browser = chrome;

    function docListener() {
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
                        if (send.typ === 'ps') {
                            send.active = undefined
                            var eventDetail = typeof cloneInto === "function" ? cloneInto(send, document.defaultView) : send
                            document.dispatchEvent(new CustomEvent('v1.dispatched_outside', {
                                detail: eventDetail
                            }))
                            return
                        }
                        swal({
                            title: "Share FAKE location for " + send.hostname + " ?",
                            text: "You can change this later back clicking the app icon.",
                            icon: "info",
                            buttons: true
                        }).then((decision) => {
                            if (decision) final_out = true
                            else final_out = false
                            send.active = final_out
                            browser.storage.local.set({
                                [send.hostname]: final_out
                            }).then((err) => {
                                if (err) console.error(err)
                                else {
                                    send.key = 'v1.geo'
                                    send.tabid = tabid
                                    send.allow_host = final_out
                                    browser.runtime.sendMessage(send).then(handleSuccess, handleError)
                                }
                            })
                        })
                    } else if ((override == false && host_allowed == false) || send.typ === 'cw') {
                        var eventDetail = typeof cloneInto === "function" ? cloneInto(send, document.defaultView) : send
                        document.dispatchEvent(new CustomEvent('v1.dispatched_outside', {
                            detail: eventDetail
                        }))
                        return
                    } else {
                        if (send.typ === 'ps') {
                            var eventDetail = typeof cloneInto === "function" ? cloneInto(send, document.defaultView) : send
                            document.dispatchEvent(new CustomEvent('v1.dispatched_outside', {
                                detail: eventDetail
                            }))
                            return
                        }
                        send.key = 'v1.geo'
                        send.tabid = tabid
                        send.allow_host = final_out
                        browser.runtime.sendMessage(send).then(handleSuccess, handleError)
                    }
                })
            })
        })
    }

    var TAG = "contentscript:: "
    var tabid

    messageListener = (data, sender, sendResponse) => {
        if (data.key === "v1.geo_done") {
            handleSuccess(data)
        }
        return Promise.resolve("v1.geo_done good")
    }

    handleSuccess = (send) => {
        var eventDetail = typeof cloneInto === "function" ? cloneInto(send, document.defaultView) : send
        document.dispatchEvent(new CustomEvent('v1.dispatched_outside', {
            detail: eventDetail
        }))
    }

    handleError = (er) => {
        console.error(er)
    }

    function setupBrowserEventListeners() {
        browser.runtime.sendMessage({
            key: 'v1.get_tabid'
        }).then((resp) => {
            tabid = resp
        })
        docListener()
        browser.runtime.onMessage.addListener(messageListener);
        browser.runtime.sendMessage({
            key: 'v1.injected',
            href: location.href,
            tabid: tabid
        })
    }

    setupBrowserEventListeners()
})()