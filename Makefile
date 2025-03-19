.PHONY: build up down logs clean install dev app-logs

# Build the Docker images
build:
	docker-compose build

# Start the services
up:
	docker-compose up -d

# Stop the services
down:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# Clean up Docker resources
clean:
	docker-compose down -v
	docker system prune -f

# Install dependencies locally
install:
	pnpm install

# Run development server locally
dev:
	pnpm dev

# Initialize the project
init: install build up

# Reset the project (clean and reinitialize)
reset: clean init

# Access MongoDB shell
mongosh:
	docker-compose exec mongodb mongosh

# Access app container shell
shell:
	docker-compose exec app sh

# View app container logs with options
app-logs:
	docker-compose logs -f --timestamps app 