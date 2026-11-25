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

# Major Indian State/Region baselines (Open-Meteo geocoding treats states as regions rather than cities)
KNOWN_STATE_REGIONS = {
    "punjab": {"name": "Punjab", "latitude": 30.9009, "longitude": 75.8573, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "haryana": {"name": "Haryana", "latitude": 29.0588, "longitude": 76.0856, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "rajasthan": {"name": "Rajasthan", "latitude": 27.0238, "longitude": 74.2179, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "kashmir": {"name": "Jammu & Kashmir", "latitude": 34.0837, "longitude": 74.7973, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "jammu": {"name": "Jammu", "latitude": 32.7266, "longitude": 74.8570, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "uttar pradesh": {"name": "Uttar Pradesh", "latitude": 26.8467, "longitude": 80.9462, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "west up": {"name": "Uttar Pradesh", "latitude": 26.8467, "longitude": 80.9462, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "up": {"name": "Uttar Pradesh", "latitude": 26.8467, "longitude": 80.9462, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "madhya pradesh": {"name": "Madhya Pradesh", "latitude": 23.2599, "longitude": 77.4126, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "mp": {"name": "Madhya Pradesh", "latitude": 23.2599, "longitude": 77.4126, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "west bengal": {"name": "West Bengal", "latitude": 22.5726, "longitude": 88.3639, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "bengal": {"name": "West Bengal", "latitude": 22.5726, "longitude": 88.3639, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "bihar": {"name": "Bihar", "latitude": 25.0961, "longitude": 85.3131, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "gujarat": {"name": "Gujarat", "latitude": 23.0225, "longitude": 72.5714, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "maharashtra": {"name": "Maharashtra", "latitude": 19.0760, "longitude": 72.8777, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "karnataka": {"name": "Karnataka", "latitude": 12.9716, "longitude": 77.5946, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "telangana": {"name": "Telangana", "latitude": 17.3850, "longitude": 78.4867, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "andhra pradesh": {"name": "Andhra Pradesh", "latitude": 16.5062, "longitude": 80.6480, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "ap": {"name": "Andhra Pradesh", "latitude": 16.5062, "longitude": 80.6480, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "tamil nadu": {"name": "Tamil Nadu", "latitude": 13.0827, "longitude": 80.2707, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "kerala": {"name": "Kerala", "latitude": 10.8505, "longitude": 76.2711, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "odisha": {"name": "Odisha", "latitude": 20.2961, "longitude": 85.8245, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "orissa": {"name": "Odisha", "latitude": 20.2961, "longitude": 85.8245, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "assam": {"name": "Assam", "latitude": 26.1445, "longitude": 91.7362, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "jharkhand": {"name": "Jharkhand", "latitude": 23.3441, "longitude": 85.3096, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "chhattisgarh": {"name": "Chhattisgarh", "latitude": 21.2514, "longitude": 81.6296, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "himachal pradesh": {"name": "Himachal Pradesh", "latitude": 31.1048, "longitude": 77.1734, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "himachal": {"name": "Himachal Pradesh", "latitude": 31.1048, "longitude": 77.1734, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "uttarakhand": {"name": "Uttarakhand", "latitude": 30.3165, "longitude": 78.0322, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "delhi": {"name": "New Delhi", "latitude": 28.6139, "longitude": 77.2090, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "new delhi": {"name": "New Delhi", "latitude": 28.6139, "longitude": 77.2090, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "chandigarh": {"name": "Chandigarh", "latitude": 30.7333, "longitude": 76.7794, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "goa": {"name": "Goa", "latitude": 15.2993, "longitude": 74.1240, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
    "ladakh": {"name": "Ladakh", "latitude": 34.1526, "longitude": 77.5771, "country": "India", "country_code": "IN", "timezone": "Asia/Kolkata"},
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

    # 1. Check if input is a major state or composite multi-region string (e.g. "Punjab, Haryana, Chandigarh & West UP")
    first_token = clean_lower
    if "," in first_token:
        first_token = first_token.split(",")[0].strip()
    if "&" in first_token:
        first_token = first_token.split("&")[0].strip()

    if first_token in KNOWN_STATE_REGIONS:
        return KNOWN_STATE_REGIONS[first_token]

    for state_key, state_data in KNOWN_STATE_REGIONS.items():
        if len(state_key) > 3 and state_key in clean_lower:
            return state_data

    # 2. Alias check
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
