#!/bin/bash

# Loydon Resort Setup Verification Script
# This script checks if you have all the required tools installed

echo "🚀 Loydon Resort - Setup Verification"
echo "====================================="
echo ""

# Check Rust
if command -v rustc &> /dev/null; then
    echo "✅ Rust is installed"
    rustc --version
else
    echo "❌ Rust is not installed. Install from https://rustup.rs/"
    exit 1
fi

echo ""

# Check Cargo
if command -v cargo &> /dev/null; then
    echo "✅ Cargo is installed"
    cargo --version
else
    echo "❌ Cargo is not installed"
    exit 1
fi

echo ""

# Check cargo-leptos
if command -v cargo-leptos &> /dev/null; then
    echo "✅ cargo-leptos is installed"
else
    echo "⚠️  cargo-leptos is not installed"
    echo "   Install with: cargo install cargo-leptos"
    echo ""
    read -p "Would you like to install it now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cargo install cargo-leptos
        echo "✅ cargo-leptos installed successfully"
    fi
fi

echo ""
echo "====================================="
echo "✨ Setup verification complete!"
echo ""
echo "Next steps:"
echo "1. Run 'cargo leptos watch' to start development"
echo "2. Open http://localhost:3000 in your browser"
echo "3. Read DEVELOPMENT.md for the development guide"
echo ""
