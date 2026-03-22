"""Радиостанции: список, поиск, детали, счётчик прослушиваний"""
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


def handler(event: dict, context) -> dict:
    """Получение списка и деталей радиостанций"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    params = event.get('queryStringParameters') or {}

    try:
        if method == 'GET' and '/categories' in path:
            return get_categories()
        elif method == 'GET' and '/genres' in path:
            return get_genres()
        elif method == 'GET' and '/popular' in path:
            return get_popular(params)
        elif method == 'GET' and '/station/' in path:
            station_id = path.split('/station/')[-1].strip('/')
            return get_station(station_id)
        elif method == 'GET' and '/slider' in path:
            return get_slider()
        elif method == 'GET':
            return get_stations(params)
        elif method == 'POST' and '/listen' in path:
            return increment_listen(event)
        else:
            return err('Not found', 404)
    except Exception as e:
        return err(str(e), 500)


def get_stations(params: dict) -> dict:
    conn = get_db()
    cur = conn.cursor()
    try:
        search = params.get('search', '')
        category_id = params.get('category_id', '')
        genre_id = params.get('genre_id', '')
        sort = params.get('sort', 'listen_count')
        limit = min(int(params.get('limit', 50)), 100)
        offset = int(params.get('offset', 0))

        where = ["r.is_active = TRUE"]
        args = []
        if search:
            where.append("(r.name ILIKE %s OR r.description ILIKE %s OR r.city ILIKE %s)")
            args.extend([f'%{search}%', f'%{search}%', f'%{search}%'])
        if category_id:
            where.append("r.category_id = %s")
            args.append(int(category_id))
        if genre_id:
            where.append("r.genre_id = %s")
            args.append(int(genre_id))

        where_str = 'WHERE ' + ' AND '.join(where) if where else ''
        order = 'r.listen_count DESC' if sort == 'listen_count' else 'r.name ASC'

        query = f"""
            SELECT r.id, r.name, r.description, r.stream_url, r.cover_url, r.city, r.frequency,
                   r.listen_count, r.is_featured, r.category_id, r.genre_id,
                   c.name as category_name, c.color as category_color, g.name as genre_name,
                   r.created_at
            FROM {SCHEMA}.radio_stations r
            LEFT JOIN {SCHEMA}.categories c ON c.id = r.category_id
            LEFT JOIN {SCHEMA}.genres g ON g.id = r.genre_id
            {where_str}
            ORDER BY {order}
            LIMIT %s OFFSET %s
        """
        args.extend([limit, offset])
        cur.execute(query, args)
        rows = cur.fetchall()

        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.radio_stations r {where_str}", args[:-2] if args else [])
        total = cur.fetchone()[0]

        stations = []
        for row in rows:
            stations.append({
                'id': row[0], 'name': row[1], 'description': row[2], 'stream_url': row[3],
                'cover_url': row[4], 'city': row[5], 'frequency': row[6],
                'listen_count': row[7], 'is_featured': row[8],
                'category_id': row[9], 'genre_id': row[10],
                'category_name': row[11], 'category_color': row[12], 'genre_name': row[13],
                'created_at': str(row[14])
            })

        return ok({'stations': stations, 'total': total})
    finally:
        cur.close()
        conn.close()


def get_popular(params: dict) -> dict:
    conn = get_db()
    cur = conn.cursor()
    try:
        limit = min(int(params.get('limit', 10)), 20)
        cur.execute(f"""
            SELECT r.id, r.name, r.cover_url, r.city, r.frequency, r.listen_count,
                   c.name as category_name, c.color as category_color, g.name as genre_name
            FROM {SCHEMA}.radio_stations r
            LEFT JOIN {SCHEMA}.categories c ON c.id = r.category_id
            LEFT JOIN {SCHEMA}.genres g ON g.id = r.genre_id
            WHERE r.is_active = TRUE
            ORDER BY r.listen_count DESC
            LIMIT %s
        """, (limit,))
        rows = cur.fetchall()
        stations = [{'id': r[0], 'name': r[1], 'cover_url': r[2], 'city': r[3], 'frequency': r[4],
                     'listen_count': r[5], 'category_name': r[6], 'category_color': r[7], 'genre_name': r[8]} for r in rows]
        return ok({'stations': stations})
    finally:
        cur.close()
        conn.close()


def get_station(station_id: str) -> dict:
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"""
            SELECT r.id, r.name, r.description, r.stream_url, r.cover_url, r.website_url,
                   r.city, r.frequency, r.listen_count, r.is_featured,
                   c.name, c.color, g.name
            FROM {SCHEMA}.radio_stations r
            LEFT JOIN {SCHEMA}.categories c ON c.id = r.category_id
            LEFT JOIN {SCHEMA}.genres g ON g.id = r.genre_id
            WHERE r.id = %s AND r.is_active = TRUE
        """, (station_id,))
        row = cur.fetchone()
        if not row:
            return err('Станция не найдена', 404)
        station = {
            'id': row[0], 'name': row[1], 'description': row[2], 'stream_url': row[3],
            'cover_url': row[4], 'website_url': row[5], 'city': row[6], 'frequency': row[7],
            'listen_count': row[8], 'is_featured': row[9],
            'category_name': row[10], 'category_color': row[11], 'genre_name': row[12]
        }
        return ok({'station': station})
    finally:
        cur.close()
        conn.close()


def get_categories() -> dict:
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT id, name, slug, color FROM {SCHEMA}.categories ORDER BY name")
        rows = cur.fetchall()
        categories = [{'id': r[0], 'name': r[1], 'slug': r[2], 'color': r[3]} for r in rows]
        return ok({'categories': categories})
    finally:
        cur.close()
        conn.close()


def get_genres() -> dict:
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT id, name, slug FROM {SCHEMA}.genres ORDER BY name")
        rows = cur.fetchall()
        genres = [{'id': r[0], 'name': r[1], 'slug': r[2]} for r in rows]
        return ok({'genres': genres})
    finally:
        cur.close()
        conn.close()


def get_slider() -> dict:
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT id, title, subtitle, image_url, link_url FROM {SCHEMA}.slider_banners WHERE is_active = TRUE ORDER BY sort_order")
        rows = cur.fetchall()
        banners = [{'id': r[0], 'title': r[1], 'subtitle': r[2], 'image_url': r[3], 'link_url': r[4]} for r in rows]
        return ok({'banners': banners})
    finally:
        cur.close()
        conn.close()


def increment_listen(event: dict) -> dict:
    body = json.loads(event.get('body', '{}'))
    station_id = body.get('station_id')
    user_id = body.get('user_id')

    if not station_id:
        return err('station_id required')

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"UPDATE {SCHEMA}.radio_stations SET listen_count = listen_count + 1 WHERE id = %s", (station_id,))
        if user_id:
            cur.execute(
                f"INSERT INTO {SCHEMA}.listen_history (user_id, station_id) VALUES (%s, %s)",
                (user_id, station_id)
            )
        conn.commit()
        return ok({'ok': True})
    finally:
        cur.close()
        conn.close()
