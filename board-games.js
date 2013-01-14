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

var white_piece = /[\u2654-\u2659]/; // Character range regex for white pieces.
var black_piece = /[\u265A-\u265F]/;
var regex_select_chess_piece = /^.*([\u2654-\u265F]).*$/;

function Player(type) {

    this.passable_pawn = null;

    return {
	is_white: function() { return type === "WHITE"; }
    };
}

function Board() {

    var white = new Player("WHITE"), black = new Player("BLACK");
    var board; // FIXME: Hacked in fix.
    var last_move;
    var from;
    var t;
    var g = { // deprecated. All this is deprecated.
        "player" : white,
        "phase" : "INITIAL",
    };
    var white_piece = /[\u2654-\u2659]/; // Character range regex for white pieces.
    var black_piece = /[\u265A-\u265F]/;
    var width, height;
    var preconditions = Array(
        function(src, target) { return board.space_not_already_occupied_by_same_player(src, target); }
    );
    
    function _initialise(initial_array) {
        var i1, i2, row, row_el, table_el, el = document.createElement('tbody'), tmp_cell,
        width = initial_array.length,
        height = initial_array[0].length;
        
        board = this;
        
        table_el = document.createElement('table');
        table_el.appendChild(el);
        addClass(table_el, 'unselectable');
        document.body.appendChild(table_el);
        t = el; // legacy hack
         
        for (i1=0; i1<height; i1+=1) {
            row_el = document.createElement('tr');
            row = initial_array[i1];
            el.appendChild(row_el);
            for (i2=0; i2<width; i2+=1) {
                tmp_cell = document.createElement('td')
                row_el.appendChild(tmp_cell);                
                _set_cell(pieces[row[i2]], i1, i2);
                tmp_cell.addEventListener('mouseover', _create_cell_callback(tmp_cell), false);
                tmp_cell.addEventListener('mouseout', _create_cell_callback_cancel(tmp_cell), false);
                tmp_cell.addEventListener('click', _create_cell_callback_select(tmp_cell), false);

            }
        }
    }
    
    function _current_player() {
        return g.player;
    }
    
    function _next_player() {
        g.player = _current_player().is_white()? black : white;
    }

    function is_empty(td) {
        return td && !td.innerHTML.match(regex_select_chess_piece);
    }

    function _do_move(td) {
	td.innerHTML = from.innerHTML;
	from.innerHTML = '';
	_next_player();
	last_move = td;
    }

    function _get_cell(x, y) {
        if (x < 0 || x > height || y < 0 || y > width) return null;
        return t.rows[x] && t.rows[x].cells[y];
    }

    function _set_cell(value, x, y) {
        return _get_cell(x, y).innerHTML = value || '&nbsp;';
    }

    function _get_value(td) {
	return td.innerHTML.replace(regex_select_chess_piece, function(match, m1) { return m1; });
    }

    function _find_piece(piece) {
	for (i1=0; i1<t.rows.length; i1+=1) {
	    for (i2=0; i2<t.rows[i1].cells.length; i2+=1) {
		tempCell = t.rows[i1].cells[i2];
		if (tempCell.innerHTML.match(piece)) return tempCell;
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
	from = td;
	hints = targets(td);

	for (i=0; i<hints.length; i++) {
	    addClass(hints[i], 'hint');
	}
    }

    function _deselect() {
	var i1, i2;
	if (!from) return;

	removeClass(from, 'select');
	for (i1=0; i1<from.parentNode.parentNode.rows.length; i1++) {
	    for (i2=0;i2<from.parentNode.cells.length; i2++) {
		removeClass(from.parentNode.parentNode.rows[i1].cells[i2], 'hint');
	    }
	}
	g.phase = 'INITIAL';
	from=null;
    }

	function _do_shennanigans(td) {
		var piece = ChessPieces[_get_value(from)];
		piece.shennanigans && piece.shennanigans(board, td);
    }
    
    function all_targets(td) {
        /** Given a cell, return an array of cells being atttacked regardless of whose turn it is, or whether the player would be moving into check. */
        var piece = ChessPieces[_get_value(td)];

        if (piece) {
        row = td.parentNode.rowIndex;
        col = td.cellIndex;
        return piece.targets(board, row, col).filter(function(x) {
            var i, flag = true;
            for (i=0; i<preconditions.length; i++) {
                flag = flag && preconditions[i](td, x);
            }
            return flag;
        });
        } else {
        console.log("WARNING: There is no piece for:", _get_value(td), "at:", td);
        return [];
        }
    }

    function targets(td) {
        return all_targets(td).filter(
        function(x) { // post-conditions
            return board.not_moving_into_check(td, x);
        }
        );
    }

    function apply_move(fromY, fromX, toY, toX) { // FIXME: Inconsistent ordering of arguments
	var from_cell = _get_cell(fromX, fromY);
	var to_cell = _get_cell(toX, toY);

	if (!_valid_from_move(from_cell)) {
	    console.log("Invalid move!", from_cell);
	} else {
	    _select(from_cell);
	    if (!_valid_to_move(to_cell)) {
		console.log("Invalid target!", to_cell);
	    } else {
		_do_shennanigans(to_cell);
		_do_move(to_cell);
		_deselect();
	    }
	}
    }

    function _create_cell_callback_select(td) {
	/** User clicks a cell; behave appropriately. */
	return function(evt) {
	    var flag1;

	    switch (g.phase) {
	    case 'INITIAL': {
		_valid_from_move(td) && _select(td) || _indicate_error(td);
		break;
	    } case 'FROM_SELECTED': {
		if (ws) { // HACKEDFIX: websockets
		    var fromRow=from.parentNode.rowIndex, fromCol=from.cellIndex,
		    toRow=td.parentNode.rowIndex, toCol=td.cellIndex;
		    var raw_data=[fromCol, fromRow, toCol, toRow];
		    ws.send("[" + raw_data.toString() + "]");
		    _deselect();
		} else if (_valid_to_move(td)) {
		    _do_shennanigans(td);
		    _do_move(td);
		} else {
		    /* Here, our user wants to cancel the current selection and select a new piece.
		       We let them do this in one go (unless the same piece is being deselected.) */
		    flag1 = _valid_from_move(td) && td != from;
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
            var i,hints, valid_piece =  td.childNodes.length && 
            td.innerHTML.match(_current_player().is_white()? white_piece : black_piece);
            if (valid_piece) addClass(td, 'reverse');
        }    
    }

    /** Cleanup hints */
    function _create_cell_callback_cancel(td) {
        return function(evt) { removeClass(td, 'reverse'); };
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
    function _is_capture(src, target) {
        if (!target || !target.innerHTML) return false;
        return target.innerHTML.match(
            src.innerHTML.match(white_piece)?
            black_piece : white_piece
            );        
	}

    function _valid_from_move(td) {
	return td.innerHTML && td.innerHTML.match(g.player.is_white()? white_piece : black_piece);
    }

    function _indicate_error() {}

    function _valid_to_move(td) {
	var cond1 = !td.innerHTML.match(g.player === "WHITE"? white_piece : black_piece);
	return cond1 && targets(from).indexOf(td) != -1;
    }

    // Declare public functions
    return {
	initialise: _initialise,
	apply_move: apply_move,
	set_cell: _set_cell,
	get_cell: _get_cell,
	get_value: _get_value,
	is_capture: _is_capture,
	find_piece: _find_piece,
	grid_row: _grid_row,
	grid_column: _grid_column,
	grid_diagonals: _grid_diagonals,
    current_player: _current_player,
    is_empty: is_empty,
    all_targets: all_targets,
    from: function() { return from; }
    };
}

function chess_king_targets(board, row, col) {
    // One square in any direction.
    var castle_target_kings_side, castle_target_queens_side, target_castle = null;
    var get_cell = board.get_cell;
    if (get_cell(row, col).innerHTML.match(/\u2654/)) { // white king
    if (row === 7 && col === 4 && !board.find_piece(pieces['white chess king']).getAttribute('dirty')) {
        target_castle = get_cell(7, 0);
        if (target_castle.innerHTML.match(pieces['white chess rook']) && !target_castle.getAttribute('dirty')) {
        castle_target_kings_side = get_cell(7, 2);
        }

        target_castle = get_cell(7, 7);
        if (target_castle.innerHTML.match(pieces['white chess rook']) && !target_castle.getAttribute('dirty')) {
        castle_target_queens_side = get_cell(7, 6);
        }
    }
    } else { // black king
    if (row === 0 && col === 4 && !board.find_piece(pieces['black chess king']).getAttribute('dirty')) {
        target_castle = get_cell(0, 0);
        if (target_castle.innerHTML.match(pieces['black chess rook']) && !target_castle.getAttribute('dirty')) {
        castle_target_queens_side = get_cell(0, 2);
        }

        target_castle = get_cell(0, 7);
        if (target_castle.innerHTML.match(pieces['black chess rook']) && !target_castle.getAttribute('dirty')) {
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

function chess_queen_targets(board, row, col) { // Rows, columns and diagonals
    var result = [].concat(board.grid_column(col),
               board.grid_row(row),
               board.grid_diagonals(row, col)
              );

    return result.filter(function(x) {
        return board.path_clear(board.get_cell(row, col), x);
    });
}

function chess_rook_targets(board, row, col) { // rows and columns
    return [].concat(
		board.grid_column(col), board.grid_row(row)
	    ).filter(function(x) {
            return board.path_clear(board.get_cell(row, col), x);
	    });
}

function chess_bishop_targets(board, row, col) { // Diagonals
    return board.grid_diagonals(row, col)
    .filter(function(x) {
        return board.path_clear(board.get_cell(row, col), x);
    });
}

function chess_knight_targets(board, row, col) { // 1 of 8 surrounding cells
    var get_cell = board.get_cell;
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

function chess_pawn_targets(board, row, col) {
    var is_white = board.get_cell(row, col).innerHTML.match(white_piece);
    var k = is_white? +1 : -1,
    move_twice = board.get_cell(row-2*k, col-0),
    move_once = board.get_cell(row-1*k, col-0),
    capture_left = board.get_cell(row-1*k, col-1),
    capture_right = board.get_cell(row-1*k, col+1),
    move_twice_cond,
    capture_left_cond = false,
    capture_right_cond = false
    ;
    
    var src = board.get_cell(row, col);

    // TODO: Test invoking en passant to get out of check
    // TODO: Test preventing en passant when resulting in check
    
    if (capture_left != null) { // Handle en passant as well as normal pawn capture.
    capture_left_cond = (board.is_capture(src, capture_left) || board.targets_passable_pawn(capture_left));
    }

    if (capture_right != null) {
    capture_right_cond = (board.is_capture(src, capture_right) || board.targets_passable_pawn(capture_right));
    }

    move_twice_cond = (board.is_empty(move_once) && board.is_empty(move_twice) && (row === (is_white? 6 : 1)));

    return [
    board.is_empty(move_once) && move_once,
    move_twice_cond && move_twice,
    capture_left_cond && capture_left,
    capture_right_cond && capture_right
    ];
}

function td_path_clear(from, to) {
	/** Check the route does not contain any blocking pieces, ignoring either end. */

	var i1,i2,cell,t=from.parentNode.parentNode,
	fromRow=from.parentNode.rowIndex, fromCol=from.cellIndex,
	toRow=to.parentNode.rowIndex, toCol=to.cellIndex,
	iv1 = fromRow === toRow? 0 : fromRow > toRow? -1 : +1,
	iv2 = fromCol === toCol? 0 : fromCol > toCol? -1 : +1;

	i1=fromRow+iv1;
	i2=fromCol+iv2;

	while ((iv1 === 0 || i1!=toRow) && (iv2 === 0 || i2!=toCol)) {
	    cell = t.rows[i1].cells[i2];
	    if (cell.innerHTML.match(regex_select_chess_piece)) {
		return false;
	    }

	    // move along a vector.
	    i1+=iv1;
	    i2+=iv2;
	}

	return true;
}

function game_not_moving_into_check(board, src, target) {
	/** NB: This is currently the worst part of the code */
	var i1, i2, tempCell, regex, kings_square, flag = true, original = target.innerHTML;

	/*
	  Documented Hack #125431: try out the move by changing the shared state.

	  PART 1:
	  This must be done before looking up the king's square, in case the king is being moved.
	*/
	target.innerHTML = src.innerHTML;
	src.innerHTML = '&nbsp;';
	/* END HACK PART 1*/

	if (board.current_player().is_white()) {
	    regex = black_piece;
	    kings_square = board.find_piece(pieces['white chess king']);
	} else {
	    regex = white_piece;
	    kings_square = board.find_piece(pieces['black chess king']);
	}

	for (i1=0; i1<src.parentNode.parentNode.rows.length; i1+=1) {
	    for (i2=0; i2<src.parentNode.parentNode.rows[i1].cells.length; i2+=1) {
		tempCell = src.parentNode.parentNode.rows[i1].cells[i2];
		if (tempCell.innerHTML.match(regex)) {
		    // call to all_targets does not filter on checking rules.
		    // This is what we need here (when checking if the king is being targetted; in check.)
		    if (inArray(kings_square, board.all_targets(tempCell))) {
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

function chess_pawn_on_move(g, td) {
    var is_white = g.from().innerHTML.match(/\u2659/);
    var is_black = g.from().innerHTML.match(/\u265F/);
    var from_row = g.from().parentNode.rowIndex, to_row = td.parentNode.rowIndex;
    var cond_passed_pawn_capture = g.targets_passable_pawn(td); // annoyingly, have to check this first.
    var previous_passable_pawn = g.current_passable_pawn;
    g.current_passable_pawn = null;
    
    if (cond_passed_pawn_capture) {
    previous_passable_pawn.innerHTML = '&nbsp;'; // capture
    } else if ((is_white && from_row === 6) || (is_black && from_row === 1)) {
    g.current_passable_pawn = td; // en passant setup
    } else {
    if (is_white && to_row === 0) { // promotion
        g.from().innerHTML = g.from().innerHTML.replace(/\u2659/, '\u2655');
    } else if (is_black && to_row === 7) {
        g.from().innerHTML = g.from().innerHTML.replace(/\u265F/, '\u265B');
    }
    }
}

function chess_king_on_move(game, td) {
    var rook_src, rook_dest;

    if (game.is_castle(game.from(), td)) { // castling
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

    game.from().setAttribute("dirty", true); // The king can no longer castle once it has moved.
}

function chess_rook_on_move(game, td) {
    game.from().setAttribute("dirty", true); // The rook can no longer participate in castling once it has moved.
}

function shatranj_general_targets(board, row, col) {
    return [ get_cell(row + 1, col + 1),
        get_cell(row + 1, col + 1),
        get_cell(row + 1, col + 1),
        get_cell(row + 1, col + 1) ].filter(function(x) {
        return x && rule_space_not_already_occupied_by_same_player(row, col);
    });
}

function shatranj_elephant_targets(board, row, col) {
    return [ get_cell(row + 2, col + 2),
        get_cell(row + 2, col + 2),
        get_cell(row + 2, col + 2),
        get_cell(row + 2, col + 2) ].filter(function(x) {
    return x && rule_space_not_already_occupied_by_same_player(row, col);
    });
}

function space_not_already_occupied_by_same_player(src, target) {
    var theMatch;
    if (src.innerHTML.match(white_piece)) {
        theMatch = white_piece;
    } else if (src.innerHTML.match(black_piece)) {
        theMatch = black_piece;
    } else {
        console.log("Programmer Error! For src, target: ", src, target);
    }

    return !target.innerHTML.match(theMatch);
}
