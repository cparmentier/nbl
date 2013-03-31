/*
 * NBL: Non Blocking Lazy loader v4.0
 * Copyright (c) 2010 Berklee. Additional input from Knowlecules. CSS callback bug fix, additional code reduction by Richard Lopes.
 * Licensed under the MIT license.
 *
 * Date: 2010-09-24
 Loading:
<script id="nbljs">
var _nbl = _nbl || [], nbl = { l : function(s, f){ _nbl.push([s, f]); }, q : { } };
setTimeout(function(){
	var s = document.createElement("script");
	s.src = "nbl.plus.js";
	var p = document.getElementById( "nbljs" );
	p.parentNode.insertBefore(s, p);
}, 0);
</script>
*/
 
// ==ClosureCompiler==
// @output_file_name default.js
// @compilation_level ADVANCED_OPTIMIZATIONS
// ==/ClosureCompiler==
 

/*jslint browser: true, white: true, eqeq: true, plusplus: true */
 
/**
 * @constructor
 */
(function (document) {
    "use strict";
    var loadedScripts = {},  // The dictionary that will hold the loaded script
	onLoadedScripts = {},
        noop = function(){},
        addScript, loadItems,
        head = document.head || document.body || document.documentElement,
        // The loader function
        //
        // Called with an array, it will interpret the options array
        // Called without an array it will try to load the options from the script-tag's data-nbl attribute
        /**
         * @param {*=} params
         * @param {*=} callback
         */
        load = function(params, callback) {
            	
		for (var i=0; i<_nbl.length; i++) {
			name = _nbl[i][0].replace(/.+\/|\.min\.js|\.js|\?.+|\W/gi, '');
			if (typeof onLoadedScripts[name] == "undefined"){
				onLoadedScripts[name] = [];
			}
			onLoadedScripts[name].push(_nbl[i][1]);
		}
	
		if (!params) {
			var j=0, scripts = document.getElementsByTagName("script"); // Get all script tags in the current document
			while (j < scripts.length) {
			    /*jslint evil:true */
			    params = eval("("+scripts[j].getAttribute("data-nbl")+")");
			    if (params) { // Check for the data-nbl attribute
			        head = scripts[j].parentNode;
			        break;
			    }
			    j++;
			}
		}
		if (params) {
			loadItems(params, callback||noop);
		} 
        };
        loadItems = function(item, callback){
            var itemType = typeof item;
            if (itemType == 'string') {
                addScript(item, callback);
            } else if (item instanceof Array) { // list
                /*jslint vars: true */
                var i, pending = item.length,
                    loaded = function(){
                        if (!--pending) {
                            callback();
                        }
                    };
                for (i=0; i<item.length; i++) {
                    loadItems(item[i], loaded);
                }
            } else if (itemType == 'function') {
                // call function, he will later call callback
                item(callback);
            } else if (itemType == 'object' && item['load']) {
                loadItems(item['load'], function(){
                    // first call explicit callback for this item
                    if (item['callback']) { // use ['xyz'] form for Google Closure
                        item['callback']();
                    }
                    // continue loading next items, then trigger parent callback
                    if (item['then']) {
                        loadItems(item['then'], callback);
                    } else {
                        callback();
                    }
                });
            } else {
                throw 'Bad item type '+ item;
            }
        };
        addScript = function(item, handler) {
            /*jslint regexp: true*/
            var tag, type,
                // remove extension
                name = item.replace(/.+\/|\.min\.js|\.js|\?.+|\W/gi, ''),
                // 
                loadTypes = {'j': {tagname: "script", attr: "src"},
                    'cs': {tagname: "link", attr: "href", relat: "stylesheet"},
                    'i': {tagname: "img", attr: "src"}}, // Clean up the name of the script for storage in the queue
                loaded = function(){
                    loadedScripts[name] = true; // add this script to loaded scripts list
                    for (var i=0; i<onLoadedScripts[name].length; i++) {
						onLoadedScripts[name][i]();
					}
                };
	type = item.match(/\.(cs|j)s($|\?)/i);
	type = type ? type[1] : "i";
	if(loadedScripts[name]) {
		// don't readd script if script already added
		return function(){
			if(handler){ handler();}
		}
	}				
	if (typeof onLoadedScripts[name] == "undefined"){
		onLoadedScripts[name] = [];
	}
	if(handler){
		onLoadedScripts[name].push(handler);
	}
	tag = document.createElement(loadTypes[type].tagname);
	tag.setAttribute(loadTypes[type].attr, item);
	// Fix: CSS links do not fire onload events - Richard Lopes
	// Images do. Limitation: no callback function possible after CSS loads
	if (loadTypes[type].relat) {
		tag.setAttribute("rel", loadTypes[type].relat);
		loaded();
	} else {
	// When this script completes loading, it will trigger a callback function consisting of two things:
	// 1. It will call nbl.l() with the remaining items in u[1] (if there are any)
	// 2. It will execute the function l (if it is a function)
		tag.onload = tag.onreadystatechange = function(){
		    var s = this;
		    if ( !s.readyState || /de|te/.test( s.readyState ) ) {
		        // setting `onreadystatechange` to 0 raises an error in IE6/7/8
		        s.onload = s.onreadystatechange = noop;
		        loaded(); // On completion execute the callback function as defined above
		    }
		};
	}
	head.appendChild(tag); // Add the script to the document
};
window["nbl"] = {'l':load, 'q':loadedScripts};
load();
}(document));
