.PHONY: help setup dev build release clean test run-ssr

help:
	@echo "Loydon Resort - SSR Development Commands"
	@echo "========================================="
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make setup             Install dependencies and tools"
	@echo ""
	@echo "Development:"
	@echo "  make dev               Start development server (with auto-reload)"
	@echo "  make run-ssr           Run SSR server (manual restart on changes)"
	@echo ""
	@echo "Building:"
	@echo "  make build             Build debug binary"
	@echo "  make release           Build optimized production binary"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean             Clean build artifacts"
	@echo "  make test              Run tests"
	@echo "  make check             Check for compilation errors"
	@echo ""
	@echo "Utilities:"
	@echo "  make lint              Run Clippy linter"
	@echo "  make fmt               Format code"
	@echo ""
	@echo "Common workflows:"
	@echo "  1. First time:         make setup && make dev"
	@echo "  2. Production build:   make release"
	@echo "  3. Deploy:             ./target/release/backend"
	@echo ""

setup:
	@echo "Setting up Loydon Resort..."
	@command -v rustup >/dev/null 2>&1 || (echo "Installing Rust..." && curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh)
	rustup toolchain install nightly-2024-10-29
	cargo install cargo-leptos
	@echo "✅ Setup complete! Run 'make dev' to start developing"

dev:
	@echo "Starting SSR development server..."
	cargo leptos watch

run-ssr:
	@echo "Running SSR server (port 3000)..."
	@echo "Hint: Use 'make dev' for auto-reload on file changes"
	cargo run --package backend --features ssr

build:
	@echo "Building debug binary..."
	cargo build --package backend --features ssr

release:
	@echo "Building production binary..."
	cargo build --package backend --features ssr --release
	@echo "✅ Binary ready at: ./target/release/backend"

clean:
	@echo "Cleaning build artifacts..."
	cargo clean
	@echo "✅ Clean complete"

test:
	@echo "Running tests..."
	cargo test --all

check:
	@echo "Checking for compilation errors..."
	cargo check --all

lint:
	@echo "Running Clippy..."
	cargo clippy --all -- -D warnings

fmt:
	@echo "Formatting code..."
	cargo fmt --all
	@echo "✅ Format complete"

docs:
	@echo "Opening documentation..."
	@echo ""
	@echo "Quick guides:"
	@echo "  - SSR_COMPLETE.md   ← Start here!"
	@echo "  - SSR_QUICKSTART.md ← 1-minute quickstart"
	@echo "  - SSR_SETUP.md      ← Detailed explanation"
	@echo "  - SSR_PATTERNS.md   ← Advanced patterns"
	@echo "  - DEVELOPMENT.md    ← Dev workflow"
	@echo ""
	@echo "Open one with: open SSR_COMPLETE.md"
	@echo ""

info:
	@echo "Loydon Resort - Project Information"
	@echo "===================================="
	@echo ""
	@echo "Frontend:  Leptos (Rust UI framework)"
	@echo "Backend:   Axum (Rust web server)"
	@echo "Database:  Ready for SQLx/Sea-ORM"
	@echo "Language:  Rust (100% type-safe)"
	@echo ""
	@echo "Current configuration:"
	@cargo --version
	@rustc --version
	@echo ""
	@echo "Quick facts:"
	@echo "  - Server renders components (SSR)"
	@echo "  - Browser hydrates for interactivity"
	@echo "  - Full Rust stack frontend to backend"
	@echo "  - Zero JavaScript (except for hydration)"
	@echo ""

.DEFAULT_GOAL := help
