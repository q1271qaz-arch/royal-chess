from datetime import datetime, timezone

from . import db


class Game(db.Model):
    __tablename__ = "games"

    id = db.Column(db.Integer, primary_key=True)

    white_player_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True
    )
    black_player_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True
    )

    game_type = db.Column(
        db.String(20),
        nullable=False,
        default="bot"
    )
    bot_level = db.Column(db.Integer, nullable=True)

    fen = db.Column(
        db.Text,
        nullable=False,
        default="start"
    )
    moves = db.Column(db.Text, nullable=False, default="")

    status = db.Column(
        db.String(20),
        nullable=False,
        default="active"
    )
    result = db.Column(
        db.String(20),
        nullable=False,
        default="ongoing"
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    white_player = db.relationship(
        "User",
        foreign_keys=[white_player_id]
    )
    black_player = db.relationship(
        "User",
        foreign_keys=[black_player_id]
    )
