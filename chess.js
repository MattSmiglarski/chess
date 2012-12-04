/**
Chess.
====================================

This script displays chess pieces as unicode characters on a HTML table.

A piece is dropped onto the square by writing the chess piece's Unicode character into the cell. This is to avoid synchronising state.

As a result inspection of a cell can be performed by character range regexes. This is probably temporary and arguably a disadvantage, but it is quite cool.

SECTION: CONCEPTS
==================

Hints -- CSS classes are added to & removed from squares. This provides visual feedback for available moves and the like.
Rules -- constraints which define the game.
Pieces -- defines scope and hooks/hacks/shennanigans to invoke in between moves.
*/

// SECTION: Hacks & Globals
var pieces = {
    'white chess king' : '\u2654',
    'white chess queen' : '\u2655',
    'white chess rook' : '\u2656',
    'white chess bishop' : '\u2657',
    'white chess knight' : '\u2658',
    'white chess pawn' : '\u2659',
    'black chess king' : '\u265A',
    'black chess queen' : '\u265B',
    'black chess rook' : '\u265C',
    'black chess bishop' : '\u265D',
    'black chess knight' : '\u265E',
    'black chess pawn' : '\u265F'
};

var current_passable_pawn = null;
var t;
var g = {
    "player" : "WHITE",
    "phase" : "INITIAL",
};
var white_piece = /[\u2654-\u2659]/; // Character range regex for white pieces.
var black_piece = /[\u265A-\u265F]/;
var regex_select_chess_piece = /^.*([\u2654-\u265F]).*$/;

var Board = (function() {

    function _initialise(iniitial_array) {
	var i1, i2;
	for (i1=0; i1<8; i1+=1) {
	    for (i2=0; i2<8; i2+=1) {
		_set_cell(pieces[iniitial_array[i1][i2]], i1, i2);
	    }
	}
    }

    function _do_move(td) {
	td.innerHTML = g.from.innerHTML;
	g.from.innerHTML = '';
	g.player = g.player === "WHITE"? "BLACK" : "WHITE";
    }

    function _get_cell(x, y) {
	if (x < 0 || x > 7 || y < 0 || y > 7) return null;
	return t.rows[x] && t.rows[x].cells[y];
    }

    function _set_cell(value, x, y) {
	_get_cell(x, y).innerHTML = value? '<span>' + value + '</span>' : '&nbsp;';
    }

    function _get_value(td) {
	return td.innerText.replace(regex_select_chess_piece, function(match, m1) { return m1; });
    }

    function _find_piece(piece) {
	for (i1=0; i1<t.rows.length; i1+=1) {
	    for (i2=0; i2<t.rows[i1].cells.length; i2+=1) {
		tempCell = t.rows[i1].cells[i2];
		if (tempCell.innerText.match(piece)) return tempCell;
	    }
	}

	console.log("Programmar error! Piece not found", piece);
	return null;
    }

    /** User selects a piece */
    function _select(td) {
	var hints;
	addClass(td, 'select');
	g.phase = 'FROM_SELECTED';
	g.from = td;
	hints = targets(td);

	for (i=0; i<hints.length; i++) {
	    addClass(hints[i], 'hint');
	}
    }

    function _deselect() {
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


    /** User clicks a cell; behave appropriately. */
    function _create_cell_callback_select(td) {
	return function(evt) {
	    var flag1;

	    switch (g.phase) {
	    case 'INITIAL': {
		_valid_from_move(td) && _select(td) || _indicate_error(td);
		break;
	    } case 'FROM_SELECTED': {
		if (_valid_to_move(td)) {
		    do_shennanigans(td);
		    _do_move(td);
		} else {
		    /* Here, our user might wants to cancel the current selection and select a new piece.
		       We let them do this in one go (unless the same piece is being deselected.) */
		    flag1 = _valid_from_move(td) && td != g.from;
		}

		_deselect();
		if (flag1) _select(td); // switch selected piece

		break;
	    } default: {
		console.log('Programmer error! Unknown state: ' + g.phase);
	    }
	    }
	}
    }

    /** User hovers over a cell; provide hints on surrounding squares. */
    function _create_cell_callback(td) {
	return function(evt) {
	    var i,hints, valid_piece =  td.childNodes.length && td.innerText.match(g.player === "WHITE"? white_piece : black_piece);

	    if (valid_piece) addClass(td, 'reverse');
	}
    }

    /** Cleanup hints */
    function _create_cell_callback_cancel(td) {
	return function(evt) {
	    removeClass(td, 'reverse');
	}
    }

    /** Select entire column */
    function _grid_column(col) {
	var i, result = [];
	for (i=0; i<8; i++) {
	    result[i] = _get_cell(i, col);
	}
	return result;
    }

    /** Select entire row */
    function _grid_row(row) {
	var i, result = [];
	for (i=0; i<8; i++) {
	    result[i] = _get_cell(row, i);
	}
	return result;
    }

    /** Select 4 diagonals. Out of bounds cells are filtered elsewhere.. */
    function _grid_diagonals(row, col) {
	var i, result = [];
	for (i=0; i<8; i++) {
	    result[4*i + 0] = _get_cell(row-i, col-i);
	    result[4*i + 1] = _get_cell(row-i, col+i);
	    result[4*i + 2] = _get_cell(row+i, col-i);
	    result[4*i + 3] = _get_cell(row+i, col+i);
	}
	return result;
    }

    /** Does the target square contain an apoosing piece? */
    function _is_capture(target) {
	if (!target || !target.innerText) return false;
	if (g.player === 'WHITE') {
	    return target.innerText.match(black_piece);
	} else {
	    return target.innerText.match(white_piece);
	}
    }

    /** Manage CSS classes for styling of hints & the like */
    function _piece_hints() {
	var i1, i2, tmp_row, tmp_cell;

	for (i1=0; i1<t.rows.length; i1++) {
	    tmp_row = t.rows[i1];
	    for (i2=0; i2<tmp_row.cells.length; i2++) {
		tmp_cell = tmp_row.cells[i2];
		tmp_cell.addEventListener('mouseover', _create_cell_callback(tmp_cell), false);
		tmp_cell.addEventListener('mouseout', _create_cell_callback_cancel(tmp_cell), false);
		tmp_cell.addEventListener('click', _create_cell_callback_select(tmp_cell), false);
	    }
	}
    }

    function _valid_from_move(td) {
	return td.innerText && td.innerText.match(g.player === "WHITE"? white_piece : black_piece);
    }

    function _indicate_error() {}

    function _valid_to_move(td) {
	var cond1 = !td.innerText.match(g.player === "WHITE"? white_piece : black_piece);
	return cond1 && targets(g.from).indexOf(td) != -1;
    }

    // Declare public functions
    return {
	initialise: _initialise,
	set_cell: _set_cell,
	get_cell: _get_cell,
	piece_hints: _piece_hints,
	get_value: _get_value,
	is_capture: _is_capture,
	find_piece: _find_piece,
	grid_row: _grid_row,
	grid_column: _grid_column,
	grid_diagonals: _grid_diagonals
    };
}());

function do_shennanigans(td) {
    var piece = ChessPieces[Board.get_value(g.from)];
    piece.shennanigans && piece.shennanigans(td);

    // The usual shennanigans.
    if (Chess.is_checkmate()) {
	console.log("Checkmate!");
    }
}

/**
Target Functions each return an array of the attached cells, given a row & column.

They must not assume they are the current player, and it is preferable to filter on state later.
However, they are dependent on the board, so...

Pieces are a mapping to objects with the following functions:

targets() -- define attacked squares
shennanigans() -- callbacks for special rule handling
**/
var Pieces = (function() {

    var grid_column = Board.grid_column;
    var grid_row = Board.grid_row;
    var grid_diagonals = Board.grid_diagonals;
    var get_cell = Board.get_cell;

    var king = {
	targets: function(row, col) { 
	    // One square in any direction.
	    var castle_target_kings_side, castle_target_queens_side, target_castle = null;

	    if (get_cell(row, col).innerText.match(/\u2654/)) { // white king
		if (row === 7 && col === 4 && !Board.find_piece(pieces['white chess king']).getAttribute('dirty')) {
		    target_castle = get_cell(7, 0);
		    if (target_castle.innerText.match(pieces['white chess rook']) && !target_castle.getAttribute('dirty')) {
			castle_target_kings_side = get_cell(7, 2);
		    }

		    target_castle = get_cell(7, 7);
		    if (target_castle.innerText.match(pieces['white chess rook']) && !target_castle.getAttribute('dirty')) {
			castle_target_queens_side = get_cell(7, 6);
		    }
		}
	    } else { // black king
		if (row === 0 && col === 4 && !Board.find_piece(pieces['black chess king']).getAttribute('dirty')) {
		    target_castle = get_cell(0, 0);
		    if (target_castle.innerText.match(pieces['black chess rook']) && !target_castle.getAttribute('dirty')) {
			castle_target_queens_side = get_cell(0, 2);
		    }

		    target_castle = get_cell(0, 7);
		    if (target_castle.innerText.match(pieces['black chess rook']) && !target_castle.getAttribute('dirty')) {
			castle_target_kings_side = get_cell(0, 6);
		    }
		}
	    }

	    return [ get_cell(row-1, col-1),
		     get_cell(row-1, col-0),
		     get_cell(row-1, col+1),
		     get_cell(row-0, col-1),
		     get_cell(row-0, col+1),
		     get_cell(row+1, col-1),
		     get_cell(row+1, col-0),
		     get_cell(row+1, col+1),
		     castle_target_kings_side,
		     castle_target_queens_side
		   ];
	}
	,shennanigans: function (td) {
	    var rook_src, rook_dest;

	    if (Chess.is_castle(g.from, td)) { // castling
		if (td.cellIndex === 2) {
		    rook_src = td.previousSibling.previousSibling;
		    rook_dest = td.nextSibling;
		} else if (td.cellIndex === 6) {
		    rook_src = td.nextSibling;
		    rook_dest = td.previousSibling;
		}
		
		rook_dest.innerHTML = rook_src.innerHTML;
		rook_src.innerHTML = '&nbsp;';
	    }

	    g.from.setAttribute("dirty", true); // The king can no longer castle once it has moved.
	}
    };

    var queen = {
	targets: function (row, col) { // Rows, columns and diagonals
	    var result = [].concat(grid_column(col),
				   grid_row(row),
				   grid_diagonals(row, col)
				  );

	    return result.filter(function(x) {
		return Rules.path_clear(get_cell(row, col), x);
	    });
	}
    };

    var rook = {
	targets: function(row, col) { // rows and columns
	    return [].concat(
		grid_column(col), grid_row(row)
	    ).filter(function(x) {
		return Rules.path_clear(get_cell(row, col), x);
	    });
	}
	,shennanigans: function(td) {
	    g.from.setAttribute("dirty", true); // The rook can no longer participate in castling once it has moved.
	}
    };

    var bishop = {
	targets: function(row, col) { // Diagonals
	    return Board.grid_diagonals(row, col)
		.filter(function(x) {
		    return Rules.path_clear(get_cell(row, col), x);
		});
	}
    };

    var knight = { 
	targets: function(row, col) { // 1 of 8 surrounding cells
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
    };

    var pawn = {
	targets: function(row, col) { // single move forward, or single diagonal capture, or en passant, or double initial move

	    var is_white = Board.get_cell(row, col).innerText.match(white_piece);
	    var k = is_white? +1 : -1,
	    move_twice = Board.get_cell(row-2*k, col-0),
	    move_once = Board.get_cell(row-1*k, col-0),
	    capture_left = Board.get_cell(row-1*k, col-1),
	    capture_right = Board.get_cell(row-1*k, col+1),
	    move_twice_cond,
	    capture_left_cond = false,
	    capture_right_cond = false
	    ;

	    // Handle en passant as well as normal pawn capture.
	    if (capture_left != null) {
		capture_left_cond = (Board.is_capture(capture_left) || Chess.targets_passable_pawn(capture_left));
	    }

	    if (capture_right != null) {
		capture_right_cond = (Board.is_capture(capture_right) || Chess.targets_passable_pawn(capture_right));
	    }

	    move_twice_cond = (is_empty(move_once) && is_empty(move_twice) && (row === (is_white? 6 : 1)));

	    return [
		is_empty(move_once) && move_once,
		move_twice_cond && move_twice,
		capture_left_cond && capture_left,
		capture_right_cond && capture_right
	    ];
	}
	
	,shennanigans: function(td) {
	    if (Chess.targets_passable_pawn(td)) { // en passant invocation
		current_passable_pawn.innerHTML = '&nbsp;'; // capture
		current_passable_pawn = null;
	    } else if ((g.from.innerText.match(/\u2659/) && g.from.parentNode.rowIndex === 6) ||
		       (g.from.innerText.match(/\u265F/) && g.from.parentNode.rowIndex === 1)) {
		current_passable_pawn = td; // en passant setup
	    } else {
		current_passable_pawn = null;		    
	    }
	}
    }

    return {
	king: king,
	queen: queen,
	rook: rook,
	bishop: bishop,
	knight: knight,
	pawn: pawn
    };
}());

var Chess = {

    targets_passable_pawn: function(target) {
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

	return (passingRow === ppRow) && (toCol === ppCol);
    }

    ,is_castle: function(src, target) {
	var fromRow=src.parentNode.rowIndex, fromCol=src.cellIndex,
	toRow=target.parentNode.rowIndex, toCol=target.cellIndex;

	return (toRow == 0 && toCol === 2) ||
	    (toRow === 0 && toCol === 6) ||
	    (toRow === 7 && toCol === 2) ||
	    (toRow === 7 && toCol === 6);
    }

    ,is_checkmate: function() {
	var regex, i1, i2, tempCell;
	if (g.player === 'WHITE') {
	    regex = white_piece;
	} else {
	    regex = black_piece;
	}

	for (i1=0; i1<7; i1+=1) {
	    for (i2=0; i2<7; i2+=1) {
		tempCell = Board.get_cell(i1, i2);
		if (tempCell.innerHTML.match(regex)) {
		    if (all_targets(tempCell).length > 0) {
			return false;
		    }
		}
	    }
	}

	return true;
    }
};

var ChessPieces = {
    '\u2654': Pieces['king'],
    '\u2655': Pieces['queen'],
    '\u2656': Pieces['rook'],
    '\u2657': Pieces['bishop'],
    '\u2658': Pieces['knight'],
    '\u2659': Pieces['pawn'],
    '\u265A': Pieces['king'],
    '\u265B': Pieces['queen'],
    '\u265C': Pieces['rook'],
    '\u265D': Pieces['bishop'],
    '\u265E': Pieces['knight'],
    '\u265F': Pieces['pawn']
};

/** Given a cell, return an array of cells being atttacked regardless of whose turn it is, or whether the player would be moving into check. */
function all_targets(td) {
    var piece = ChessPieces[Board.get_value(td)];

    if (piece) {
	row = td.parentNode.rowIndex;
	col = td.cellIndex;
	return piece.targets(row, col).filter(function(x) {
	    return Rules.space_not_already_occupied_by_same_player(td, x);
	});
    } else {
	console.log("WARNING: There is no piece for:", Board.get_value(td), "at:", td);
	return [];
    }
}

function targets(td) {
    return all_targets(td).filter(
	function(x) {
	    return Rules.not_moving_into_check(td, x);
	}
    );
}


var Rules = (function() {

    function _create_rule(callback) {
	return function(src, target) {
	    if (!target) return target;
	    return callback(src, target);
	}
    }

    function _space_not_already_occupied_by_same_player(src, target) {
	var theMatch;
	if (src.innerText.match(white_piece)) {
	    theMatch = white_piece;
	} else if (src.innerText.match(black_piece)) {
	    theMatch = black_piece;
	} else {
	    console.log("Programmer Error! For src, target: ", src, target);
	}

	return !target.innerText.match(theMatch);
    }

    function _not_moving_into_check(src, target) {
	/** NB: This is currently the worst part of the code */
	var i1, i2, tempCell, regex, kings_square, flag = true, original = target.innerHTML;

	/*
	  Documented Hack #125431: try out the move by changing the shared state.

	  PART 1:
	  This must be done before looking up the king's square, in case the king is being moved.
	  This will almost certainly cause issues when things change, so scope the state properly ASAP!
	*/
	target.innerHTML = src.innerHTML;
	src.innerHTML = '&nbsp;';
	/* END HACK PART 1*/

	if (g.player === 'WHITE') {
	    regex = black_piece;
	    kings_square = Board.find_piece(pieces['white chess king']);
	} else {
	    regex = white_piece;
	    kings_square = Board.find_piece(pieces['black chess king']);
	}

	for (i1=0; i1<t.rows.length; i1+=1) {
	    for (i2=0; i2<t.rows[i1].cells.length; i2+=1) {
		tempCell = t.rows[i1].cells[i2];
		if (tempCell.innerText.match(regex)) {
		    // call to all_targets does not filter on checking rules.
		    // This is what we need here (when checking if the king is being targetted; in check.)
		    if (inArray(kings_square, all_targets(tempCell))) {
			flag = false;
			break;
		    }
		}
	    }
	}
	/* Documented Hack Part 2: Reset the state like nothing happened (hopefully no-one was watching.)*/
	src.innerHTML = target.innerHTML;
	target.innerHTML = original;
	/* END HACK PART 2 */

	return flag;
    }

    function _path_clear(from, to) {
	/** Check the route does not contain any blocking pieces, ignoring either end. */

	var i1,i2,cell,
	fromRow=from.parentNode.rowIndex, fromCol=from.cellIndex,
	toRow=to.parentNode.rowIndex, toCol=to.cellIndex,
	iv1 = fromRow === toRow? 0 : fromRow > toRow? -1 : +1,
	iv2 = fromCol === toCol? 0 : fromCol > toCol? -1 : +1;

	i1=fromRow+iv1;
	i2=fromCol+iv2;

	while ((iv1 === 0 || i1!=toRow) && (iv2 === 0 || i2!=toCol)) {
	    cell = t.rows[i1].cells[i2];
	    if (cell.innerText.match(regex_select_chess_piece)) {
		return false;
	    }

	    // move along a vector.
	    i1+=iv1;
	    i2+=iv2;
	}

	return true;
    }

    return {
	path_clear: _create_rule(_path_clear),
	not_moving_into_check: _create_rule(_not_moving_into_check),
	space_not_already_occupied_by_same_player: _create_rule(_space_not_already_occupied_by_same_player)
    };
}());

function bootstrap() {
    var empty_row = [,,,,,,,];

    var initial_array = [
	['black chess rook', 'black chess knight', 'black chess bishop', 'black chess queen', 'black chess king', 'black chess bishop', 'black chess knight', 'black chess rook'],
	['black chess pawn', 'black chess pawn', 'black chess pawn', 'black chess pawn', 'black chess pawn', 'black chess pawn', 'black chess pawn', 'black chess pawn'],
	empty_row,
	empty_row,
	empty_row,
	empty_row,
	['white chess pawn', 'white chess pawn', 'white chess pawn', 'white chess pawn', 'white chess pawn', 'white chess pawn', 'white chess pawn', 'white chess pawn'],
	['white chess rook', 'white chess knight', 'white chess bishop', 'white chess queen', 'white chess king', 'white chess bishop', 'white chess knight', 'white chess rook']
    ];

    t = t || document.body.getElementsByTagName('table')[0];
    Board.initialise(initial_array);
    Board.piece_hints();
}

window.onload = bootstrap;
