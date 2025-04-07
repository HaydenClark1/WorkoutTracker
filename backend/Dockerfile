FROM python:3.12

WORKDIR /app

RUN apt update && apt install -y \
   build-essential \
    python3-dev \
    python3-pip \
    libssl-dev \
    libffi-dev \
    libpng-dev \
    libfreetype6-dev \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY chatgpt.py .
COPY server.py .
COPY workouts.py .
COPY templates.py .
COPY megaGymDataset.csv .

EXPOSE 5000

CMD ["python", "server.py"]



