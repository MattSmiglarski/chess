window.onload = function () {
    t = t || document.body.getElementsByTagName('table')[0];
    initialise_grid();
    piece_hints();
}

var pieces = {
    'white chess king' : '&#9812;',
    'white chess queen' : '&#9813;',
    'white chess rook' : '&#9814;',
    'white chess bishop' : '&#9815;',
    'white chess knight' : '&#9816;',
    'white chess pawn' : '&#9817;',
    'black chess king' : '&#9818;',
    'black chess queen' : '&#9819;',
    'black chess rook' : '&#9820;',
    'black chess bishop' : '&#9821;',
    'black chess knight' : '&#9822;',
    'black chess pawn' : '&#9823;'
};

var t,g;
var white_piece = /[\u2654-\u2659]/;
var black_piece = /[\u265A-\u265F]/;
var regex_select_chess_piece = /^.*([\u2654-\u265F]).*$/;

function get_cell(x, y) {
    if (x < 0 || x > 7 || y < 0 || y > 7) return null;
    return t.rows[x] && t.rows[x].cells[y];
}

function set_cell(value, x, y) {
    get_cell(x, y).innerHTML = '<span>' + value + '</span>';
}

function create_game_info() {
    return {
	"player" : "WHITE",
	"phase" : "INITIAL",
	};
   }

function addClass(el, cls) {
    if (!el.className.match(cls)) {
	el.className += " " + cls;
    }
}

function removeClass(el, cls) {
    el.className = el.className.replace(cls, '');
}

function valid_piece(td) {
    return td.childNodes.length && td.childNodes[0].innerText.match(white_piece);
}

function create_cell_callback_select(td) {
    return function(evt) {
	switch (g.phase) {
	case 'INITIAL': {
	    if (valid_from_move(td)) {
		addClass(td, 'select');
		g.phase = 'FROM_SELECTED';
		g.from = td;
	    } else {
		indicate_error(td);
	    }
	    break;
	} case 'FROM_SELECTED': {
	    if (valid_to_move(td)) {
		td.innerHTML = g.from.innerHTML;
		g.from.innerHTML = '';
		g.phase = 'BLACK_INITIAL';
		removeClass(g.from, 'select');
		g.from =  null;
	    } else { 
		g.phase = 'INITIAL';
		removeClass(g.from, 'select');
		g.from = null;
	    }
	    break;
	} case 'BLACK_INITIAL': {
	    
	    break;
	} default: {
	    console.log('Programmer error! Unknown state: ' + g.phase);
	}
    }}
}

function create_cell_callback(td) {
    return function(evt) {
	var i,hints;
	if (valid_piece(td)) {
	    addClass(td, 'reverse');

	    hints = targets(td);
	    for (i=0; i<hints.length; i++) {
		addClass(hints[i], 'hint');
	    }
	}
    }
}

function create_cell_callback_cancel(td) {
    return function(evt) {
	var hints = targets(td);
	for (i=0; i<hints.length; i++) {
	    removeClass(hints[i], 'hint');
	}
	removeClass(td, 'reverse');
    }
}

function grid_column(col) {
    var i, result = [];
    for (i=0; i<8; i++) {
	result[i] = get_cell(i, col);
    }
    return result;
}

function grid_row(row) {
    var i, result = [];
    for (i=0; i<8; i++) {
	result[i] = get_cell(row, i);
    }
    return result;
}

function grid_diagonals(row, col) {
    var i, result = [];
    for (i=0; i<8; i++) {
	result[4*i + 0] = get_cell(row-i, col-i);
	result[4*i + 1] = get_cell(row-i, col+i);
	result[4*i + 2] = get_cell(row+i, col-i);
	result[4*i + 3] = get_cell(row+i, col+i);
    }
    return result;
}

/**

Target Functions.

The following functions each return an array of td's given a row & column.
The returned td array will take into account the value of the piece but no board state.

In other words, they could be rewritten as macros.
 **/

/**
One square, in any direction
*/
function king_targets(row, col) {
    return [ get_cell(row-1, col-1),
	     get_cell(row-1, col-0),
	     get_cell(row-1, col+1),
	     get_cell(row-0, col-1),
	     get_cell(row-0, col+1),
	     get_cell(row+1, col-1),
	     get_cell(row+1, col-0),
	     get_cell(row+1, col+1)
	   ];
}

function queen_targets(row, col) {
    return [].concat(grid_column(col), grid_row(row), grid_diagonals(row, col));
}

function rook_targets(row, col) {
    return [].concat(grid_column(col), grid_row(row));
}

function bishop_targets(row, col) {
    return grid_diagonals(row, col);
}

function knight_targets(row, col) {
    return [ get_cell(row-2, col-1),
	     get_cell(row-2, col+1),
	     get_cell(row-1, col-2),
	     get_cell(row-1, col+2),
	     get_cell(row+1, col-2),
	     get_cell(row+1, col+2),
	     get_cell(row+2, col-1),
	     get_cell(row+2, col+1)	
	   ];
}

function pawn_targets(row, col) {
    var    
    move_twice = get_cell(row-2, col-0),
    move_once = get_cell(row-1, col-0),
    capture_left = get_cell(row-1, col-1),
    capture_right = get_cell(row-1, col+1)
    ;

    return [
	move_once,
	row == 6? move_twice : null,
	capture_left,
	capture_right
	].filter(function(x) { return x; });
}


function targets(td) {
    var match = td.innerText.replace(regex_select_chess_piece, function(match, m1) { return m1; });
    var result, row, col, i1, i2;

    result = function(td) {
    if (match) {
	row = td.parentNode.rowIndex;
	col = td.cellIndex;

	switch (match) {

	case '\u2654': { return king_targets(row, col); }
	case '\u2655': { return queen_targets(row, col); }
	case '\u2656': { return rook_targets(row, col); }
	case '\u2657': { return bishop_targets(row, col); }
	case '\u2658': { return knight_targets(row, col); }
	case '\u2659': { return pawn_targets(row, col); }
	case '\u265B': { return rook_targets(row, col); }
	case '\u265C': { return rook_targets(row, col); }
	case '\u265D': { return rook_targets(row, col); }
	case '\u265E': { return rook_targets(row, col); }
	case '\u265F': { return rook_targets(row, col); }

	default: {
	    console.log('Programmer error! Unknown switch value: ' + match);
	}
	}
    }
    }(td);

    return result? result.filter(function(x) { return x; }) : [];
}

function valid_from_move(td) {
    return td.innerText && td.innerText.match(white_piece);
}

function valid_to_move(td) {
    var cond1, cond2;

    cond1 = !td.innerText.match(white_piece);
    if (!cond1) return false;

    return true;
}

function piece_hints() {
    var i1, i2, tmp_row, tmp_cell;


    for (i1=0; i1<t.rows.length; i1++) {
	tmp_row = t.rows[i1];
	for (i2=0; i2<tmp_row.cells.length; i2++) {
	    tmp_cell = tmp_row.cells[i2];
	    tmp_cell.addEventListener('mouseover', create_cell_callback(tmp_cell), false);
	    tmp_cell.addEventListener('mouseout', create_cell_callback_cancel(tmp_cell), false);
	    tmp_cell.addEventListener('click', create_cell_callback_select(tmp_cell), false);
	}
    }
}

function initialise_grid() {
    g = create_game_info();
    set_cell(pieces['white chess rook'], 7, 0);
    set_cell(pieces['white chess knight'], 7, 1);
    set_cell(pieces['white chess bishop'], 7, 2);
    set_cell(pieces['white chess queen'], 7, 3);
    set_cell(pieces['white chess king'], 7, 4);
    set_cell(pieces['white chess bishop'], 7, 5);
    set_cell(pieces['white chess knight'], 7, 6);
    set_cell(pieces['white chess rook'], 7, 7);

    set_cell(pieces['white chess pawn'], 6, 0);
    set_cell(pieces['white chess pawn'], 6, 1);
    set_cell(pieces['white chess pawn'], 6, 2);
    set_cell(pieces['white chess pawn'], 6, 3);
    set_cell(pieces['white chess pawn'], 6, 4);
    set_cell(pieces['white chess pawn'], 6, 5);
    set_cell(pieces['white chess pawn'], 6, 6);
    set_cell(pieces['white chess pawn'], 6, 7);

    set_cell(pieces['black chess pawn'], 1, 0);
    set_cell(pieces['black chess pawn'], 1, 1);
    set_cell(pieces['black chess pawn'], 1, 2);
    set_cell(pieces['black chess pawn'], 1, 3);
    set_cell(pieces['black chess pawn'], 1, 4);
    set_cell(pieces['black chess pawn'], 1, 5);
    set_cell(pieces['black chess pawn'], 1, 6);
    set_cell(pieces['black chess pawn'], 1, 7);

    set_cell(pieces['black chess rook'], 0, 0);
    set_cell(pieces['black chess knight'], 0, 1);
    set_cell(pieces['black chess bishop'], 0, 2);
    set_cell(pieces['black chess queen'], 0, 3);
    set_cell(pieces['black chess king'], 0, 4);
    set_cell(pieces['black chess bishop'], 0, 5);
    set_cell(pieces['black chess knight'], 0, 6);
    set_cell(pieces['black chess rook'], 0, 7);
}


/** WASTE LINE */

/**
Compass functions.

The following functions each move one square per direction, so sse moves 3 squares in total.
This should be sufficient for all pieces of limited movement.

The functions work over td's and will return null when out of bounds.
*/
function north(td) { return td.parentNode.previousSibling; }
function nne(td) { return null; }
function ne(td) {}
function nee(td) {}
function east(td) {}
function see(td) {}
function se(td) {}
function sse(td) {}
function south(td) {}
function ssw(td) {}
function sw(td) {}
function sww(td) {}
function west(td) {}
function nww(td) {}
function nw(td) {}
function nnw(td) {}
