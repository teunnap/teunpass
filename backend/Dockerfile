FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code and alembic configurations
COPY ./backend /app/backend
COPY ./alembic /app/alembic
COPY ./alembic.ini /app/

EXPOSE 8000

# Start command overrides via compose, but providing a default
CMD ["sh", "-c", "alembic upgrade head && uvicorn backend.src.main:app --host 0.0.0.0 --port 8000"]
