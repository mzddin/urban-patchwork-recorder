from docx import Document
import re,json,os
src='/mnt/data/thesis_source/261010 #5 Draft Tesis (JUDUL BARU).docx'
doc=Document(src)
chunks=[]; section='Dokumen tesis'; buf=[]

def flush():
    global buf,section
    text=' '.join(' '.join(buf).split())
    if len(text)>100:
        # split into manageable 900-char chunks at sentence boundaries
        sentences=re.split(r'(?<=[.!?])\s+',text)
        cur=''
        for s in sentences:
            if not s: continue
            if len(cur)+len(s)>1000 and len(cur)>150:
                chunks.append({'section':section,'text':cur.strip()});cur=s
            else: cur=(cur+' '+s).strip()
        if len(cur)>100: chunks.append({'section':section,'text':cur.strip()})
    buf=[]

for p in doc.paragraphs:
    t=' '.join(p.text.split())
    if not t: continue
    if p.style.name.startswith('Heading'):
        flush(); section=t
    elif len(t)>25:
        buf.append(t)
flush()
# Add table text grouped into concise searchable passages.
for ti,table in enumerate(doc.tables,1):
    rows=[]
    for row in table.rows:
        cells=[' '.join(c.text.split()) for c in row.cells]
        line=' | '.join(x for x in cells if x)
        if line: rows.append(line)
    txt='; '.join(rows)
    if len(txt)>80:
        # keep relevant tables only, but all searchable table data is useful
        for start in range(0,len(txt),900):
            part=txt[start:start+900]
            if len(part)>100: chunks.append({'section':f'Tabel tesis {ti}','text':part})
# Keep only substantial content, dedupe exact strings
seen=set(); out=[]
for c in chunks:
    key=c['text'][:180]
    if key not in seen:
        seen.add(key); out.append(c)
meta={'title':'Keragaman Spasial dan Interpretasi Produksi Ruang Kota Surakarta melalui Urban Patchwork','source_file':'261010 #5 Draft Tesis (JUDUL BARU).docx','source_note':'Ekstraksi teks dari draft tesis yang tersedia; jawaban ditampilkan sebagai kutipan/parafrasa dekat dari bagian relevan, bukan generasi model AI.','chunk_count':len(out),'chunks':out}
os.makedirs('/mnt/data/asisten-ai-sidang-gratis/asisten-ai/data',exist_ok=True)
with open('/mnt/data/asisten-ai-sidang-gratis/asisten-ai/data/knowledge-base.json','w',encoding='utf-8') as f: json.dump(meta,f,ensure_ascii=False)
print('chunks',len(out),'bytes',os.path.getsize('/mnt/data/asisten-ai-sidang-gratis/asisten-ai/data/knowledge-base.json'))
