from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.database import db
from models.user import User
from models.follow import Follow
from models.post import Post
import os, uuid
from PIL import Image

users_bp = Blueprint('users', __name__)

def save_avatar(file):
    ext      = file.filename.rsplit('.', 1)[1].lower()
    filename = f"avatar_{uuid.uuid4().hex}.{ext}"
    path     = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)
    img = Image.open(file)
    img = img.convert('RGB')
    img.thumbnail((400, 400), Image.LANCZOS)
    img.save(path, optimize=True, quality=90)
    return filename

# ── SEARCH USERS ───────────────────────────────────
@users_bp.route('/search', methods=['GET'])
@jwt_required()
def search_users():
    user_id = int(get_jwt_identity())
    q       = request.args.get('q', '').strip()
    if not q:
        return jsonify({'users': []}), 200

    users = User.query.filter(
        (User.username.ilike(f'%{q}%')) | (User.name.ilike(f'%{q}%'))
    ).limit(20).all()

    return jsonify({'users': [u.to_dict(user_id) for u in users]}), 200

# ── GET SUGGESTED USERS ────────────────────────────
@users_bp.route('/suggested', methods=['GET'])
@jwt_required()
def suggested():
    user_id = int(get_jwt_identity())
    following_ids = [f.followed_id for f in Follow.query.filter_by(follower_id=user_id).all()]
    following_ids.append(user_id)

    users = User.query.filter(~User.id.in_(following_ids)).limit(10).all()
    return jsonify({'users': [u.to_dict(user_id) for u in users]}), 200

# ── GET USER PROFILE ───────────────────────────────
@users_bp.route('/<username>', methods=['GET'])
@jwt_required()
def get_profile(username):
    user_id = int(get_jwt_identity())
    user    = User.query.filter_by(username=username).first_or_404()
    return jsonify({'user': user.to_dict(user_id)}), 200

# ── GET USER POSTS ─────────────────────────────────
@users_bp.route('/<username>/posts', methods=['GET'])
@jwt_required()
def get_user_posts(username):
    user_id = int(get_jwt_identity())
    user    = User.query.filter_by(username=username).first_or_404()
    page    = request.args.get('page', 1, type=int)

    posts = Post.query.filter_by(user_id=user.id)\
        .order_by(Post.created_at.desc())\
        .paginate(page=page, per_page=18, error_out=False)

    return jsonify({
        'posts':    [p.to_dict(user_id) for p in posts.items],
        'has_more': posts.has_next,
    }), 200

# ── FOLLOW / UNFOLLOW ──────────────────────────────
@users_bp.route('/<int:target_id>/follow', methods=['POST'])
@jwt_required()
def toggle_follow(target_id):
    user_id = int(get_jwt_identity())
    if user_id == target_id:
        return jsonify({'error': 'Cannot follow yourself'}), 400

    User.query.get_or_404(target_id)
    existing = Follow.query.filter_by(follower_id=user_id, followed_id=target_id).first()

    if existing:
        db.session.delete(existing)
        db.session.commit()
        return jsonify({'following': False}), 200
    else:
        follow = Follow(follower_id=user_id, followed_id=target_id)
        db.session.add(follow)
        db.session.commit()
        return jsonify({'following': True}), 200

# ── GET FOLLOWERS ──────────────────────────────────
@users_bp.route('/<int:uid>/followers', methods=['GET'])
@jwt_required()
def get_followers(uid):
    user_id = int(get_jwt_identity())
    follows = Follow.query.filter_by(followed_id=uid).all()
    users   = [User.query.get(f.follower_id) for f in follows]
    return jsonify({'users': [u.to_dict(user_id) for u in users if u]}), 200

# ── GET FOLLOWING ──────────────────────────────────
@users_bp.route('/<int:uid>/following', methods=['GET'])
@jwt_required()
def get_following(uid):
    user_id = int(get_jwt_identity())
    follows = Follow.query.filter_by(follower_id=uid).all()
    users   = [User.query.get(f.followed_id) for f in follows]
    return jsonify({'users': [u.to_dict(user_id) for u in users if u]}), 200

# ── UPLOAD AVATAR ──────────────────────────────────
@users_bp.route('/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    user_id = int(get_jwt_identity())
    file    = request.files.get('avatar')
    if not file:
        return jsonify({'error': 'No file'}), 400

    user     = User.query.get(user_id)
    filename = save_avatar(file)
    user.avatar = filename
    db.session.commit()
    return jsonify({'avatar': user.avatar_url()}), 200
