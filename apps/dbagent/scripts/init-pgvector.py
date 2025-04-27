import os
from pathlib import Path
import json
import psycopg2
from pgvector.psycopg2 import register_vector
from sentence_transformers import SentenceTransformer
import subprocess
from dotenv import load_dotenv

CURRENT_DIR = Path(__file__).parent
ENV_FILE = CURRENT_DIR.parent / '.env.local'

DOC_DIR = os.path.join(CURRENT_DIR, "obdoc")
EMBEDDING_MODEL = os.getenv('EMBEDDING_MODEL', 'BAAI/bge-base-zh-v1.5')

if ENV_FILE.exists():
    load_dotenv(ENV_FILE)
else:
    raise Exception("请先配置.env.local文件")
conn = psycopg2.connect(dsn=os.getenv('DATABASE_URL'))

register_vector(conn)

def download_doc_repo():
  # https://github.com/oceanbase/oceanbase-doc.git
  if not os.path.exists(DOC_DIR):
    cmd = f"git clone https://github.com/oceanbase/oceanbase-doc.git {DOC_DIR}"
    subprocess.call(cmd,shell=True)
    subprocess.call(f"cd {DOC_DIR} && git checkout -b V4.2.5 origin/V4.2.5",shell=True)

def read_markdown_file(file_path: str) -> str:
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def get_all_markdown_files(dir_path: str) -> list:
    results = []
    for root, dirs, files in os.walk(dir_path):
        for file in files:
            if file.endswith('.md'):
                file_path = os.path.join(root, file)
                version = Path(file_path).parent.name
                results.append({"path": file_path, "version": version})
    return results

async def main():
  
  # 检查并创建document_embeddings表
  with conn.cursor() as cur:
    cur.execute("""
      DROP TABLE IF EXISTS document_embeddings
    """)
    
    cur.execute("""
      CREATE TABLE document_embeddings (
        id TEXT PRIMARY KEY,
        content TEXT,
        metadata JSONB,
        embedding vector(768)
      )
    """)
    conn.commit()
    print("Created document_embeddings table")
  
  # 初始化embedding模型
  model = SentenceTransformer(EMBEDDING_MODEL)

  markdown_files = get_all_markdown_files(os.path.join(DOC_DIR,'zh-CN/700.reference/'))
  total_files = len(markdown_files)
  print(f"Total files to process: {total_files}")
  
  # 分批处理，每次10个文件
  batch_size = 10
  for i in range(0, total_files, batch_size):
    batch = markdown_files[i:i + batch_size]
    documents = [read_markdown_file(f["path"]) for f in batch]
    ids = [Path(f["path"]).stem for f in batch]
    metadatas = [{"filename": Path(f["path"]).name, "version": f["version"]} for f in batch]
    
    # 生成embedding并插入PGVector
    embeddings = model.encode(documents)
    with conn.cursor() as cur:
      for n in range(len(documents)):
        cur.execute(
          """
          INSERT INTO document_embeddings (id, content, metadata, embedding)
          VALUES (%s, %s, %s, %s)
          """,
          (ids[n], documents[n], json.dumps(metadatas[n]), embeddings[n])
        )
    conn.commit()
    
    processed = min(i + batch_size, total_files)
    print(f"Processed {processed}/{total_files} files ({processed/total_files*100:.1f}%)")

def query_pgvector(query_text):

  model = SentenceTransformer(EMBEDDING_MODEL)
  query_embedding = model.encode(query_text)
  
  with conn.cursor() as cur:
    cur.execute(
      """
      SELECT id, content, metadata, embedding <=> %s as similarity
      FROM document_embeddings
      ORDER BY similarity
      LIMIT 2
      """,
      (query_embedding,)
    )
    results = cur.fetchall()
    print(results)

if __name__ == "__main__":
    import asyncio

    download_doc_repo()
    asyncio.run(main())
    # query_pgvector('执行 explain SQL 结果解读')
      