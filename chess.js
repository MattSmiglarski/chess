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

var Pieces = {
    king: { targets: chess_king_targets, shennanigans: chess_king_on_move },
	queen: { targets: chess_queen_targets },
	rook: { targets: chess_rook_targets, shennanigans: chess_rook_on_move },
	bishop: { targets: chess_bishop_targets },
	knight: { targets: chess_knight_targets },
	pawn: { targets: chess_pawn_targets, shennanigans: chess_pawn_on_move }
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

function createChessGame() {

    function _create_rule(callback) {
        return function(src, target) {
            if (!target) return target; // FIXME:
            return callback(src, target);
        }
    }
    
    function _create_game_rule(callback) {
        return function(src, target) {
            if (!target) return target;
            return callback(board, src, target);
        }
    }

    var empty_row = new Array(8);
    var board = new Board(8, 8);
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
    board.initialise(initial_array);
        
    board.targets_passable_pawn = function(target) {
	    var toRow, toCol, ppRow, ppCol, passingRow;
	    if (!board.current_passable_pawn) return false;

	    toRow=target.parentNode.rowIndex;
	    toCol=target.cellIndex;
	    
	    ppRow=board.current_passable_pawn.parentNode.rowIndex;
	    ppCol=board.current_passable_pawn.cellIndex;

	    if (board.current_player() === "WHITE") {
		passingRow = toRow + 1;
	    } else {
		passingRow = toRow - 1;
	    }
	    
	    return (passingRow === ppRow) && (toCol === ppCol);
	};

	board.is_castle = function(src, target) {
	    var fromRow=src.parentNode.rowIndex, fromCol=src.cellIndex,
	    toRow=target.parentNode.rowIndex, toCol=target.cellIndex;

	    return (toRow == 0 && toCol === 2) ||
		(toRow === 0 && toCol === 6) ||
		(toRow === 7 && toCol === 2) ||
		(toRow === 7 && toCol === 6);
	};

	board.is_endgame = function() {
	    var regex, i1, i2, tempCell;
	    if (g.player === 'WHITE') {
            regex = white_piece;
        } else {
            regex = black_piece;
	    }

	    for (i1=0; i1<7; i1+=1) {
            for (i2=0; i2<7; i2+=1) {
                tempCell = board.get_cell(i1, i2);
                if (tempCell.innerend_HTML.match(regex)) {
                if (board.all_targets(tempCell).length > 0) {
                    return false;
                }
                }
            }
	    }

	    return true;
	};

    board.space_not_already_occupied_by_same_player = _create_rule(space_not_already_occupied_by_same_player);
    board.path_clear = _create_rule(td_path_clear);
    board.not_moving_into_check = _create_game_rule(game_not_moving_into_check);
    board.space_not_already_occupied_by_same_player = _create_rule(space_not_already_occupied_by_same_player);
 };

window.onload = function() { createChessGame(); };
