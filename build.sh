#!/bin/bash
set -e

echo "Building Leptos fullstack application..."

# Install Leptos CLI if not already installed
if ! command -v cargo-leptos &> /dev/null; then
    echo "Installing cargo-leptos..."
    cargo install cargo-leptos
fi

# Build the project
cargo leptos build --release

echo "Build complete!"
