import os

from dotenv import load_dotenv
from flask import Flask
from flask_login import LoginManager
from flask_socketio import SocketIO, emit, join_room

from config import Config
from models import User, db
from routes.auth import auth_bp
from routes.game import game_bp
from routes.main import main_bp
from routes.online import online_bp


load_dotenv()

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)

login_manager = LoginManager()
login_manager.login_view = "auth.login"
login_manager.login_message = "Сначала войдите в аккаунт."
login_manager.init_app(app)

socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="eventlet"
)


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


app.register_blueprint(main_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(game_bp)
app.register_blueprint(online_bp)


@socketio.on("join_game")
def join_game(data):
    game_id = str(data.get("game_id", ""))
    if not game_id:
        return
    join_room(game_id)
    emit(
        "system_message",
        {"message": "Игрок подключился к партии."},
        to=game_id
    )


@socketio.on("online_move")
def online_move(data):
    game_id = str(data.get("game_id", ""))
    move = data.get("move", "")
    if not game_id or not move:
        return
    emit(
        "opponent_move",
        {"move": move},
        to=game_id,
        include_self=False
    )


with app.app_context():
    db.create_all()


if __name__ == "__main__":
    socketio.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5000")),
        debug=True
    )
