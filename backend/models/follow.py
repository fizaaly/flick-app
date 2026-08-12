from config.database import db
from datetime import datetime, timezone

class Follow(db.Model):
    __tablename__ = 'follows'

    id          = db.Column(db.Integer, primary_key=True)
    follower_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    followed_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    follower = db.relationship('User', foreign_keys=[follower_id], backref='following_list')
    followed = db.relationship('User', foreign_keys=[followed_id], backref='followers_list')

    __table_args__ = (db.UniqueConstraint('follower_id', 'followed_id'),)
