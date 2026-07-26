from flask import Blueprint, flash, redirect, render_template, url_for
from flask_login import current_user, login_required

from models import GameInvite, User, db


online_bp = Blueprint(
    "online",
    __name__,
    url_prefix="/online"
)


@online_bp.route("/players")
@login_required
def players():
    players_list = User.query.filter(
        User.id != current_user.id
    ).order_by(User.rating.desc()).all()

    incoming = GameInvite.query.filter_by(
        receiver_id=current_user.id,
        status="pending"
    ).all()

    return render_template(
        "players.html",
        players=players_list,
        incoming=incoming
    )


@online_bp.post("/invite/<int:user_id>")
@login_required
def invite(user_id):
    receiver = User.query.get_or_404(user_id)

    existing = GameInvite.query.filter_by(
        sender_id=current_user.id,
        receiver_id=receiver.id,
        status="pending"
    ).first()

    if existing:
        flash("Приглашение уже отправлено.", "error")
    else:
        db.session.add(
            GameInvite(
                sender_id=current_user.id,
                receiver_id=receiver.id
            )
        )
        db.session.commit()
        flash("Приглашение отправлено.", "success")

    return redirect(url_for("online.players"))


@online_bp.post("/invite/<int:invite_id>/decline")
@login_required
def decline(invite_id):
    invite = GameInvite.query.get_or_404(invite_id)

    if invite.receiver_id != current_user.id:
        flash("Нет доступа.", "error")
        return redirect(url_for("online.players"))

    invite.status = "declined"
    db.session.commit()
    flash("Приглашение отклонено.", "success")
    return redirect(url_for("online.players"))
