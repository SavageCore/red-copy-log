// ==UserScript==
// @name         Gazelle Copy Log
// @namespace    https://savagecore.eu
// @version      0.2.1
// @description  Right click View Log to copy to clipboard
// @author       SavageCore
// @include      http*://redacted.ch/torrents.php?id=*
// @include      http*://apollo.rip/torrents.php?id=*
// @include      http*://notwhat.cd/torrents.php?id=*
// @grant        GM_setClipboard
// @grant        GM_addStyle
// ==/UserScript==

/* global document window GM_setClipboard GM_addStyle */

(function () {
	'use strict';

	let site;
	let logLinkSelector;

	if (/https?.*?redacted\.ch.*/.test(document.URL)) {
		site = 'redacted';
		logLinkSelector = 'a:nth-child(2)';
	} else if (/https?.*?apollo\.rip.*/.test(document.URL)) {
		site = 'apollo';
		logLinkSelector = 'a:nth-child(2)';
	} else if (/https?.*?notwhat\.cd.*/.test(document.URL)) {
		site = 'notwhat';
		logLinkSelector = 'a:nth-child(3)';
	}

	GM_addStyle('.scSuccess{color:#66BB6A !important}'); // eslint-disable-line new-cap

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
		if (torrentLinkbox[index].innerHTML.toLowerCase().indexOf('view log') !== -1) {
			const torrentElm = torrentLinkbox[index].querySelector(logLinkSelector);
			torrentElm.addEventListener('contextmenu', getLogFile, false);
		}
	}

	function getLogFile(evt) {
		let torrentId;
		let logSelector;
		let logFile;

		// Retrieve torrentId
		switch (site) {
			case 'apollo':
				torrentId = /show_logs\('([0-9]+)',.+\)/.exec(evt.target.outerHTML);
				logSelector = '#viewlog_' + torrentId[1];
				break;
			case 'redacted':
				torrentId = /show_logs\('([0-9]+)'\)/.exec(evt.target.outerHTML);
				logSelector = '#logs_' + torrentId[1];
				break;
			case 'notwhat':
				torrentId = /show_log\('([0-9]+)'\)/.exec(evt.target.outerHTML);
				logSelector = '#log_' + torrentId[1];
				break;
			default:
				break;
		}

		// Load log by clicking element
		evt.target.click();
		const logElem = document.querySelector(logSelector);

		logFile = logElem.querySelectorAll('pre');
		if (logFile[0]) {
			evt.target.click();
			copyLogtoClipboard(logFile[logFile.length - 1], evt.target);
		} else {
			// Observe element waiting for log to load
			observeDOM(logElem, () => {
				// Get log file pre element
				logFile = logElem.querySelectorAll('pre');
				if (logFile) {
					evt.target.click();
					copyLogtoClipboard(logFile[logFile.length - 1], evt.target);
				}
			});
		}
	}

	function copyLogtoClipboard(logFile, target) {
		GM_setClipboard(logFile.innerText); // eslint-disable-line new-cap
		target.classList.toggle('scSuccess');
		setTimeout(() => {
			target.classList.toggle('scSuccess');
		}, 1500);
	}
})();
