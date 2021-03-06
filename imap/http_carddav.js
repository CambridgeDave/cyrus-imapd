/* http_carddav.js -- Admin functions for addressbook list
 *
 * Copyright (c) 1994-2017 Carnegie Mellon University.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in
 *    the documentation and/or other materials provided with the
 *    distribution.
 *
 * 3. The name "Carnegie Mellon University" must not be used to
 *    endorse or promote products derived from this software without
 *    prior written permission. For permission or any legal
 *    details, please contact
 *      Carnegie Mellon University
 *      Center for Technology Transfer and Enterprise Creation
 *      4615 Forbes Avenue
 *      Suite 302
 *      Pittsburgh, PA  15213
 *      (412) 268-7393, fax: (412) 268-7395
 *      innovation@andrew.cmu.edu
 *
 * 4. Redistributions of any form whatsoever must retain the following
 *    acknowledgment:
 *    "This product includes software developed by Computing Services
 *     at Carnegie Mellon University (http://www.cmu.edu/computing/)."
 *
 * CARNEGIE MELLON UNIVERSITY DISCLAIMS ALL WARRANTIES WITH REGARD TO
 * THIS SOFTWARE, INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS, IN NO EVENT SHALL CARNEGIE MELLON UNIVERSITY BE LIABLE
 * FOR ANY SPECIAL, INDIRECT OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN
 * AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING
 * OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 */


// XML constants for requests
var XML_DAV_NS = 'DAV:';
var XML_CARDDAV_NS = 'urn:ietf:params:xml:ns:carddav';
var X_CLIENT = 'Cyrus/%s';  // Version filled in by printf() in http_carddav.c


// Calculate hash of a string
function strHash(str) {
    var i, hash = 0;

    for (i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash <<= 1;
    }

    return hash;
}


// Create a new addressbook collection using data from 'create' form
function createAddressbook(baseurl) {
    var create = document.forms.create.elements;

    if (create.name.value.length === 0) {
        window.alert('New addressbook MUST have a name');
    }

    // Generate addressbook collection name
    var now = new Date();
    var rand = Math.random() * 1000000;
    var url = baseurl + strHash(baseurl).toString(16) +
        '-' + strHash(create.name.value).toString(16) +
        '-' + now.getTime() + '-' + rand.toFixed(0);

    // Build Extended MKCOL document
    var doc = document.implementation.createDocument(XML_DAV_NS,
                                                     "D:mkcol", null);
    var mkcol = doc.documentElement;
    var set = doc.createElementNS(XML_DAV_NS, "D:set");
    mkcol.appendChild(set);

    var props = doc.createElementNS(XML_DAV_NS, "D:prop");
    set.appendChild(props);

    var prop = doc.createElementNS(XML_DAV_NS, "D:resourcetype");
    prop.appendChild(doc.createElementNS(XML_DAV_NS, "D:collection"));
    prop.appendChild(doc.createElementNS(XML_CARDDAV_NS, "C:addressbook"));
    props.appendChild(prop);

    prop = doc.createElementNS(XML_DAV_NS, "D:displayname");
    prop.appendChild(doc.createTextNode(create.name.value));
    props.appendChild(prop);

    if (create.desc.value.length !== 0) {
        prop = doc.createElementNS(XML_CARDDAV_NS, "C:addressbook-description");
        prop.appendChild(doc.createTextNode(create.desc.value));
        props.appendChild(prop);
    }

    // Send MKCOL request (minimal response)
    var req = new XMLHttpRequest();
    req.open('MKCOL', url, false);
    req.setRequestHeader('X-Client', X_CLIENT);
    req.setRequestHeader('Prefer', 'return=minimal');
    req.send(doc);

    // Refresh addressbook list
    document.location.replace(baseurl);
}


// [Un]share an addressbook collection ([un]readable by 'anyone')
function shareAddressbook(url, share) {
    // Build DAV sharing document
    var doc = document.implementation.createDocument(XML_DAV_NS,
                                                     "D:share-resource", null);
    var root = doc.documentElement;

    var sharee = doc.createElementNS(XML_DAV_NS, "D:sharee");
    root.appendChild(sharee);

    var href = doc.createElementNS(XML_DAV_NS, "D:href");
    href.appendChild(doc.createTextNode("DAV:all"));
    sharee.appendChild(href);

    var access = doc.createElementNS(XML_DAV_NS, "D:share-access");
    access.appendChild(doc.createElementNS(XML_DAV_NS,
                                           share ? "D:read" : "D:no-access"));
    sharee.appendChild(access);

    // Send POST request
    var req = new XMLHttpRequest();
    req.open('POST', url);
    req.setRequestHeader('X-Client', X_CLIENT);
    req.setRequestHeader('Content-Type', 'application/davsharing+xml');
    req.send(doc);
}


// Delete an addressbook collection
function deleteAddressbook(url, name) {
    if (window.confirm('Are you sure you want to delete addressbook \"' +
                       name + '\"?')) {
        // Send DELETE request
        var req = new XMLHttpRequest();
        req.open('DELETE', url, false);
        req.setRequestHeader('X-Client', X_CLIENT);
        req.send(null);

        // Refresh addressbook list
        var baseurl = url.substring(0, url.lastIndexOf("/") + 1);
        document.location.replace(baseurl);
    }
}

// EOF (%u bytes)
 
