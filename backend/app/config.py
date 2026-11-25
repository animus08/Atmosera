from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    WEATHER_API_KEY: str = "open-meteo"
    LLM_API_KEY: str = "weathergpt-default"
    DATABASE_URL: str = "sqlite:///./weathergpt.db"
    FAST2SMS_API_KEY: str = ""
    CALLMEBOT_APIKEY: str = ""
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()