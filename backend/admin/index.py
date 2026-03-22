"""Админ-панель: аналитика, станции, пользователи, баннеры, загрузка файлов"""
import json
import os
import base64
import uuid
import boto3
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


def get_admin_user(event: dict):
    headers = event.get('headers', {})
    session_id = headers.get('X-Session-Id', '')
    if not session_id:
        return None
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            f"SELECT u.id, u.role FROM {SCHEMA}.users u JOIN {SCHEMA}.sessions s ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()",
            (session_id,)
        )
        row = cur.fetchone()
        if row and row[1] == 'admin':
            return row[0]
        return None
    finally:
        cur.close()
        conn.close()


def handler(event: dict, context) -> dict:
    """Администрирование: маршрутизация через ?action="""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    admin_id = get_admin_user(event)
    if not admin_id:
        return err('Доступ запрещён', 403)

    try:
        if action == 'analytics':
            return get_analytics()
        elif action == 'upload' and method == 'POST':
            return upload_image(event)
        elif action == 'stations' and method == 'GET':
            return get_all_stations(event)
        elif action == 'create_station' and method == 'POST':
            return create_station(event)
        elif action == 'update_station' and method == 'POST':
            return update_station(event, params.get('id', ''))
        elif action == 'delete_station' and method == 'POST':
            return deactivate_station(params.get('id', ''))
        elif action == 'users':
            return get_users(event)
        elif action == 'block_user' and method == 'POST':
            return block_user(event, params.get('id', ''))
        elif action == 'delete_user' and method == 'POST':
            return delete_user(params.get('id', ''))
        elif action == 'banners' and method == 'GET':
            return get_banners()
        elif action == 'create_banner' and method == 'POST':
            return create_banner(event)
        elif action == 'update_banner' and method == 'POST':
            return update_banner(event, params.get('id', ''))
        elif action == 'categories' and method == 'GET':
            return get_categories()
        elif action == 'create_category' and method == 'POST':
            return create_category(event)
        elif action == 'genres' and method == 'GET':
            return get_genres()
        elif action == 'create_genre' and method == 'POST':
            return create_genre(event)
        else:
            return err('Not found', 404)
    except Exception as e:
        return err(str(e), 500)


def upload_image(event: dict) -> dict:
    body = json.loads(event.get('body', '{}'))
    file_data = body.get('file_data', '')
    file_name = body.get('file_name', 'image.jpg')
    content_type = body.get('content_type', 'image/jpeg')

    if not file_data:
        return err('file_data обязателен')

    if ',' in file_data:
        file_data = file_data.split(',')[1]

    image_bytes = base64.b64decode(file_data)
    ext = file_name.rsplit('.', 1)[-1].lower() if '.' in file_name else 'jpg'
    unique_name = f"radio-covers/{uuid.uuid4()}.{ext}"

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )
    s3.put_object(Bucket='files', Key=unique_name, Body=image_bytes, ContentType=content_type)
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{unique_name}"
    return ok({'url': cdn_url})


def get_analytics() -> dict:
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.radio_stations WHERE is_active = TRUE")
        total_stations = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users")
        total_users = cur.fetchone()[0]
        cur.execute(f"SELECT COALESCE(SUM(listen_count), 0) FROM {SCHEMA}.radio_stations")
        total_listens = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.listen_history WHERE listened_at > NOW() - INTERVAL '7 days'")
        week_listens = cur.fetchone()[0]
        cur.execute(f"SELECT r.name, r.listen_count, r.cover_url FROM {SCHEMA}.radio_stations r WHERE r.is_active = TRUE ORDER BY r.listen_count DESC LIMIT 5")
        top_stations = [{'name': r[0], 'listen_count': r[1], 'cover_url': r[2]} for r in cur.fetchall()]
        cur.execute(f"SELECT u.username, u.email, u.created_at, u.role FROM {SCHEMA}.users u ORDER BY u.created_at DESC LIMIT 5")
        recent_users = [{'username': r[0], 'email': r[1], 'created_at': str(r[2]), 'role': r[3]} for r in cur.fetchall()]
        return ok({'total_stations': total_stations, 'total_users': total_users, 'total_listens': total_listens, 'week_listens': week_listens, 'top_stations': top_stations, 'recent_users': recent_users})
    finally:
        cur.close()
        conn.close()


def get_all_stations(event: dict) -> dict:
    params = event.get('queryStringParameters') or {}
    limit = min(int(params.get('limit', 50)), 100)
    offset = int(params.get('offset', 0))
    search = params.get('search', '')
    conn = get_db()
    cur = conn.cursor()
    try:
        where = []
        args = []
        if search:
            where.append("(r.name ILIKE %s OR r.city ILIKE %s)")
            args.extend([f'%{search}%', f'%{search}%'])
        where_str = 'WHERE ' + ' AND '.join(where) if where else ''
        cur.execute(f"""
            SELECT r.id, r.name, r.description, r.stream_url, r.cover_url, r.city, r.frequency,
                   r.listen_count, r.is_featured, r.is_active, r.category_id, r.genre_id, c.name, g.name, r.created_at
            FROM {SCHEMA}.radio_stations r
            LEFT JOIN {SCHEMA}.categories c ON c.id = r.category_id
            LEFT JOIN {SCHEMA}.genres g ON g.id = r.genre_id
            {where_str}
            ORDER BY r.created_at DESC LIMIT %s OFFSET %s
        """, args + [limit, offset])
        rows = cur.fetchall()
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.radio_stations r {where_str}", args)
        total = cur.fetchone()[0]
        stations = [{'id': r[0], 'name': r[1], 'description': r[2], 'stream_url': r[3], 'cover_url': r[4],
                     'city': r[5], 'frequency': r[6], 'listen_count': r[7], 'is_featured': r[8],
                     'is_active': r[9], 'category_id': r[10], 'genre_id': r[11],
                     'category_name': r[12], 'genre_name': r[13], 'created_at': str(r[14])} for r in rows]
        return ok({'stations': stations, 'total': total})
    finally:
        cur.close()
        conn.close()


def create_station(event: dict) -> dict:
    body = json.loads(event.get('body', '{}'))
    name = body.get('name', '').strip()
    stream_url = body.get('stream_url', '').strip()
    if not name or not stream_url:
        return err('Название и ссылка на поток обязательны')
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"""
            INSERT INTO {SCHEMA}.radio_stations (name, description, stream_url, cover_url, website_url, city, frequency, category_id, genre_id, is_featured)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (name, body.get('description'), stream_url, body.get('cover_url'), body.get('website_url'),
              body.get('city'), body.get('frequency'), body.get('category_id'), body.get('genre_id'), body.get('is_featured', False)))
        station_id = cur.fetchone()[0]
        conn.commit()
        return ok({'ok': True, 'id': station_id})
    finally:
        cur.close()
        conn.close()


def update_station(event: dict, station_id: str) -> dict:
    body = json.loads(event.get('body', '{}'))
    conn = get_db()
    cur = conn.cursor()
    try:
        fields = []
        args = []
        for field in ['name', 'description', 'stream_url', 'cover_url', 'website_url', 'city', 'frequency', 'category_id', 'genre_id']:
            if field in body:
                fields.append(f"{field} = %s")
                args.append(body[field])
        for field in ['is_featured', 'is_active']:
            if field in body:
                fields.append(f"{field} = %s")
                args.append(body[field])
        if not fields:
            return err('Нет полей для обновления')
        fields.append("updated_at = NOW()")
        args.append(station_id)
        cur.execute(f"UPDATE {SCHEMA}.radio_stations SET {', '.join(fields)} WHERE id = %s", args)
        conn.commit()
        return ok({'ok': True})
    finally:
        cur.close()
        conn.close()


def deactivate_station(station_id: str) -> dict:
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"UPDATE {SCHEMA}.radio_stations SET is_active = FALSE, updated_at = NOW() WHERE id = %s", (station_id,))
        conn.commit()
        return ok({'ok': True})
    finally:
        cur.close()
        conn.close()


def get_users(event: dict) -> dict:
    params = event.get('queryStringParameters') or {}
    limit = min(int(params.get('limit', 50)), 100)
    offset = int(params.get('offset', 0))
    search = params.get('search', '')
    conn = get_db()
    cur = conn.cursor()
    try:
        where = []
        args = []
        if search:
            where.append("(username ILIKE %s OR email ILIKE %s)")
            args.extend([f'%{search}%', f'%{search}%'])
        where_str = 'WHERE ' + ' AND '.join(where) if where else ''
        cur.execute(f"SELECT id, username, email, role, avatar_url, created_at, is_blocked FROM {SCHEMA}.users {where_str} ORDER BY created_at DESC LIMIT %s OFFSET %s", args + [limit, offset])
        rows = cur.fetchall()
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users {where_str}", args)
        total = cur.fetchone()[0]
        users = [{'id': r[0], 'username': r[1], 'email': r[2], 'role': r[3], 'avatar_url': r[4], 'created_at': str(r[5]), 'is_blocked': r[6]} for r in rows]
        return ok({'users': users, 'total': total})
    finally:
        cur.close()
        conn.close()


def block_user(event: dict, user_id: str) -> dict:
    if not user_id:
        return err('ID пользователя обязателен')
    body = json.loads(event.get('body', '{}'))
    is_blocked = body.get('is_blocked', True)
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        if not row:
            return err('Пользователь не найден', 404)
        if row[0] == 'admin':
            return err('Нельзя заблокировать администратора', 403)
        cur.execute(f"UPDATE {SCHEMA}.users SET is_blocked = %s, updated_at = NOW() WHERE id = %s", (is_blocked, user_id))
        conn.commit()
        return ok({'ok': True, 'is_blocked': is_blocked})
    finally:
        cur.close()
        conn.close()


def delete_user(user_id: str) -> dict:
    if not user_id:
        return err('ID пользователя обязателен')
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        if not row:
            return err('Пользователь не найден', 404)
        if row[0] == 'admin':
            return err('Нельзя удалить администратора', 403)
        cur.execute(f"DELETE FROM {SCHEMA}.sessions WHERE user_id = %s", (user_id,))
        cur.execute(f"DELETE FROM {SCHEMA}.listen_history WHERE user_id = %s", (user_id,))
        cur.execute(f"DELETE FROM {SCHEMA}.favorites WHERE user_id = %s", (user_id,))
        cur.execute(f"DELETE FROM {SCHEMA}.users WHERE id = %s", (user_id,))
        conn.commit()
        return ok({'ok': True})
    finally:
        cur.close()
        conn.close()


def get_banners() -> dict:
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT id, title, subtitle, image_url, link_url, is_active, sort_order FROM {SCHEMA}.slider_banners ORDER BY sort_order")
        rows = cur.fetchall()
        banners = [{'id': r[0], 'title': r[1], 'subtitle': r[2], 'image_url': r[3], 'link_url': r[4], 'is_active': r[5], 'sort_order': r[6]} for r in rows]
        return ok({'banners': banners})
    finally:
        cur.close()
        conn.close()


def create_banner(event: dict) -> dict:
    body = json.loads(event.get('body', '{}'))
    title = body.get('title', '').strip()
    if not title:
        return err('Заголовок обязателен')
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"INSERT INTO {SCHEMA}.slider_banners (title, subtitle, image_url, link_url, is_active, sort_order) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                    (title, body.get('subtitle'), body.get('image_url'), body.get('link_url'), body.get('is_active', True), body.get('sort_order', 0)))
        banner_id = cur.fetchone()[0]
        conn.commit()
        return ok({'ok': True, 'id': banner_id})
    finally:
        cur.close()
        conn.close()


def update_banner(event: dict, banner_id: str) -> dict:
    body = json.loads(event.get('body', '{}'))
    conn = get_db()
    cur = conn.cursor()
    try:
        fields = []
        args = []
        for field in ['title', 'subtitle', 'image_url', 'link_url', 'sort_order']:
            if field in body:
                fields.append(f"{field} = %s")
                args.append(body[field])
        if 'is_active' in body:
            fields.append("is_active = %s")
            args.append(body['is_active'])
        if not fields:
            return err('Нет полей')
        args.append(banner_id)
        cur.execute(f"UPDATE {SCHEMA}.slider_banners SET {', '.join(fields)} WHERE id = %s", args)
        conn.commit()
        return ok({'ok': True})
    finally:
        cur.close()
        conn.close()


def get_categories() -> dict:
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT id, name, slug, color FROM {SCHEMA}.categories ORDER BY name")
        rows = cur.fetchall()
        return ok({'categories': [{'id': r[0], 'name': r[1], 'slug': r[2], 'color': r[3]} for r in rows]})
    finally:
        cur.close()
        conn.close()


def create_category(event: dict) -> dict:
    body = json.loads(event.get('body', '{}'))
    name = body.get('name', '').strip()
    slug = body.get('slug', '').strip()
    if not name or not slug:
        return err('Название и slug обязательны')
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"INSERT INTO {SCHEMA}.categories (name, slug, color) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING RETURNING id", (name, slug, body.get('color', '#8b5cf6')))
        row = cur.fetchone()
        conn.commit()
        return ok({'ok': True, 'id': row[0] if row else None})
    finally:
        cur.close()
        conn.close()


def get_genres() -> dict:
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT id, name, slug FROM {SCHEMA}.genres ORDER BY name")
        rows = cur.fetchall()
        return ok({'genres': [{'id': r[0], 'name': r[1], 'slug': r[2]} for r in rows]})
    finally:
        cur.close()
        conn.close()


def create_genre(event: dict) -> dict:
    body = json.loads(event.get('body', '{}'))
    name = body.get('name', '').strip()
    slug = body.get('slug', '').strip()
    if not name or not slug:
        return err('Название и slug обязательны')
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"INSERT INTO {SCHEMA}.genres (name, slug) VALUES (%s, %s) ON CONFLICT DO NOTHING RETURNING id", (name, slug))
        row = cur.fetchone()
        conn.commit()
        return ok({'ok': True, 'id': row[0] if row else None})
    finally:
        cur.close()
        conn.close()