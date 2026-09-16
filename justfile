set shell := ["zsh", "-cu"]

# This help
@help:
    just -l --list-heading=$'{{ file_name(justfile()) }} commands:\n'

# Build a app docker image
docker-build:
    docker compose build app

# Build the vite app
build:
    docker compose run --rm app npm run build

# Test the vite app
test *args:
    docker compose run --rm app npm run test -- {{args}}

# Run the app in development mode
dev:
    docker compose up app

# Run the app in production mode
prod:
    docker compose --profile production up --build web

# Stop all containers
down:
    docker compose down

# Install pre-commit hooks
[group('precommit')]
precommit-install:
    docker compose build precommit
    git config core.hooksPath .githooks

# Test pre-commit hooks
[group('precommit')]
precommit-test:
    docker compose run --rm precommit pre-commit run --all-files
