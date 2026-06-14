import os
from peewee import Model, SqliteDatabase, CharField, FloatField, TextField, IntegerField
from playhouse.sqlite_ext import JSONField
import time
from loguru import logger

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "longbridge.db")
db = SqliteDatabase(db_path, pragmas={
    'journal_mode': 'wal',
    'busy_timeout': 30000
})

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
    mode = CharField(default="ticker")  # "ticker" | "independent"
    last_active = FloatField(default=time.time)

class ToolCallLog(BaseModel):
    """Audit trail for tool invocations in the independent chat. Used to detect
    abuse patterns and tune prompt-injection defenses."""
    session_id = CharField(index=True)
    tool_name = CharField()
    arguments = TextField()
    result_preview = TextField(null=True)
    blocked = IntegerField(default=0)
    created_at = FloatField(default=time.time)

# Automatically create tables if they do not exist
db.connect(reuse_if_open=True)
db.create_tables([YFinanceCache, TranslationCache, AnalysisCache, ChatSession, ToolCallLog], safe=True)


def ensure_chat_session_mode_column():
    """Idempotent migration: add `mode` column to existing ChatSession rows
    created before the independent chat feature shipped. Safe to call repeatedly.
    """
    try:
        cursor = db.execute_sql("PRAGMA table_info(chatsession)")
        columns = {row[1] for row in cursor.fetchall()}
        if "mode" not in columns:
            db.execute_sql("ALTER TABLE chatsession ADD COLUMN mode VARCHAR DEFAULT 'ticker'")
            logger.info("Migrated ChatSession: added 'mode' column with default 'ticker'")
    except Exception as e:
        logger.warning(f"ChatSession migration check failed: {e}")


ensure_chat_session_mode_column()
