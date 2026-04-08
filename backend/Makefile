PROJECT_NAME                := ai-marketing-auto-backend
BINARY_DIR                  := ./build/bin
REPORT_DIR                  := ./build/reports
BUILD_DIR                   := ./build

.DEFAULT_GOAL := help

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: server
server: ## Run the API Server
	go run cmd/api/main.go

.PHONY: worker
worker: ## Run the Background Worker
	go run cmd/worker/main.go

.PHONY: tidy
tidy: ## Tidy up dependencies
	go mod tidy

.PHONY: test
test: ## Run tests
	go test ./internal/... ./cmd/...

.PHONY: lint
lint: ## Lint your code
	golangci-lint run ./internal/... ./cmd/...

.PHONY: coverage
coverage: ## Test Coverage
	mkdir -p $(REPORT_DIR)
	go test -coverprofile=$(REPORT_DIR)/coverage.out ./internal/... ./cmd/... && \
		go tool cover -html=$(REPORT_DIR)/coverage.out -o $(REPORT_DIR)/coverage.html

.PHONY: clean
clean: ## Clean Build
	@echo "Cleaning build"
	rm -rf $(BUILD_DIR)
