# Loydon Resort - Fullstack Leptos + Axum Application

A modern fullstack web application built with:

- **Frontend**: Leptos (Rust-based reactive UI framework)
- **Backend**: Axum (High-performance async web framework)
- **Shared**: Type-safe communication between frontend and backend

## Project Structure

```
.
├── shared/              # Shared types and utilities
│   ├── src/
│   │   └── lib.rs       # Shared data structures
│   └── Cargo.toml
├── frontend/            # Leptos frontend (SSR + CSR)
│   ├── src/
│   │   ├── lib.rs       # Main app component
│   │   ├── pages.rs     # Page components
│   │   └── components.rs# Reusable components
│   └── Cargo.toml
├── backend/             # Axum backend server
│   ├── src/
│   │   ├── main.rs      # Server entry point
│   │   └── api/         # API route handlers
│   └── Cargo.toml
├── Cargo.toml           # Workspace configuration
└── build.sh             # Build script
```

## Prerequisites

- Rust 1.70+ (install from [rustup.rs](https://rustup.rs/))
- Cargo (comes with Rust)

## Setup

1. **Install cargo-leptos** (required for building):

```bash
cargo install cargo-leptos
```

2. **Install Node.js dependencies** (for Leptos tooling):

```bash
npm install -D sass
```

## Development

### Run the development server:

```bash
cargo leptos watch
```

This will:

- Watch for changes in your code
- Rebuild automatically
- Serve the app at `http://localhost:3000`

### Run just the backend:

```bash
cargo run --package backend
```

### Run just the frontend:

```bash
cargo run --package frontend --features hydrate
```

## Building for Production

```bash
cargo leptos build --release
```

This creates an optimized binary that includes both frontend and backend.

## API Routes

The backend exposes the following API endpoints:

- `GET /api/hello` - Returns a greeting message
- `POST /api/message` - Echo service that returns the received message

## Frontend Features

- **Reactive Components**: Built with Leptos signals and derived signals
- **Routing**: Client-side routing with leptos_router
- **SSR Ready**: Server-side rendering with Axum integration
- **Meta Tags**: Dynamic HTML meta tags with leptos_meta

## Backend Features

- **High-Performance**: Built on Tokio async runtime
- **Type-Safe**: Shared types between frontend and backend
- **Structured Logging**: Integrated with tracing for debugging
- **Compression**: Automatic response compression with tower-http

## Project Configuration

The workspace uses:

- `Cargo.toml` at root for shared dependencies across all crates
- Separate crates for clear separation of concerns
- Feature flags for SSR/hydration in frontend

## Next Steps

1. **Add Database**: Integrate with your preferred database (sqlx, sea-orm, etc.)
2. **Add Styling**: Include CSS/SCSS or use a CSS framework
3. **Add Tests**: Create unit and integration tests
4. **Add Error Handling**: Implement comprehensive error types
5. **Deploy**: Push to production with Docker or other platforms

## Resources

- [Leptos Book](https://book.leptos.dev)
- [Axum Documentation](https://docs.rs/axum)
- [Rust Book](https://doc.rust-lang.org/book/)

## License

MIT
# Loydon-Resort
