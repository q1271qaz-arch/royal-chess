import chess


def board_from_fen(fen):
    if not fen or fen == "start":
        return chess.Board()
    return chess.Board(fen)


def move_is_legal(board, move_uci):
    try:
        move = chess.Move.from_uci(move_uci)
    except ValueError:
        return False
    return move in board.legal_moves


def apply_move(board, move_uci):
    move = chess.Move.from_uci(move_uci)
    if move not in board.legal_moves:
        raise ValueError("Недопустимый ход")
    board.push(move)
    return board


def game_result(board):
    if board.is_checkmate():
        return "white" if board.turn == chess.BLACK else "black"
    if board.is_stalemate() or board.is_insufficient_material():
        return "draw"
    if board.can_claim_threefold_repetition():
        return "draw"
    if board.can_claim_fifty_moves():
        return "draw"
    return "ongoing"
