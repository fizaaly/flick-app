from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.database import db
from models.story import Story, StoryView
from models.follow import Follow
from datetime import datetime, timezone
import os, uuid
from PIL import Image

stories_bp = Blueprint('stories', __name__)

def save_story_file(file):
    ext      = file.filename.rsplit('.', 1)[1].lower()
    filename = f"story_{uuid.uuid4().hex}.{ext}"
    path     = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)
    if ext in {'png','jpg','jpeg','webp'}:
        img = Image.open(file)
        img.thumbnail((1080, 1920), Image.LANCZOS)
        img.save(path, optimize=True, quality=85)
    else:
        file.save(path)
    return filename

# ── GET STORIES FEED ───────────────────────────────
@stories_bp.route('', methods=['GET'])
@jwt_required()
def get_stories():
    user_id = int(get_jwt_identity())
    now     = datetime.now(timezone.utc)

    following_ids = [f.followed_id for f in Follow.query.filter_by(follower_id=user_id).all()]
    following_ids.append(user_id)

    # Group stories by user
    stories_by_user = {}
    all_stories = Story.query.filter(
        Story.user_id.in_(following_ids),
        Story.expires_at > now
    ).order_by(Story.created_at.desc()).all()

    for story in all_stories:
        uid = story.user_id
        if uid not in stories_by_user:
            stories_by_user[uid] = {
                'user':   story.author.to_mini(),
                'stories': [],
                'seen_all': True,
            }
        s = story.to_dict(user_id)
        stories_by_user[uid]['stories'].append(s)
        if not s['seen']:
            stories_by_user[uid]['seen_all'] = False

    result = list(stories_by_user.values())
    # Put unseen first, own story first
    own   = [r for r in result if r['user']['id'] == user_id]
    unseen = [r for r in result if r['user']['id'] != user_id and not r['seen_all']]
    seen   = [r for r in result if r['user']['id'] != user_id and r['seen_all']]

    return jsonify({'story_groups': own + unseen + seen}), 200

# ── CREATE STORY ───────────────────────────────────
@stories_bp.route('', methods=['POST'])
@jwt_required()
def create_story():
    user_id = int(get_jwt_identity())
    file    = request.files.get('media')
    caption = request.form.get('caption', '').strip()

    if not file:
        return jsonify({'error': 'Media file required'}), 400

    ext        = file.filename.rsplit('.', 1)[1].lower()
    media_type = 'video' if ext in {'mp4','mov'} else 'image'
    filename   = save_story_file(file)

    story = Story(
        user_id=user_id,
        media_url=filename,
        media_type=media_type,
        caption=caption,
    )
    db.session.add(story)
    db.session.commit()
    return jsonify({'story': story.to_dict(user_id)}), 201

# ── VIEW STORY ─────────────────────────────────────
@stories_bp.route('/<int:story_id>/view', methods=['POST'])
@jwt_required()
def view_story(story_id):
    user_id = int(get_jwt_identity())
    story   = Story.query.get_or_404(story_id)

    if not StoryView.query.filter_by(story_id=story_id, viewer_id=user_id).first():
        view = StoryView(story_id=story_id, viewer_id=user_id)
        db.session.add(view)
        db.session.commit()

    return jsonify({'views': story.view_count()}), 200

# ── DELETE STORY ───────────────────────────────────
@stories_bp.route('/<int:story_id>', methods=['DELETE'])
@jwt_required()
def delete_story(story_id):
    user_id = int(get_jwt_identity())
    story   = Story.query.get_or_404(story_id)
    if story.user_id != user_id:
        return jsonify({'error': 'Not your story'}), 403
    db.session.delete(story)
    db.session.commit()
    return jsonify({'message': 'Story deleted'}), 200
