"""История прослушивания и избранное пользователя"""
import json
import os
import psycopg2

SCHEMA = 't_p56117371_radio_station_portal'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400'
}


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def ok(data):
    return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(data, default=str)}


def err(msg, code=400):
    return {'statusCode': code, 'headers': CORS_HEADERS, 'body': json.dumps({'error': msg})}


def get_user_id(event: dict):
    headers = event.get('headers', {})
    session_id = headers.get('X-Session-Id', '')
    if not session_id:
        return None
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT user_id FROM {SCHEMA}.sessions WHERE id = %s AND expires_at > NOW()", (session_id,))
        row = cur.fetchone()
        return row[0] if row else None
    finally:
        cur.close()
        conn.close()


def handler(event: dict, context) -> dict:
    """История и избранное: history GET/POST, favorites GET/POST/DELETE"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    user_id = get_user_id(event)
    if not user_id:
        return err('Не авторизован', 401)

    try:
        if '/history' in path and method == 'GET':
            return get_history(event, user_id)
        elif '/history' in path and method == 'POST':
            return add_history(event, user_id)
        elif '/favorites' in path and method == 'GET':
            return get_favorites(user_id)
        elif '/favorites' in path and method == 'POST':
            return add_favorite(event, user_id)
        elif '/favorites' in path and method == 'DELETE':
            return remove_favorite(event, user_id)
        else:
            return err('Not found', 404)
    except Exception as e:
        return err(str(e), 500)


def get_history(event: dict, user_id: int) -> dict:
    params = event.get('queryStringParameters') or {}
    limit = min(int(params.get('limit', 50)), 100)
    offset = int(params.get('offset', 0))
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"""
            SELECT h.id, h.listened_at, h.duration_seconds,
                   r.id, r.name, r.cover_url, r.city, r.frequency,
                   c.name, c.color, g.name, r.stream_url
            FROM {SCHEMA}.listen_history h
            JOIN {SCHEMA}.radio_stations r ON r.id = h.station_id
            LEFT JOIN {SCHEMA}.categories c ON c.id = r.category_id
            LEFT JOIN {SCHEMA}.genres g ON g.id = r.genre_id
            WHERE h.user_id = %s
            ORDER BY h.listened_at DESC
            LIMIT %s OFFSET %s
        """, (user_id, limit, offset))
        rows = cur.fetchall()
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.listen_history WHERE user_id = %s", (user_id,))
        total = cur.fetchone()[0]
        history = [{
            'id': r[0], 'listened_at': str(r[1]), 'duration_seconds': r[2],
            'station': {'id': r[3], 'name': r[4], 'cover_url': r[5], 'city': r[6], 'frequency': r[7],
                        'category_name': r[8], 'category_color': r[9], 'genre_name': r[10], 'stream_url': r[11]}
        } for r in rows]
        return ok({'history': history, 'total': total})
    finally:
        cur.close()
        conn.close()


def add_history(event: dict, user_id: int) -> dict:
    body = json.loads(event.get('body', '{}'))
    station_id = body.get('station_id')
    duration = body.get('duration_seconds', 0)
    if not station_id:
        return err('station_id required')
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"INSERT INTO {SCHEMA}.listen_history (user_id, station_id, duration_seconds) VALUES (%s, %s, %s)", (user_id, station_id, duration))
        cur.execute(f"UPDATE {SCHEMA}.radio_stations SET listen_count = listen_count + 1 WHERE id = %s", (station_id,))
        conn.commit()
        return ok({'ok': True})
    finally:
        cur.close()
        conn.close()


def get_favorites(user_id: int) -> dict:
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"""
            SELECT r.id, r.name, r.cover_url, r.city, r.frequency, r.listen_count,
                   c.name, c.color, g.name, r.stream_url
            FROM {SCHEMA}.favorites f
            JOIN {SCHEMA}.radio_stations r ON r.id = f.station_id
            LEFT JOIN {SCHEMA}.categories c ON c.id = r.category_id
            LEFT JOIN {SCHEMA}.genres g ON g.id = r.genre_id
            WHERE f.user_id = %s AND r.is_active = TRUE AND f.removed_at IS NULL
            ORDER BY f.created_at DESC
        """, (user_id,))
        rows = cur.fetchall()
        stations = [{'id': r[0], 'name': r[1], 'cover_url': r[2], 'city': r[3], 'frequency': r[4],
                     'listen_count': r[5], 'category_name': r[6], 'category_color': r[7], 'genre_name': r[8],
                     'stream_url': r[9]} for r in rows]
        return ok({'favorites': stations})
    finally:
        cur.close()
        conn.close()


def add_favorite(event: dict, user_id: int) -> dict:
    body = json.loads(event.get('body', '{}'))
    station_id = body.get('station_id')
    if not station_id:
        return err('station_id required')
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT id FROM {SCHEMA}.favorites WHERE user_id = %s AND station_id = %s", (user_id, station_id))
        existing = cur.fetchone()
        if existing:
            cur.execute(f"UPDATE {SCHEMA}.favorites SET removed_at = NULL WHERE user_id = %s AND station_id = %s", (user_id, station_id))
        else:
            cur.execute(f"INSERT INTO {SCHEMA}.favorites (user_id, station_id) VALUES (%s, %s)", (user_id, station_id))
        conn.commit()
        return ok({'ok': True})
    finally:
        cur.close()
        conn.close()


def remove_favorite(event: dict, user_id: int) -> dict:
    body = json.loads(event.get('body', '{}'))
    station_id = body.get('station_id')
    if not station_id:
        params = event.get('queryStringParameters') or {}
        station_id = params.get('station_id')
    if not station_id:
        return err('station_id required')
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"UPDATE {SCHEMA}.favorites SET removed_at = NOW() WHERE user_id = %s AND station_id = %s", (user_id, station_id))
        conn.commit()
        return ok({'ok': True})
    finally:
        cur.close()
        conn.close()
