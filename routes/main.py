from flask import Blueprint, render_template
from flask_login import current_user, login_required

from models import Game, User


main_bp = Blueprint("main", __name__)


@main_bp.route("/")
def index():
    leaders = User.query.order_by(User.rating.desc()).limit(5).all()
    return render_template("index.html", leaders=leaders)


@main_bp.route("/profile")
@login_required
def profile():
    games = Game.query.filter(
        (Game.white_player_id == current_user.id)
        | (Game.black_player_id == current_user.id)
    ).order_by(Game.updated_at.desc()).limit(15).all()

    return render_template("profile.html", games=games)


@main_bp.route("/leaderboard")
def leaderboard():
    players = User.query.order_by(
        User.rating.desc(),
        User.wins.desc()
    ).all()
    return render_template(
        "leaderboard.html",
        players=players
    )
