import os
from peewee import Model, SqliteDatabase, CharField, FloatField, TextField, IntegerField
from playhouse.sqlite_ext import JSONField
import time

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "longbridge.db")
db = SqliteDatabase(db_path)

class BaseModel(Model):
    class Meta:
        database = db

class YFinanceCache(BaseModel):
    key = CharField(unique=True, index=True)
    data = JSONField()
    updated_at = FloatField(default=time.time)

class TranslationCache(BaseModel):
    text_hash = CharField(unique=True, index=True)
    translated_text = TextField()
    updated_at = FloatField(default=time.time)

class AnalysisCache(BaseModel):
    ticker = CharField(unique=True, index=True)
    data = JSONField()
    updated_at = FloatField(default=time.time)

class ChatSession(BaseModel):
    session_id = CharField(unique=True, index=True)
    messages = JSONField(default=[])
    current_ticker = CharField(null=True)
    last_active = FloatField(default=time.time)

# Automatically create tables if they do not exist
db.connect(reuse_if_open=True)
db.create_tables([YFinanceCache, TranslationCache, AnalysisCache, ChatSession], safe=True)
