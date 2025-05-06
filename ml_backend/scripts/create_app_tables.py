# scripts/create_app_tables.py

from database.connection import engine
from database.models import Base, UserApplication, AppRating, Watchlist, Collection, CollectionMovie, MovieStatus, \
    Notification
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_application_tables():
    try:
        logger.info("Creare tabele pentru aplicație...")

        #UserApplication.__table__.create(engine, checkfirst=True)
        #AppRating.__table__.create(engine, checkfirst=True)
        #Watchlist.__table__.create(engine, checkfirst=True)
        #Collection.__table__.create(engine, checkfirst=True)
        #CollectionMovie.__table__.create(engine, checkfirst=True)
        #MovieStatus.__table__.create(engine, checkfirst=True)
        Notification.__table__.create(engine, checkfirst=True)

        logger.info("✓ Tabele create cu succes!")

    except Exception as e:
        logger.error(f"❌ Eroare la crearea tabelelor: {str(e)}")
        raise


if __name__ == "__main__":
    create_application_tables()