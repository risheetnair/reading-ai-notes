import json
import numpy as np

def load_vec(embedding_json: str) -> np.ndarray:
    return np.array(json.loads(embedding_json), dtype=np.float32)

def cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    # embeddings are already normalized
    return float(np.dot(a, b))
