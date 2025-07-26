# syntax=docker/dockerfile:1

FROM python:3.10.12-slim AS base
WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PIPENV_VENV_IN_PROJECT=1
RUN pip install --no-cache-dir pipenv
RUN adduser --disabled-password --gecos "" --uid 1001 api

# --- development for local ---
FROM base AS development
COPY Pipfile Pipfile.lock ./
RUN pipenv install --dev
COPY . .
EXPOSE 8000
CMD ["pipenv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80", "--reload"]

# --- builder ---
FROM base AS builder
COPY --chown=api:api Pipfile Pipfile.lock ./
RUN chown -R api:api /app
USER api
RUN pipenv install --deploy --ignore-pipfile
COPY --chown=api:api . .

# --- production stage ---
FROM base AS production
COPY --chown=api:api --from=builder /app /app
WORKDIR /app
USER api
CMD ["pipenv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]