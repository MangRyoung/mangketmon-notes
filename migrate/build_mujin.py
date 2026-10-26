# 옛 「망켓몬 세션 노트」 아티팩트 자료(/home/claude/notes_src) → 세션 노트 가져오기 JSON
# 그림은 data: URL 로 넣는다. 설정 탭 「JSON 올리기」가 올리면서 Supabase 저장소에 옮기고 주소로 바꾼다.
import json, glob, base64, io, os, sys
from PIL import Image
SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/notes_src'
OUT = sys.argv[2] if len(sys.argv) > 2 else '/home/claude/mangketmon-notes/migrate/mujin.json'
A = os.path.join(SRC, 'assets')

def load(d): return [json.load(open(f, encoding='utf-8')) for f in sorted(glob.glob(os.path.join(SRC, d, '*.json')))]
def aid(v):
    if not v: return ''
    v = str(v)
    return v[2:] if v.startswith('a:') else (v if len(v) == 32 else '')
def durl(v, mx, q=84):
    i = aid(v)
    if not i: return v or ''
    fs = glob.glob(os.path.join(A, i + '.*'))
    if not fs: print('없음', i); return ''
    im = Image.open(fs[0]); im.load()
    if im.mode not in ('RGB', 'L'): im = im.convert('RGB')
    w, h = im.size
    if max(w, h) > mx:
        r = mx / max(w, h); im = im.resize((round(w * r), round(h * r)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=q, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()

docs = []
def put(kind, id, data, vis='pub'): docs.append({'kind': kind, 'id': id, 'data': data, 'vis': vis})

# 지도
maps = load('maps'); M = {}
for m in maps:
    M[m['id']] = m
    put('maps', m['id'], {'name': m.get('name') or '지도', 'img': durl(m.get('img'), 3200, 86), 'w': m.get('w'), 'h': m.get('h'), 'order': m.get('order', 0), 'party': '', 'd': m.get('d', '')})
# 장소 (픽셀 → %)
for s in load('spots'):
    m = M.get(s.get('map'), {'w': 1, 'h': 1})
    put('spots', s['id'], {'map': s.get('map'), 'x': round(100 * float(s.get('x', 0)) / float(m.get('w') or 1), 3), 'y': round(100 * float(s.get('y', 0)) / float(m.get('h') or 1), 3),
        'name': s.get('name', ''), 'num': s.get('num', ''), 'kind': s.get('kind', ''), 'area': s.get('area', ''), 'summary': s.get('summary', ''), 'items': s.get('items', ''),
        'img': durl(s.get('img'), 1200, 78), 'imgs': [{'p': durl(x.get('p'), 1200, 78), 't': x.get('t', '')} for x in (s.get('imgs') or []) if x.get('p')]})
# 루트 + 이음선 → 단계
links = load('links'); by = {}
for l in links: by.setdefault(l.get('route') or '', []).append(l)
def chain(ls):
    # a→b 사슬을 순서대로 잇는다 (첫 a 는 어떤 b 에도 안 나오는 것)
    nxt = {l['a']: l for l in ls}; bs = {l['b'] for l in ls}
    starts = [l['a'] for l in ls if l['a'] not in bs] or [ls[0]['a']]
    out = []; seen = set()
    for st in starts:
        cur = st
        if cur not in seen: out.append({'spot': cur, 'title': '', 'note': '', 'st': ''}); seen.add(cur)
        while cur in nxt:
            l = nxt[cur]; cur = l['b']
            if cur in seen: break
            out.append({'spot': cur, 'title': '', 'note': l.get('note', ''), 'st': ''}); seen.add(cur)
    # 첫 이음선의 메모는 첫 단계에도 (어디서 들어오는지)
    if out and ls and not out[0]['note']:
        f = [l for l in ls if l['a'] == out[0]['spot']]
        if f and len(out) > 1 and out[1]['note'] == f[0].get('note', ''): pass
    return out
for r in load('routes'):
    vis = r.get('visible', True)
    put('routes', r['id'], {'name': r.get('name', ''), 'group': r.get('group', ''), 'color': r.get('color', '#888'), 'entry': r.get('entry', ''), 'goal': r.get('goal', ''), 'note': r.get('note', ''),
        'next': r.get('next') or [], 'order': int(r.get('order') or 0), 'visible': bool(vis), 'steps': chain(by.get(r['id'], []))}, 'pub' if vis else 'gm')
# 항목
for e in load('ents'):
    tags = list(e.get('tags') or []); sub = e.get('sub', '') or ''
    if e.get('kind') and e['kind'] not in tags: tags.insert(0, e['kind'])
    put('ents', e['id'], {'type': e.get('type', '기타'), 'title': e.get('title', ''), 'sub': sub, 'body': e.get('body', ''), 'rows': e.get('rows') or [], 'tags': tags, 'teams': e.get('teams') or [],
        'face': durl(e.get('face'), 512, 86), 'photo': durl(e.get('photo'), 1200, 78), 'at': e.get('at') or [], 'gx': (e.get('gx') + 800) if e.get('gx') is not None else None, 'gy': (e.get('gy') + 500) if e.get('gy') is not None else None, 'color': e.get('color', ''), 'created': e.get('created')},
        'gm' if e.get('type') == '이벤트' else 'pub')
# 관계
for q in load('rels'):
    put('rels', q['id'], {'a': q['a'], 'b': q['b'], 'label': q.get('label', ''), 'kind': q.get('kind', ''), 'two': bool(q.get('two', False)), 'note': q.get('note', '')})
# 진행표
sub = ''
for p in load('plan'):
    t = p.get('t')
    if t == 'meta': sub = p.get('sub', ''); continue
    if t == 'part': put('plan', p['id'], {'t': 'part', 'title': p.get('name', ''), 'sub': p.get('sub', ''), 'order': int(p.get('order') or 0)})
    elif t == 'sess': put('plan', p['id'], {'t': 'sess', 'part': p.get('part', ''), 'label': p.get('label', ''), 'kind': p.get('kind', ''), 'what': p.get('what', ''), 'memo': p.get('memo', ''), 'order': int(p.get('order') or 0), 'st': p.get('st', ''), 'date': '', 'time': '', 'dur': 240, 'where': ''})
    elif t == 'note': put('plan', p['id'], {'t': 'note', 'k': p.get('k', ''), 'v': p.get('v', ''), 'list': p.get('list', ''), 'order': int(p.get('order') or 0)}, 'gm' if p.get('list') == 'todo' else 'pub')
try: app = json.load(open(os.path.join(SRC, 'note', 'app.json'), encoding='utf-8'))
except Exception: app = {}
out = {'camp': {'name': app.get('title') or '무진', 'data': {'sub': sub or app.get('sub', '')}}, 'from': '망켓몬 세션 노트 (아티팩트 7toNsX3YEQF3tTgxcKNGQu)', 'docs': docs}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False)
import collections
print(len(docs), collections.Counter(d['kind'] for d in docs), collections.Counter(d['vis'] for d in docs), round(os.path.getsize(OUT) / 1e6, 1), 'MB')
