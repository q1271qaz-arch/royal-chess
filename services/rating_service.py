def expected_score(player_rating, opponent_rating):
    return 1 / (1 + 10 ** ((opponent_rating - player_rating) / 400))


def calculate_rating_change(
    player_rating,
    opponent_rating,
    score,
    k_factor=32
):
    expected = expected_score(player_rating, opponent_rating)
    return round(k_factor * (score - expected))
