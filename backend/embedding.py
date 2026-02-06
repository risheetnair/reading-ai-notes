import json
from functools import lru_cache
from sentence_transformers import SentenceTransformer

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

@lru_cache(maxsize=1)
def get_model() -> SentenceTransformer:
    # loads once per server run
    return SentenceTransformer(MODEL_NAME)

def embed_text(text: str) -> tuple[str, str]:
    model = get_model()
    vec = model.encode([text], normalize_embeddings=True)[0]
    embedding_json = json.dumps(vec.tolist())
    return MODEL_NAME, embedding_json
