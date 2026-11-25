import requests
import unicodedata

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"

# Common Indian & global city aliases for seamless discovery
COMMON_ALIASES = {
    "cherrapunji": "Cherrapunjee",
    "cherrapunjee": "Cherrapunjee",
    "sohra": "Cherrapunjee",
    "bangalore": "Bengaluru",
    "bengaluru": "Bengaluru",
    "bombay": "Mumbai",
    "mumbai": "Mumbai",
    "calcutta": "Kolkata",
    "kolkata": "Kolkata",
    "madras": "Chennai",
    "chennai": "Chennai",
    "banaras": "Varanasi",
    "benares": "Varanasi",
    "kashi": "Varanasi",
    "baroda": "Vadodara",
    "gurgaon": "Gurugram",
    "gurugram": "Gurugram",
    "mysore": "Mysuru",
    "mysuru": "Mysuru",
    "trivandrum": "Thiruvananthapuram",
    "cochin": "Kochi",
    "pondicherry": "Puducherry",
    "leh": "Leh",
    "ladakh": "Leh",
}


def normalize_location(location: str) -> str:
    """
    Clean and normalize a user-provided location string.
    """
    if not location:
        raise ValueError("Location cannot be empty")

    location = location.strip()
    if len(location) < 2:
        raise ValueError("Location is too short")

    return location


def strip_accents(text: str) -> str:
    """
    Strip diacritical marks (e.g. Sāngāner -> Sanganer).
    """
    return "".join(
        c for c in unicodedata.normalize("NFD", text)
        if unicodedata.category(c) != "Mn"
    )


def _query_geocoding(query: str, count: int = 10) -> list:
    """
    Query Open-Meteo geocoding API with SSL fallback.
    """
    params = {
        "name": query,
        "count": count,
        "language": "en",
        "format": "json"
    }

    try:
        response = requests.get(GEOCODING_URL, params=params, timeout=10)
    except requests.exceptions.SSLError:
        response = requests.get(GEOCODING_URL, params=params, timeout=10, verify=False)

    response.raise_for_status()
    data = response.json()
    return data.get("results") or []


def get_coordinates(location: str) -> dict:
    """
    Convert a location name into latitude and longitude
    using the Open-Meteo Geocoding API with smart ranking and alias resolution.
    """
    raw_location = normalize_location(location)
    clean_lower = raw_location.lower().strip()

    # 1. Alias check
    search_query = COMMON_ALIASES.get(clean_lower, raw_location)

    # 2. First query attempt
    results = _query_geocoding(search_query, count=10)

    # 3. If no results and location has comma (e.g. "Sanganer, Rajasthan"), search city part
    if not results and "," in raw_location:
        city_part = raw_location.split(",")[0].strip()
        search_query = COMMON_ALIASES.get(city_part.lower(), city_part)
        results = _query_geocoding(search_query, count=10)

    # 4. If still no results, try stripped diacritics (e.g., Sāngāner -> Sanganer)
    if not results:
        plain = strip_accents(raw_location)
        if plain != raw_location:
            results = _query_geocoding(plain, count=10)

    if not results:
        raise ValueError(f"Location not found: {location}")

    # SMART MATCH RANKING:
    # A. Look for an exact name match (e.g., 'Leh' matching 'Leh' instead of 'Le Havre')
    exact_matches = [
        r for r in results
        if r.get("name", "").strip().lower() == clean_lower
        or r.get("name", "").strip().lower() == search_query.lower()
    ]

    if exact_matches:
        # If multiple exact matches, prioritize India if country is IN, else first
        in_match = next((r for r in exact_matches if r.get("country_code") == "IN"), None)
        best = in_match if in_match else exact_matches[0]
    else:
        # B. Prioritize India matches if applicable, otherwise first result
        in_match = next((r for r in results if r.get("country_code") == "IN"), None)
        best = in_match if in_match else results[0]

    return {
        "name": best.get("name"),
        "latitude": best.get("latitude"),
        "longitude": best.get("longitude"),
        "country": best.get("country"),
        "country_code": best.get("country_code"),
        "timezone": best.get("timezone"),
    }
