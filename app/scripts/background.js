const st = require('./storage-vars')

const TAG = "background:: "

browser.runtime.onInstalled.addListener((details) => {
  console.log('previousVersion', details.previousVersion)
})

function geoSendFailure(err, msg, message, code) {
  console.error(err);
  return {
    ts: msg.ts,
    success: false,
    message: message,
    code: code,
    active: msg.active,
    typ: msg.typ
  }
}

function geoSendMessage(data, id) {
  console.log("success:: " + id)
  // add noise
  const bg_vars = require('./background-vars')
  var epsilon
  if (data.enableHighAccuracy) 
    epsilon = bg_vars.epsilon / bg_vars.levels["low"].radius;
  else 
    epsilon = bg_vars.epsilon / bg_vars.levels["medium"].radius;
  const PlanarLaplace = require('./laplace');
  var pl = new PlanarLaplace();

  coords = {
    latitude : data.latitude,
    longitude : data.longitude,
    accuracy : 10
  }

  var noisy = pl.addNoise(epsilon, coords);

  coords.latitude = noisy.latitude;
  coords.longitude = noisy.longitude;
  
  coords.accuracy += Math.round(pl.alphaDeltaAccuracy(epsilon, .9));

  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    success: true,
    ts: data.ts,
    active: data.active,
    typ: data.typ
  }
}

function onMessage(msg, sender, sendResponse) {
  const fTAG = "onPortMessage:: "
  console.log(TAG + fTAG)
  console.log(msg)
	switch (msg.key) {
    case 'v1.console': // params {typ, msg}
      {
        switch (msg.typ) {
          case 'log': { console.log(TAG + fTAG + msg.msg); break; } 
          case 'info': { console.info(TAG + fTAG + msg.msg); break; }
          case 'debug': { console.debug(TAG + fTAG + msg.msg); break; }
          case 'error': { console.error(TAG + fTAG + msg.msg); break; }
          case 'warn': { console.warn(TAG + fTAG + msg.msg); break; }
          case 'trace': { console.trace(TAG + fTAG + msg.msg); break; }
          default: { console.info(TAG + fTAG + msg.msg); break; }
        }
        break;
      }
		case 'v1.injected': // params { href }
			{ 
        console.info(TAG + fTAG + "script injected into ", msg.href)
				break;
      }
    case 'v1.geo': // params { }
      {
        if (! msg.allow_host){
          var ret_data = {}
          ret_data = geoSendFailure(null, msg, "User denied geolocation prompt.", 1)
          ret_data.key = "v1.geo_done"
          console.log(ret_data)
          browser.tabs.sendMessage(sender.tab.id, ret_data, (resp) => {
            console.log(resp)
          })
          return true
        } else {
          console.log("fetching geo")
          fetch("https://am.i.mullvad.net/json")
          .then(response => response.json())
          .then(data => { 
            var ret_data = {}
            data.ts = msg.ts; 
            data.maximumAge = msg.maximumAge;
            data.timeout = msg.timeout;
            data.enableHighAccuracy = msg.enableHighAccuracy; 
            data.active = msg.active
            data.typ = msg.typ
            ret_data = geoSendMessage(data, msg.tabid)
            ret_data.key = "v1.geo_done"
            console.log(ret_data)
            browser.tabs.sendMessage(sender.tab.id, ret_data, (resp) => {
              console.log(resp)
            })
            return true
          }).catch((error) => {
            var ret_data = {}
            console.error(error);
            ret_data = geoSendFailure(error, msg, "Timeout expired!", 3)
            ret_data.key = "v1.geo_done"
            console.log(ret_data)
            browser.tabs.sendMessage(sender.tab.id, ret_data, (resp) => {
              console.log(resp)
            })
            return true
          });
        }
        break
      }
    case 'v1.get_tabid': { console.log(TAG + fTAG + " tabid " + sender.tab.id); 
        return Promise.resolve(sender.tab.id)
      }
    case 'v1.storage': {
      switch (msg.method) {
          case "get": {
            return browser.storage.local.get([msg.method_key]).then((temp_override) => {
              return temp_override[msg.method_key]
            })
          }
          case "get_host": {
            var query = { active: true, currentWindow: true };
            return browser.tabs.query(query).then((tabs) => {
              if (tabs == undefined || tabs[0] == undefined) return Promise.resolve('Unusable tab')
              const url = new URL(tabs[0].url)
              return browser.storage.local.get([url.hostname]).then((temp_site) => {
                return temp_site[url.hostname]
              })
            })
          }
          case "set": {
            var input = {[msg.method_key]: msg.method_value}
            return browser.storage.local.set(input).then(
              (err) => { return err }
            )            
          }
          case "set_host": {
            var query = { active: true, currentWindow: true };
            return browser.tabs.query(query).then((tabs) => {
              if (tabs == undefined || tabs[0] == undefined) return Promise.resolve('Unusable tab')
              const url = new URL(tabs[0].url)
              console.log(url)
              browser.storage.local.set({[url.hostname]: msg.method_value}).then(
                (err) => { return err }
              )
            })
          }
      }
    }
    default:
      {
        console.log(TAG + fTAG + "port message received")
      }
	}
}

function storageChange(changes){
  browser.storage.local.get(st.override_key).then((global) => {
    if (global[st.override_key]) {
      setTabs = (tabs) => {
        for(var i=0;i<tabs.length;i++){
         details = {
            path: {
              19: "images/vpn_location_guard_on_19.png",
              38: "images/vpn_location_guard_on_38.png"
            },
            tabId: tabs[i].id
          }
          browser.browserAction.setIcon(details)
        }
      }
      function onError(error) {
        console.log(`Error: ${error}`);
      }
      let querying = browser.tabs.query({});
      querying.then(setTabs, onError); 
      console.log('setting globally')
    } else { 
      logTabs = (tabs) => {
        for(var i=0;i<tabs.length;i++){
          var url
          var tab = tabs[i] 
          var tu = tab.url
          try {
            if (tu === "chrome://newtab/" || tu === "chrome://new-tab-page/") {
              url = {}
              url.hostname = "newtab"
            } else { url = new URL(tu) }
          } catch (e) {
            console.warn(e)
            continue
          }
          browser.storage.local.get(url.hostname).then((url_obj) => {
              if (url_obj[url.hostname]) {
                details = {
                  tabId: tab.id,
                  path: {
                    19: "images/vpn_location_guard_on_19.png",
                    38: "images/vpn_location_guard_on_38.png"
                  }
                }
              } else {
                details = {
                  tabId: tab.id,
                  path: {
                    19: "images/vpn_location_guard_off_19.png",
                    38: "images/vpn_location_guard_off_38.png"
                  }
                }
              }
              browser.browserAction.setIcon(details)
          })
        }
      }
      function onError(error) {
        console.log(`Error: ${error}`);
      }
      let querying = browser.tabs.query({});
      querying.then(logTabs, onError); 
    }
  })
}

function tabUpdate(tabId, changeInfo, tab) {
  const fTAG = "tabUpdate:: "
  var url
  try {
    var tu = tab.url
    if (tu === "chrome://newtab/" || tu === "chrome://new-tab-page/") {
      url = {}
      url.hostname = "newtab"
    } else { url = new URL(tab.url) }
  } catch (e) {
    console.warn(e)
    return
  }
  browser.storage.local.get(st.override_key).then((global) => {
    if (global[st.override_key]) {
      details = {
        path: {
          19: "images/vpn_location_guard_on_19.png",
          38: "images/vpn_location_guard_on_38.png"
        }
      }
      browser.browserAction.setIcon(details)
    } else {
      browser.storage.local.get(url.hostname).then((active) => {
        if (active[url.hostname]) {
          details = {
            tabId: tabId,
            path: {
              19: "images/vpn_location_guard_on_19.png",
              38: "images/vpn_location_guard_on_38.png"
            }
          }
        } else {
          details = {
            tabId: tabId,
            path: {
              19: "images/vpn_location_guard_off_19.png",
              38: "images/vpn_location_guard_off_38.png"
            }
          }
        }
        browser.browserAction.setIcon(details)
      })
    }
  })
}

function tabCreate(tab){
  tabUpdate(tab.id, null, tab)
}

function setupBrowserEventListeners() {
  browser.runtime.onMessage.addListener(onMessage)
  browser.tabs.onUpdated.addListener(tabUpdate)
  browser.tabs.onCreated.addListener(tabCreate)
  browser.storage.onChanged.addListener(storageChange)
}

function main() {
  setupBrowserEventListeners()
}

main()