(function () {
    var fTAG = "actualCode:: "
    var cbs0 = {}
    var cbs1 = {}
    var ids = {}
    var watch_wait = 2000
    var perm_status
    var PermStates = {
        denied: 'denied',
        prompt: 'prompt',
        granted: 'granted',
    }

    const promiseTimeout = function (ms, promise) {
        // Create a promise that rejects in <ms> milliseconds
        let timeout = new Promise((resolve, reject) => {
            let id = setTimeout(() => {
                clearTimeout(id);
                reject('Timed out in ' + ms + 'ms.')
            }, ms)
        })

        // Returns a race between our timeout and the passed in promise
        return Promise.race([
            promise,
            timeout
        ])
    }

    function geoSuccess(data) {
        position = {}
        position.timestamp = Date.now()
        position.coords = {
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
        };
        var f = cbs0[data.ts]
        if (typeof f === "function")
            f(position)
    }

    function geoFailure(data) {
        var f = cbs1[data.ts]
        if (typeof f === "function")
            f({
                code: data.code,
                message: data.message
            })
    }

    var pem = navigator.permissions
    if (pem) {
        pem.query = navigator.permissions.query
    }

    var geo = navigator.geolocation
    if (geo) {
        geo.navGeoGCP = navigator.geolocation.getCurrentPosition
        geo.navGeoWP = navigator.geolocation.watchPosition
        geo.navGeoCW = navigator.geolocation.clearWatch
    }

    function geoOriginal(data) {
        let ts = data.ts
        var opts = {}
        if (data.typ !== 'wc') {
            if (data.maximumAge) opts.maximumAge = data.maximumAge
            if (data.timeout) opts.timeout = data.timeout
            if (data.enableHighAccuracy) opts.enableHighAccuracy = data.enableHighAccuracy
        }
        if (data.typ === 'gcp') {
            if (opts === {}) geo.navGeoGCP(cbs0[ts], cbs1[ts])
            else geo.navGeoGCP(cbs0[ts], cbs1[ts], opts)
        } else if (data.typ === 'wp') {
            if (opts === {}) return geo.navGeoGCP(cbs0[ts], cbs1[ts])
            else return geo.navGeoGCP(cbs0[ts], cbs1[ts], opts)
        } else if (data.typ === 'cw') {
            clearInterval(data.id)
        }
    }

    if (navigator.permissions) {
        navigator.permissions.query = (query) => {
            if (query.name === "geolocation") {
                options = {}
                options.typ = 'ps'
                options.hostname = location.hostname
                perm_status = undefined
                document.dispatchEvent(new CustomEvent('v1.dispatched_inside', {
                    detail: options
                }))
                var perm_status_promise = new Promise(function (resolve, reject) {
                    (function myWait() {
                        if (perm_status) return resolve({
                            state: perm_status,
                            onchange: null
                        });
                        setTimeout(myWait, 50);
                    })();
                });
                return promiseTimeout(5000, perm_status_promise).catch(() => {
                    return Promise.resolve({
                        state: PermStates.prompt,
                        onchange: null
                    })
                })
            } else {
                return pem.query(query)
            }
        }
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition = (success, error, options) => {
            if (options === undefined) options = {}
            var ts = Date.now()
            cbs0[ts] = success
            cbs1[ts] = error
            options.ts = ts
            options.typ = 'gcp'
            options.hostname = location.hostname
            document.dispatchEvent(new CustomEvent('v1.dispatched_inside', {
                detail: options
            }))
            return 0
        }
        navigator.geolocation.watchPosition = (success, error, options) => {
            if (options === undefined) options = {}
            var ts = Date.now()
            cbs0[ts] = success
            cbs1[ts] = error
            options.ts = ts
            options.typ = 'wp'
            options.hostname = location.hostname
            let id = setInterval(() => {
                document.dispatchEvent(new CustomEvent('v1.dispatched_inside', {
                    detail: options
                }))
            }, watch_wait)
            ids[ts] = id
            return id
        }
        navigator.geolocation.clearWatch = function (id) {
            options = {}
            options.typ = 'cw'
            options.id = id
            options.hostname = location.hostname
            document.dispatchEvent(new CustomEvent('v1.dispatched_inside', {
                detail: options
            }))
            return 0
        }
    }

    document.addEventListener('v1.dispatched_outside', (data) => {
        var fTAG = "addEventListener:: "
        var send = data.detail
        if (!send) return
        if (send.active == true) {
            if (send.typ === "gcp" || send.typ === "wp") {
                send.success ? geoSuccess(send) : geoFailure(send)
            } else if (send.typ === "cw") {
                clearInterval(send.id)
            } else if (send.typ === "ps") {
                perm_status = PermStates.granted
            }
        } else if (send.active == false) {
            if (send.typ === "ps") {
                perm_status = PermStates.denied
            } else {
                geoOriginal(send)
            }
        } else if (send.active == undefined) {
            if (send.typ === "ps") {
                perm_status = PermStates.prompt
            }
        }
    })

    require('./sweetalert.min')
    var s = document.getElementById('__vlg_script');
    if (s) s.remove();
})();