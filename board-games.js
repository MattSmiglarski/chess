// SECTION: Utilities
function addClass(el, cls) {
    if (!el.className.match(cls)) {
	el.className += " " + cls;
    }
}

function removeClass(el, cls) {
    el.className = el.className.replace(cls, '');
}

function inArray(value, array) {
    // FIXME: Use Array.contains.
    for (var i=0; i<array.length; i++) {
	if (array[i] === value) {
	    return value;
	}

    }
    return null;
}

function is_empty(td) {
    return td && !td.innerText.match(regex_select_chess_piece);
}
