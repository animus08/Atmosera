from app.utils.location import normalize_location


locations = [
    "Jaipur",
    "  Delhi  ",
    "Mumbai"
]


for location in locations:
    result = normalize_location(location)

    print(
        f"Input: '{location}' -> "
        f"Normalized: '{result}'"
    )