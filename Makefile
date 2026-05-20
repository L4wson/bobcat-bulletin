.PHONY: setup up down logs clean scrape

# Install Docker Compose plugin (no sudo needed, installs to ~/.docker/cli-plugins)
setup:
	mkdir -p ~/.docker/cli-plugins
	curl -SL https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64 \
		-o ~/.docker/cli-plugins/docker-compose
	chmod +x ~/.docker/cli-plugins/docker-compose
	docker compose version

# Build and start everything
up:
	docker compose up --build -d

# Follow logs
logs:
	docker compose logs -f

# Start attached (see all logs)
dev:
	docker compose up --build

# Stop
down:
	docker compose down

# Trigger a manual scrape
scrape:
	curl -s -X POST http://localhost:8000/api/scrape | python3 -m json.tool

# Remove containers and database volume (destructive!)
clean:
	docker compose down -v --rmi local
