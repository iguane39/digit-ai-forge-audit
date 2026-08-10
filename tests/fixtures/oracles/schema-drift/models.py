from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.db import Base

class Advert(Base):
    __tablename__ = "listings"
    id = Column(Integer, primary_key=True)
    title = Column(String)
    status = Column(String)                 # ajoutée en Gate 1b — ABSENTE en DEV → 500
    closed_at = Column(DateTime)            # idem
    territory_id = Column(Integer, ForeignKey("territories.id"))  # idem
