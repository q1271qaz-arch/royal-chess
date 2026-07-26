import random

import chess
import chess.engine


LEVEL_SETTINGS = {
    1: {"depth": 1, "skill": 1},
    2: {"depth": 3, "skill": 4},
    3: {"depth": 6, "skill": 8},
    4: {"depth": 10, "skill": 14},
    5: {"depth": 14, "skill": 20},
}


def choose_random_move(board):
    moves = list(board.legal_moves)
    return random.choice(moves) if moves else None


def choose_bot_move(board, level, stockfish_path=""):
    level = max(1, min(int(level), 5))

    if not stockfish_path:
        return choose_random_move(board)

    settings = LEVEL_SETTINGS[level]

    try:
        engine = chess.engine.SimpleEngine.popen_uci(stockfish_path)
        engine.configure({
            "Skill Level": settings["skill"]
        })

        result = engine.play(
            board,
            chess.engine.Limit(depth=settings["depth"])
        )
        engine.quit()
        return result.move
    except Exception:
        return choose_random_move(board)
