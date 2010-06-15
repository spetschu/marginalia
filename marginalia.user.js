// ==UserScript==
// @name		   KindleNotes
// @namespace	   http://github.com/findango/marginalia
// @description    Improve the kindle notes and highlights page.
// @include		   http://kindle.amazon.com/your_highlights
// @include		   http://kindle.amazon.com/work/*
// @include		   http://kindle.amazon.com/refresh/*
// @resource	   kindlestyle http://github.com/findango/marginalia/raw/master/kindlestyle.css
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.js
// ==/UserScript==


hideDefaultIcons = true // hide the default quote icon for entries you haven't annotated
spacerImage = "http://github.com/spetschu/marginalia/raw/master/images/spacer.jpg"

// Ideally, images should be 22x18 pixels although larger ones will be squashed down to that size.
tags = {
	'q'  : "http://github.com/spetschu/marginalia/raw/master/images/q.png",
	'qq' : "http://github.com/spetschu/marginalia/raw/master/images/qq.png",
	'b'  : "http://github.com/spetschu/marginalia/raw/master/images/b.png",
	'bb' : "http://github.com/spetschu/marginalia/raw/master/images/bb.png",
	'qb' : "http://github.com/spetschu/marginalia/raw/master/images/qb.png",
	'bq' : "http://github.com/spetschu/marginalia/raw/master/images/bq.png",
	'd'  : "http://github.com/spetschu/marginalia/raw/master/images/d.png",
	'ch' : "http://github.com/spetschu/marginalia/raw/master/images/ch.png",
	's'  : "http://github.com/spetschu/marginalia/raw/master/images/ch.png",
	'/'  : "http://github.com/spetschu/marginalia/raw/master/images/bar.png"
}

//--------- do not edit below unless you know what you're doing ------

if (typeof GM_getResourceText == 'function') {
	addGlobalStyle(GM_getResourceText("kindlestyle"))
}
console.log('Parsing notes')
$(document).ready(function() {
	summarizeLongHighlights()
	handleNotesAndHighlights() // TODO: rewrite using jquery
});

function addGlobalStyle(css) {
	var head, style;
	head = document.getElementsByTagName('head')[0];
	if (!head) { return; }
	style = document.createElement('style');
	style.type = 'text/css';
	style.innerHTML = css;
	head.appendChild(style);
}

function handleNotesAndHighlights() {
	var allDivs = xpath("//div[@class='highlightRow personalHighlight'] | //div[@class='highlightRow yourHighlight']", document);
	for (var i = 0; i < allDivs.snapshotLength; i++) {
		var thisDiv = allDivs.snapshotItem(i)
		var noteSpan = xpath( ".//span[@class='noteContent']", thisDiv).snapshotItem(0)
		var noteText = noteSpan.innerHTML
		console.log('Found note: ' + noteText)
		var annotation = parseAnnotation(noteText)
		var img = xpath( ".//img[@class='quote removableQuote']", thisDiv).snapshotItem(0)
		if (annotation) {
			handleSpecialAnnotations(annotation, thisDiv)
			noteSpan.innerHTML = annotation['note']
		}
		if(img) {
			img.width = 22
			img.height = 18
			if (annotation) {
				img.src = annotation['img']
			} else if (hideDefaultIcons) {
				img.src = spacerImage
			}
		}
	}
}

function parseAnnotation(noteText) {
	var result = noteText.match(/^\.([\w\/]+)(\s+|$)(.*)/)
	if (result) {
		if (tags[result[1]]) {
			return { 'tag' : result[1], 'img' : tags[result[1]], 'note' : result[3] }
		} else {
			console.log('Unknown tag: ' + result[1])
		}
	}
}

function summarizeLongHighlights() {
	$('span.highlight').each(function() {
     	var original = $(this).text()
     	var summarized = original.substring(0, 50)
     	$(this).attr('content', original)
     	$(this).text(summarized)
	});

	// ensure dynamic content is dealt with
	$('span.highlight').change(function() {
     	var span = $('span.highlight')
     	var original = span.text()
     	var summarized = original.substring(0, 50)
     	span.attr('content', original)
     	span.text(summarized)
	});
	
	// toggle full/summarized text
	$('span.highlight').click(function() {
     	console.log('Clicked on span')
     	var original = $(this).attr('content')
     	var body = $(this).text()  
     	if (body.length < original.length) {
          	$(this).text(original)
     	} else {
          	var summarized = summarizeContent(body)
          	$(this).text(summarized)
     	}
	});
}

// Do any fancy processing of tags here. This method potentially modifies both the 
// annotation and the span. It is a manky mix of side effects and poking at private 
// parts, but at least it is all in one place.
// somechange
function handleSpecialAnnotations(annotation, div) {
	// TESTING summarize for all entries
	//if (annotation['tag'] == '/') {
		var highlightSpan = xpath( ".//span[@class='highlight']", div).snapshotItem(0)
		var original = highlightSpan.innerHTML
		if (original.length > 450) {
			// summarize the note if it is long and put the full version in an on-mouse-over span
			highlightSpan.title = original
			summaryLength = original.length * 0.15
			summaryLength = (summaryLength > 150) ? 150 : summaryLength
			summarized = original.substr(0, summaryLength) + ' .... '
			summarized += original.substr(original.length - summaryLength)
			highlightSpan.innerHTML = summarized
		}
	//} END TESTING
}

function xpath(path, context) {
	if (context == null) { context = document }
	return document.evaluate(path, context, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
}


