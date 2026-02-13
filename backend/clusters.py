import json
import numpy as np
from sklearn.cluster import KMeans

def load_vec(embedding_json: str) -> np.ndarray:
    return np.array(json.loads(embedding_json), dtype=np.float32)

def kmeans_clusters(vectors: np.ndarray, k: int, seed: int = 42):
    km = KMeans(n_clusters=k, random_state=seed, n_init=10)
    labels = km.fit_predict(vectors)
    centers = km.cluster_centers_
    return labels, centers

def top_keywords(texts: list[str], top_n: int = 5) -> list[str]:
    # Simple TF-IDF keywords
    from sklearn.feature_extraction.text import TfidfVectorizer

    vec = TfidfVectorizer(
        stop_words="english",
        max_features=2000,
        ngram_range=(1, 2),
    )
    X = vec.fit_transform(texts)
    scores = np.asarray(X.mean(axis=0)).ravel()
    terms = np.array(vec.get_feature_names_out())
    top_idx = scores.argsort()[::-1][:top_n]
    return terms[top_idx].tolist()
