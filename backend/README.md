uvicorn main:app --reload --reload-dir . --reload-exclude .venv
(tells uvicorn to ignore .venv when already in backend)
