import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")

    database_url = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{BASE_DIR / 'chess.db'}"
    )

    if database_url.startswith("postgres://"):
        database_url = database_url.replace(
            "postgres://",
            "postgresql://",
            1
        )

    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    STOCKFISH_PATH = os.getenv("STOCKFISH_PATH", "")
