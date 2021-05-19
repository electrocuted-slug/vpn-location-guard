'use strict';

(() => {
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

    const ij = require('./jumpinpage')

    var code =
        "(" + ij + ")();" +
        insertScript(true, code)

    var s = document.getElementById('__vlg_script')
    if (s) {
        s.remove()
        var url = browser.runtime.getURL("scripts/jumpinpage.js")
        insertScript(false, url);
    }

    var st = require('./storage-vars')
    var Swal = require('./sweetalert2.all.min')
    var img_uris_trees = require('./img-uris-trees')
    var img_uri;
    var audio_uri;
    var img_uris_nyan = require('./img-uris-nyan')
    var img_uris_vader = require('./img-uris-vader')
    var img_uris_yoda = require('./img-uris-yoda')
    var audio_uris_nyan = require('./audio-uris-nyan')
    var audio_uris_vader = require('./audio-uris-vader')
    var audio_uris_yoda = require('./audio-uris-yoda')
    var pending_request = false;

    if (typeof (browser) === 'undefined')
        window.browser = chrome;

    function docListener() {
        document.addEventListener('v1.dispatched_inside', (data) => {
            var send = data.detail
            browser.storage.local.get(st.override_key).then((active) => {
                let override = active[st.override_key]
                browser.storage.local.get(send.hostname).then((allowed) => {
                    browser.storage.local.get(st.audio_key).then((audio_result) => {
                        let play_audio = audio_result[st.audio_key]
                        browser.storage.local.get(st.character_key).then((character_result) => {
                            let character_pick = character_result[st.character_key]
                            let host_allowed = allowed[send.hostname]
                            let spoof = null
                            if (host_allowed == true || override == true) spoof = true
                            if (spoof == null && host_allowed == false) spoof = false
                            if (spoof != true && spoof != false) spoof = undefined
                            send.active = spoof
                            send.tabid = tabid
                            if (spoof == false || send.typ === 'ps' || send.typ == 'cw') {
                                var eventDetail = typeof cloneInto === "function" ? cloneInto(send, document.defaultView) : send
                                document.dispatchEvent(new CustomEvent('v1.dispatched_outside', {
                                    detail: eventDetail
                                }))
                            } else if (spoof == undefined) {
                                if (pending_request == false) {
                                    pending_request = true
                                    if (character_pick === "nyan") {
                                        img_uri = img_uris_nyan
                                        audio_uri = audio_uris_nyan
                                    } else if (character_pick === "yoda") {
                                        img_uri = img_uris_yoda
                                        audio_uri = audio_uris_yoda
                                    } else {
                                        img_uri = img_uris_vader
                                        audio_uri = audio_uris_vader
                                    }
                                    var loopy
                                    if (play_audio) {
                                        if (character_pick === "nyan") {
                                            var audio = new Audio(audio_uri.intro);
                                            audio.play()
                                            loopy = new Audio(audio_uri.loop)
                                            audio.addEventListener('ended', () => {
                                                loopy.loop = true
                                                if (pending_request) loopy.play();
                                            })
                                        } else {
                                            loopy = new Audio(audio_uri.loop)
                                            loopy.loop = true;
                                            loopy.play();
                                        }
                                    }
                                    Swal.fire({
                                        title: "Share FAKE location for " + send.hostname + " ?",
                                        text: "You can change this later by clicking the app icon.",
                                        icon: 'info',
                                        showCancelButton: true,
                                        confirmButtonColor: 'rgb(0, 204, 79)',
                                        cancelButtonColor: 'rgb(239, 42, 16)',
                                        confirmButtonText: 'Yes',
                                        background: '#fff url(' + img_uris_trees.main + ')',
                                        backdrop: `
                                rgba(0,0,123,0.4)
                                url(` + img_uri.main + `)
                                left top
                                no-repeat
                            `
                                    }).then((result) => {
                                        if (result.value) {
                                            Swal.fire({
                                                title: 'Sharing FAKE Location',
                                                text: 'Always share FAKE location?',
                                                icon: 'success',
                                                showCancelButton: true,
                                                confirmButtonColor: 'rgb(0, 204, 79)',
                                                cancelButtonColor: 'rgb(232, 214, 0)',
                                                confirmButtonText: 'Yes',
                                                background: '#fff url(' + img_uris_trees.main + ')',
                                                backdrop: `
                                        rgba(0,0,123,0.4)
                                        url(` + img_uri.main + `)
                                        left top
                                        no-repeat
                                    `
                                            }).then((res) => {
                                                spoof = res.value
                                                send.active = spoof
                                                browser.storage.local.set({
                                                    [send.hostname]: spoof
                                                }).then((err) => {
                                                    if (err) console.error(err)
                                                    else {
                                                        send.key = 'v1.geo'
                                                        send.tabid = tabid
                                                        send.allow_host = spoof
                                                        browser.runtime.sendMessage(send)
                                                    }
                                                    loopy.pause()
                                                    pending_request = false
                                                })
                                            })
                                        } else {
                                            Swal.fire({
                                                title: 'Warning!',
                                                text: 'This site might access your REAL geolocation (even with a VPN).\n Continue?',
                                                icon: 'warning',
                                                showCancelButton: true,
                                                confirmButtonColor: 'rgb(239, 42, 16)',
                                                cancelButtonColor: 'rgb(232, 214, 0)',
                                                confirmButtonText: 'Continue',
                                                background: '#fff url(' + img_uris_trees.main + ')',
                                                backdrop: `
                                        rgba(0,0,123,0.4)
                                        url(` + img_uri.main + `)
                                        left top
                                        no-repeat
                                    `
                                            }).then((res) => {
                                                if (res.value) spoof = false
                                                else spoof = undefined
                                                send.active = spoof
                                                browser.storage.local.set({
                                                    [send.hostname]: spoof
                                                }).then((err) => {
                                                    if (err) console.error(err)
                                                    else {
                                                        send.key = 'v1.geo'
                                                        send.tabid = tabid
                                                        send.allow_host = spoof
                                                        browser.runtime.sendMessage(send)
                                                    }
                                                    loopy.pause()
                                                    pending_request = false
                                                })
                                            })
                                        }
                                    })
                                }
                            } else if (spoof == true) {
                                send.key = 'v1.geo'
                                send.tabid = tabid
                                send.allow_host = spoof
                                browser.runtime.sendMessage(send)
                            } else {
                                // you broke the matrix congrats!
                            }
                        })
                    })
                })
            })
        })
    }

    var TAG = "contentscript:: "
    var tabid

    var messageListener = (data, sender, sendResponse) => {
        if (data.key === "v1.geo_done") {
            var eventDetail = typeof cloneInto === "function" ? cloneInto(data, document.defaultView) : data
            document.dispatchEvent(new CustomEvent('v1.dispatched_outside', {
                detail: eventDetail
            }))
        }
        return Promise.resolve("v1.geo_done good")
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
})();