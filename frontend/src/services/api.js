const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export async function fetchCurrentWeather(location) {
  const city = encodeURIComponent(location.trim());
  const response = await fetch(`${API_BASE_URL}/weather/?location=${city}`);
  if (!response.ok) {
    throw new Error("Unable to fetch current weather.");
  }
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error("Invalid weather response.");
  }
  return result.data;
}

export async function fetchHourlyForecast(location, hours = 24) {
  const city = encodeURIComponent(location.trim());
  const response = await fetch(
    `${API_BASE_URL}/weather/hourly?location=${city}&hours=${hours}`
  );
  if (!response.ok) {
    return [];
  }
  const result = await response.json();
  if (result.success && result.data && Array.isArray(result.data.hourly)) {
    return result.data.hourly;
  }
  return [];
}

export async function fetchForecast(location, days = 7) {
  const city = encodeURIComponent(location.trim());
  const response = await fetch(
    `${API_BASE_URL}/weather/forecast?location=${city}&days=${days}`
  );
  if (!response.ok) {
    return [];
  }
  const result = await response.json();
  if (result.success && result.data && Array.isArray(result.data.forecast)) {
    return result.data.forecast;
  }
  return [];
}

export async function fetchAirQuality(location) {
  const city = encodeURIComponent(location.trim());
  const response = await fetch(`${API_BASE_URL}/weather/aqi?location=${city}`);
  if (!response.ok) {
    return null;
  }
  const result = await response.json();
  if (result.success && result.data && result.data.data) {
    return result.data.data;
  }
  return null;
}

export async function fetchWeatherRisk(location) {
  const city = encodeURIComponent(location.trim());
  const response = await fetch(`${API_BASE_URL}/weather/risk?location=${city}`);
  if (!response.ok) {
    return null;
  }
  const result = await response.json();
  if (result.success && result.data) {
    return result.data;
  }
  return null;
}

export async function fetchAlerts(location) {
  const city = encodeURIComponent(location.trim());
  const response = await fetch(`${API_BASE_URL}/alerts/?location=${city}`);
  if (!response.ok) {
    return [];
  }
  const result = await response.json();
  if (result.success && Array.isArray(result.alerts)) {
    return result.alerts;
  }
  return [];
}

export async function fetchAdvisories(location) {
  const city = encodeURIComponent(location.trim());
  const response = await fetch(`${API_BASE_URL}/advisories/?location=${city}`);
  if (!response.ok) {
    return [];
  }
  const result = await response.json();
  if (result.success && Array.isArray(result.advisories)) {
    return result.advisories;
  }
  return [];
}

export async function fetchChatResponse(location, question, language = "English", simulateOffline = false) {
  const url = `${API_BASE_URL}/chat/?location=${encodeURIComponent(
    location
  )}&question=${encodeURIComponent(question)}&language=${encodeURIComponent(
    language
  )}&simulate_offline=${simulateOffline}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("AI request failed.");
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error("Atmosera could not generate a response.");
  }
  return result.answer || "No answer was returned.";
}

export async function fetchAllWeatherData(location, models = "best_match") {
  const searchCity = encodeURIComponent(location.trim());
  const selectedModels = encodeURIComponent(models);
  
  if (!searchCity) {
    throw new Error("Please enter a location.");
  }

  const response = await fetch(`${API_BASE_URL}/weather/overview?location=${searchCity}&models=${selectedModels}`);
  if (!response.ok) {
    throw new Error("Unable to fetch weather overview.");
  }
  
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error("Invalid overview response.");
  }
  
  return result.data;
}


