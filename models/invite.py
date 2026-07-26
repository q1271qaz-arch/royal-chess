from datetime import datetime, timezone

from . import db


class GameInvite(db.Model):
    __tablename__ = "game_invites"

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )
    receiver_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )
    status = db.Column(
        db.String(20),
        nullable=False,
        default="pending"
    )
    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    sender = db.relationship(
        "User",
        foreign_keys=[sender_id]
    )
    receiver = db.relationship(
        "User",
        foreign_keys=[receiver_id]
    )
