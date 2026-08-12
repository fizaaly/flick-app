from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.database import db
from models.post import Post, PostImage, Like, Comment, SavedPost
from models.follow import Follow
from models.user import User
import os, uuid
from PIL import Image
from werkzeug.utils import secure_filename

posts_bp = Blueprint('posts', __name__)

ALLOWED = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'mov'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED

def save_file(file):
    ext      = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    path     = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)

    if ext in {'png', 'jpg', 'jpeg', 'webp', 'gif'}:
        img = Image.open(file)
        img.thumbnail((1080, 1080), Image.LANCZOS)
        img.save(path, optimize=True, quality=85)
    else:
        file.save(path)
    return filename

# ── CREATE POST ────────────────────────────────────
@posts_bp.route('', methods=['POST'])
@jwt_required()
def create_post():
    user_id  = int(get_jwt_identity())
    caption  = request.form.get('caption', '').strip()
    location = request.form.get('location', '').strip()
    audience = request.form.get('audience', 'public')
    files    = request.files.getlist('images')

    if not caption and not files:
        return jsonify({'error': 'Post must have caption or image'}), 400

    post = Post(user_id=user_id, caption=caption, location=location, audience=audience)
    db.session.add(post)
    db.session.flush()

    for i, file in enumerate(files):
        if file and allowed_file(file.filename):
            filename = save_file(file)
            img = PostImage(post_id=post.id, filename=filename, order=i)
            db.session.add(img)

    db.session.commit()
    return jsonify({'post': post.to_dict(user_id)}), 201

# ── GET FEED ───────────────────────────────────────
@posts_bp.route('/feed', methods=['GET'])
@jwt_required()
def get_feed():
    user_id = int(get_jwt_identity())
    page    = request.args.get('page', 1, type=int)
    per_page = 10

    # Posts from people I follow + my own
    following_ids = [f.followed_id for f in Follow.query.filter_by(follower_id=user_id).all()]
    following_ids.append(user_id)

    posts = Post.query.filter(
        Post.user_id.in_(following_ids),
        Post.audience != 'private'
    ).order_by(Post.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'posts':    [p.to_dict(user_id) for p in posts.items],
        'has_more': posts.has_next,
        'page':     page,
    }), 200

# ── GET EXPLORE / ALL POSTS ────────────────────────
@posts_bp.route('/explore', methods=['GET'])
@jwt_required()
def explore():
    user_id  = int(get_jwt_identity())
    page     = request.args.get('page', 1, type=int)
    query    = request.args.get('q', '').strip()
    per_page = 20

    q = Post.query.filter(Post.audience == 'public')
    if query:
        q = q.join(User).filter(
            User.username.ilike(f'%{query}%') |
            Post.caption.ilike(f'%{query}%')  |
            Post.location.ilike(f'%{query}%')
        )

    posts = q.order_by(Post.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'posts':    [p.to_dict(user_id) for p in posts.items],
        'has_more': posts.has_next,
    }), 200

# ── GET SINGLE POST ────────────────────────────────
@posts_bp.route('/<int:post_id>', methods=['GET'])
@jwt_required()
def get_post(post_id):
    user_id = int(get_jwt_identity())
    post = Post.query.get_or_404(post_id)
    return jsonify({'post': post.to_dict(user_id)}), 200

# ── DELETE POST ────────────────────────────────────
@posts_bp.route('/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    user_id = int(get_jwt_identity())
    post = Post.query.get_or_404(post_id)
    if post.user_id != user_id:
        return jsonify({'error': 'Not your post'}), 403
    db.session.delete(post)
    db.session.commit()
    return jsonify({'message': 'Post deleted'}), 200

# ── LIKE / UNLIKE ──────────────────────────────────
@posts_bp.route('/<int:post_id>/like', methods=['POST'])
@jwt_required()
def toggle_like(post_id):
    user_id = int(get_jwt_identity())
    post = Post.query.get_or_404(post_id)
    existing = Like.query.filter_by(post_id=post_id, user_id=user_id).first()

    if existing:
        db.session.delete(existing)
        db.session.commit()
        return jsonify({'liked': False, 'likes': post.likes_count()}), 200
    else:
        like = Like(post_id=post_id, user_id=user_id)
        db.session.add(like)
        db.session.commit()
        return jsonify({'liked': True, 'likes': post.likes_count()}), 200

# ── SAVE / UNSAVE ──────────────────────────────────
@posts_bp.route('/<int:post_id>/save', methods=['POST'])
@jwt_required()
def toggle_save(post_id):
    user_id = int(get_jwt_identity())
    Post.query.get_or_404(post_id)
    existing = SavedPost.query.filter_by(post_id=post_id, user_id=user_id).first()

    if existing:
        db.session.delete(existing)
        db.session.commit()
        return jsonify({'saved': False}), 200
    else:
        saved = SavedPost(post_id=post_id, user_id=user_id)
        db.session.add(saved)
        db.session.commit()
        return jsonify({'saved': True}), 200

# ── GET SAVED POSTS ────────────────────────────────
@posts_bp.route('/saved', methods=['GET'])
@jwt_required()
def get_saved():
    user_id = int(get_jwt_identity())
    saved   = SavedPost.query.filter_by(user_id=user_id).order_by(SavedPost.created_at.desc()).all()
    posts   = [Post.query.get(s.post_id) for s in saved if Post.query.get(s.post_id)]
    return jsonify({'posts': [p.to_dict(user_id) for p in posts]}), 200

# ── COMMENTS ──────────────────────────────────────
@posts_bp.route('/<int:post_id>/comments', methods=['GET'])
@jwt_required()
def get_comments(post_id):
    Post.query.get_or_404(post_id)
    page     = request.args.get('page', 1, type=int)
    comments = Comment.query.filter_by(post_id=post_id)\
        .order_by(Comment.created_at.asc())\
        .paginate(page=page, per_page=20, error_out=False)
    return jsonify({
        'comments': [c.to_dict() for c in comments.items],
        'has_more': comments.has_next
    }), 200

@posts_bp.route('/<int:post_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(post_id):
    user_id = int(get_jwt_identity())
    Post.query.get_or_404(post_id)
    data = request.get_json()
    text = (data.get('text') or '').strip()
    if not text:
        return jsonify({'error': 'Comment cannot be empty'}), 400

    comment = Comment(post_id=post_id, user_id=user_id, text=text)
    db.session.add(comment)
    db.session.commit()
    return jsonify({'comment': comment.to_dict()}), 201

@posts_bp.route('/comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(comment_id):
    user_id = int(get_jwt_identity())
    comment = Comment.query.get_or_404(comment_id)
    if comment.user_id != user_id:
        return jsonify({'error': 'Not your comment'}), 403
    db.session.delete(comment)
    db.session.commit()
    return jsonify({'message': 'Comment deleted'}), 200
