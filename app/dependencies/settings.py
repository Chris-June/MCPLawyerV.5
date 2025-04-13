from ..settings import settings, Settings

def get_settings() -> Settings:
    """
    Dependency function to provide application settings.
    
    Returns:
        Settings: The singleton settings instance.
    """
    return settings
