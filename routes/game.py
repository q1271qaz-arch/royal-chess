from flask import (
    Blueprint,
    current_app,
    jsonify,
    render_template,
    request
)
from flask_login import current_user, login_required

from models import Game, db
from services.bot_service import choose_bot_move
from services.chess_service import (
    apply_move,
    board_from_fen,
    game_result,
    move_is_legal
)


game_bp = Blueprint("game", __name__, url_prefix="/game")


@game_bp.route("/bot")
@login_required
def play_bot():
    return render_template("play_bot.html")


@game_bp.post("/bot/new")
@login_required
def new_bot_game():
    data = request.get_json(silent=True) or {}
    level = max(1, min(int(data.get("level", 2)), 5))
    color = data.get("color", "white")

    game = Game(
        white_player_id=current_user.id if color == "white" else None,
        black_player_id=current_user.id if color == "black" else None,
        game_type="bot",
        bot_level=level,
        fen="start",
        moves=""
    )
    db.session.add(game)
    db.session.commit()

    board = board_from_fen(game.fen)

    if color == "black":
        bot_move = choose_bot_move(
            board,
            level,
            current_app.config.get("STOCKFISH_PATH", "")
        )
        if bot_move:
            board.push(bot_move)
            game.fen = board.fen()
            game.moves = bot_move.uci()
            db.session.commit()

    return jsonify({
        "ok": True,
        "game_id": game.id,
        "fen": game.fen,
        "moves": game.moves
    })


@game_bp.get("/<int:game_id>")
@login_required
def get_game(game_id):
    game = Game.query.get_or_404(game_id)

    if current_user.id not in {
        game.white_player_id,
        game.black_player_id
    }:
        return jsonify({"ok": False, "error": "Нет доступа"}), 403

    return jsonify({
        "ok": True,
        "game_id": game.id,
        "fen": game.fen,
        "moves": game.moves,
        "status": game.status,
        "result": game.result,
        "bot_level": game.bot_level
    })


@game_bp.post("/<int:game_id>/move")
@login_required
def make_move(game_id):
    game = Game.query.get_or_404(game_id)

    if current_user.id not in {
        game.white_player_id,
        game.black_player_id
    }:
        return jsonify({"ok": False, "error": "Нет доступа"}), 403

    if game.status != "active":
        return jsonify({
            "ok": False,
            "error": "Партия завершена"
        }), 400

    data = request.get_json(silent=True) or {}
    move_uci = data.get("move", "")

    board = board_from_fen(game.fen)

    if not move_is_legal(board, move_uci):
        return jsonify({
            "ok": False,
            "error": "Недопустимый ход"
        }), 400

    apply_move(board, move_uci)
    moves = game.moves.split() if game.moves else []
    moves.append(move_uci)

    result = game_result(board)

    if result == "ongoing":
        bot_move = choose_bot_move(
            board,
            game.bot_level or 2,
            current_app.config.get("STOCKFISH_PATH", "")
        )

        if bot_move:
            board.push(bot_move)
            moves.append(bot_move.uci())
            result = game_result(board)

    game.fen = board.fen()
    game.moves = " ".join(moves)
    game.result = result

    if result != "ongoing":
        game.status = "finished"

        if result == "draw":
            current_user.draws += 1
        elif (
            result == "white"
            and game.white_player_id == current_user.id
        ) or (
            result == "black"
            and game.black_player_id == current_user.id
        ):
            current_user.wins += 1
            current_user.rating += 12
        else:
            current_user.losses += 1
            current_user.rating = max(
                100,
                current_user.rating - 8
            )

    db.session.commit()

    return jsonify({
        "ok": True,
        "fen": game.fen,
        "moves": game.moves,
        "result": game.result,
        "status": game.status
    })
