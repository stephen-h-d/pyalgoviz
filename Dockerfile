# Use the official Python slim image as a base image
FROM python:3.10-slim

# Set environment variables
ENV FLASK_DEBUG=0 \
    FLASK_APP=server/main/app.py \
    GOOGLE_CLOUD_PROJECT=pyalgoviz-test \
    PYTHONUNBUFFERED=1

# Install dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy the entire application code into the container
COPY . /app

# Set the working directory to /app
WORKDIR /app

# Expose port 8080 (required for Google Cloud Run)
EXPOSE 8080

# Command to run the application
CMD gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 8 --timeout 0 server.main.app:app
