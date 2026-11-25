from app.utils.location import get_coordinates


location = "Jaipur"

result = get_coordinates(location)

print("Location found successfully!")
print("Name:", result["name"])
print("Latitude:", result["latitude"])
print("Longitude:", result["longitude"])
print("Country:", result["country"])
print("Country Code:", result["country_code"])
print("Timezone:", result["timezone"])