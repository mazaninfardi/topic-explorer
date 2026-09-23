import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    google_sub: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    is_guest: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    topics: Mapped[list["Topic"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    familiar: Mapped[list["FamiliarTerm"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Topic(Base):
    __tablename__ = "topics"
    __table_args__ = (UniqueConstraint("user_id", "arxiv_id", name="uq_topic_user_arxiv"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    arxiv_id: Mapped[str] = mapped_column(String)
    title: Mapped[str] = mapped_column(Text, default="")
    graph: Mapped[dict] = mapped_column(JSONB)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    user: Mapped[User] = relationship(back_populates="topics")


class FamiliarTerm(Base):
    __tablename__ = "familiar_terms"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    term: Mapped[str] = mapped_column(String, primary_key=True)
    definition: Mapped[str] = mapped_column(Text, default="")
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    user: Mapped[User] = relationship(back_populates="familiar")


class PaperAnalysis(Base):
    """Shared, persistent extraction cache — keyed by arXiv id."""

    __tablename__ = "paper_analysis"

    arxiv_id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str | None] = mapped_column(String, nullable=True)
    what: Mapped[dict] = mapped_column(JSONB)
    why: Mapped[dict] = mapped_column(JSONB)
    how: Mapped[dict] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
