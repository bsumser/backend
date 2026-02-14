# Load environment variables from database.env for all commands
include database.env
export

.PHONY: run test db-shell

run:
	@go run main.go

test:
	@# Pass the password directly to psql for the warmup ping
	@PGPASSWORD=$(DO_PASSWORD) psql -h $(DO_HOST) -p $(DO_PORT) -U $(DO_USER) -d $(DO_DB_NAME) -c "SELECT 1;" > /dev/null
	go test -count=1 -v ./...

# Opens a psql session using the variables from your .env file
db-shell:
	psql -h $(DO_HOST) -p $(DO_PORT) -U $(DO_USER) -d $(DO_DB_NAME)