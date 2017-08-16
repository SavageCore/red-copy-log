// ==UserScript==
// @name         RED Copy Log
// @namespace    https://savagecore.eu
// @version      0.1.0
// @description  Right click View Log to copy to clipboard
// @author       SavageCore
// @include      http*://redacted.ch/torrents.php?id=*
// @grant        GM_setClipboard
// ==/UserScript==
//
/* global document window GM_setClipboard */

(function () {
	'use strict';

	// Observe DOM function
	// https://stackoverflow.com/a/14570614/1190476
	const observeDOM = (function () {
		const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
		const eventListenerSupported = window.addEventListener;

		return function (obj, callback) {
			if (MutationObserver) {
				const obs = new MutationObserver(mutations => {
					if (mutations[0].addedNodes.length > 0 || mutations[0].removedNodes.length > 0) {
						callback();
					}
				});
				obs.observe(obj, {childList: true, subtree: true});
			} else if (eventListenerSupported) {
				obj.addEventListener('DOMNodeInserted', callback, false);
				obj.addEventListener('DOMNodeRemoved', callback, false);
			}
		};
	})();

	// Find and register event handler on View Log links
	const torrentLinkbox = document.body.querySelectorAll('td > div.linkbox');
	let index = 0;
	for (index = 0; index < torrentLinkbox.length; index++) {
		if (torrentLinkbox[index].innerHTML.indexOf('View Log') !== -1) {
			const torrentElm = torrentLinkbox[index].querySelector('a:nth-child(2)');
			torrentElm.addEventListener('contextmenu', copyLogtoClipboard, false);
		}
	}

	function copyLogtoClipboard(evt) {
		// Retrieve torrentId
		const torrentId = /show_logs\('([0-9]+)'\)/.exec(evt.target.outerHTML);

		// Load log by clicking element
		evt.target.click();
		// Hide it again
		const logElem = document.querySelector('#logs_' + torrentId[1]);
		logElem.classList.toggle('hidden');

		// Observe element waiting for log to load
		observeDOM(logElem, () => {
			// Get log file pre element
			const logFile = logElem.children[logElem.children.length - 1].querySelector('pre');
			if (logFile) {
				// Add log to clipboard
				GM_setClipboard(logFile.innerText); // eslint-disable-line new-cap
			}
		});
	}
})();
