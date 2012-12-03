window.onload = function () {
    t = t || document.body.getElementsByTagName('table')[0];
    initialise_grid();
    piece_hints();
}

var current_passable_pawn = null;

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
    return td.childNodes.length && td.innerText.match(g.player === "WHITE"? white_piece : black_piece);
}

function create_cell_callback_select(td) {

    function deselect() {
	var i1, i2;

	if (!g.from) return;

	removeClass(g.from, 'select');
	for (i1=0; i1<g.from.parentNode.parentNode.rows.length; i1++) {
	    for (i2=0;i2<g.from.parentNode.cells.length; i2++) {
		removeClass(g.from.parentNode.parentNode.rows[i1].cells[i2], 'hint');
	    }
	}
	g.phase = 'INITIAL';
	g.from=null;
    }

    function select(td) {
	var hints;
	addClass(td, 'select');
	g.phase = 'FROM_SELECTED';
	g.from = td;
	hints = targets(td);

	for (i=0; i<hints.length; i++) {
	    addClass(hints[i], 'hint');
	}
    }

    return function(evt) {
	var flag1;

	switch (g.phase) {
	case 'INITIAL': {
	    if (valid_from_move(td)) {
		select(td);
	    } else {
		indicate_error(td);
	    }
	    break;
	} case 'FROM_SELECTED': {
	    if (valid_to_move(td)) { // Do the move
		td.innerHTML = g.from.innerHTML;

		if (g.from.innerText.match(/[\u2659\u265F]/)) { // Pawn shennanigans
		    if (targets_passable_pawn(td)) { // en passant invocation
			
			console.log(td, current_passable_pawn);
			current_passable_pawn.innerHTML = '&nbsp;';
			current_passable_pawn = null;
		    } else if ((g.from.innerText.match(/\u2659/) && g.from.parentNode.rowIndex === 6) ||
			       (g.from.innerText.match(/\u265F/) && g.from.parentNode.rowIndex === 1)) {
			current_passable_pawn = td; // en passant setup
			console.log("PP: ", current_passable_pawn);
		    } else {
			current_passable_pawn = null;		    
		    }
		}
		g.from.innerHTML = '';
		g.player = g.player === "WHITE"? "BLACK" : "WHITE";
	    } else { // reset selection
		flag1 = valid_from_move(td) && td != g.from;
	    }

	    deselect();
	    
	    if (flag1) {
		select(td);
	    }

	    break;
	} default: {
	    console.log('Programmer error! Unknown state: ' + g.phase);
	}
	}
    }
}

function create_cell_callback(td) {
    return function(evt) {
	var i,hints;
	if (valid_piece(td)) {
	    addClass(td, 'reverse');
	}
    }
}

function create_cell_callback_cancel(td) {
    return function(evt) {
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
    return [].concat(grid_column(col), grid_row(row), grid_diagonals(row, col)).filter(function(x) {
	return x && rule_path_clear(g.from, x);
    });
}

function rook_targets(row, col) {
    return [].concat(grid_column(col), grid_row(row)).filter(function(x) {
	return x && rule_path_clear(g.from, x);
    });
}

function bishop_targets(row, col) {
    return grid_diagonals(row, col).filter(function(x) {
	return x && rule_path_clear(g.from, x);
    });
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
    var k = g.player === "WHITE"? +1 : -1,
    move_twice = get_cell(row-2*k, col-0),
    move_once = get_cell(row-1*k, col-0),
    capture_left = get_cell(row-1*k, col-1),
    capture_right = get_cell(row-1*k, col+1),
    move_twice_cond,
    capture_left_cond = false,
    capture_right_cond = false
    ;

    if (capture_left != null) {
	capture_left_cond = (is_capture(capture_left) || targets_passable_pawn(capture_left));
    }

    if (capture_right != null) {
	capture_right_cond = (is_capture(capture_right) || targets_passable_pawn(capture_right));
    }

    return [
	move_once,
	row === (g.player === "WHITE"? 6 : 1) ? move_twice : null,
	capture_left_cond && capture_left,
	capture_right_cond && capture_right
    ].filter(function(x) {
	console.log("target: ", x);
	return x && rule_pawn_cannot_capture_diagonally_not_even_en_passant(g.from, x);
    });
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
	case '\u265A': { return king_targets(row, col); }
	case '\u265B': { return queen_targets(row, col); }
	case '\u265C': { return rook_targets(row, col); }
	case '\u265D': { return bishop_targets(row, col); }
	case '\u265E': { return knight_targets(row, col); }
	case '\u265F': { return pawn_targets(row, col); }

	default: {
	    console.log('Programmer error! Unknown switch value: ' + match);
	}
	}
    }
    }(td);

    return result? result.filter(function(x) {
	return x && !rule_space_already_occupied_by_same_player(x) && !rule_moving_into_check(x);
    }) : [];
}

function valid_from_move(td) {
    return td.innerText && td.innerText.match(g.player === "WHITE"? white_piece : black_piece);
}

function indicate_error() {
    console.log("Invalid move or something");
}

function valid_to_move(td) {
    var cond1, cond2;

    cond1 = !td.innerText.match(g.player === "WHITE"? white_piece : black_piece);
    if (!cond1) return false;

    cond2 = (targets(g.from).indexOf(td) !=  -1);

    return cond2;
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

function rule_space_already_occupied_by_same_player(target) {
    return target.innerText.match(g.player === 'WHITE'? white_piece : black_piece);
}

function rule_moving_into_check() {
    // loop pieces
    // targets(x).contains(find(king))
}

function targets_passable_pawn(target) {
    var toRow, toCol, ppRow, ppCol, passingRow;
    if (!current_passable_pawn) return false;

    toRow=target.parentNode.rowIndex;
    toCol=target.cellIndex;
    
    ppRow=current_passable_pawn.parentNode.rowIndex;
    ppCol=current_passable_pawn.cellIndex;

    if (g.player === "WHITE") {
	passingRow = toRow + 1;
    } else {
	passingRow = toRow - 1;
    }

    console.log(passingRow, toCol, ppCol, target, current_passable_pawn);

    return (passingRow === ppRow) && (toCol === ppCol);
}

function rule_pawn_cannot_capture_diagonally_not_even_en_passant(src, target) {
    var fromRow=src.parentNode.rowIndex, fromCol=src.cellIndex,
    toRow=target.parentNode.rowIndex, toCol=target.cellIndex;

    if (fromCol != toCol) {
	return is_capture(target) || targets_passable_pawn(target);
    } else {
	return rule_path_clear(src, target) && !is_capture(target);
    }
}

function rule_cannot_castle_when_king_or_rook_have_moved() { /* hooks & flags */ }

function rule_castling_out_of_or_across_an_attacked_scare() {
    if (is_castle(from, to)) {
    } else {
	return true;
    }
}

function rule_path_clear(from, to) {
    var i1,i2,cell,
    fromRow=from.parentNode.rowIndex, fromCol=from.cellIndex,
    toRow=to.parentNode.rowIndex, toCol=to.cellIndex,
    iv1 = fromRow === toRow? 0 : fromRow > toRow? -1 : +1;
    iv2 = fromCol === toCol? 0 : fromCol > toCol? -1 : +1;

    i1=fromRow+iv1;
    i2=fromCol+iv2;

    while ((iv1 === 0 || i1!=toRow) && (iv2 === 0 || i2!=toCol)) {
	cell = t.rows[i1].cells[i2];
	if (cell.innerText.match(regex_select_chess_piece)) {
	    return false;
	}
	i1+=iv1;
	i2+=iv2;
    }

    return true;
}

function is_capture(target) {
    if (!target || !target.innerText) return false;
    if (g.player === 'WHITE') {
	return target.innerText.match(black_piece);
    } else {
	return target.innerText.match(white_piece);
    }
}

function is_castle(src, target) {
    var fromRow=from.parentNode.rowIndex, fromCol=from.cellIndex,
    toRow=to.parentNode.rowIndex, toCol=to.cellIndex;

    return (toRow == 0 && toCol === 2) ||
	(toRow === 0 && toCol === 6) ||
	(toRow === 7 && toCol === 2) ||
	(toRow === 7 && toCol === 6);
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
