# Leptos + Axum Fullstack Application

This is a template for a fullstack web application combining Leptos (frontend framework) with Axum (web server).

## Quick Start

### Prerequisites

- Rust (install via https://rustup.rs/)
- cargo-leptos: `cargo install cargo-leptos`

### Development

```bash
cargo leptos watch
```

Visit http://localhost:3000

### Production Build

```bash
cargo leptos build --release
```

## Key Files to Know

| File         | Purpose                                          |
| ------------ | ------------------------------------------------ |
| `Cargo.toml` | Workspace configuration with shared dependencies |
| `frontend/`  | Leptos UI application                            |
| `backend/`   | Axum server and API                              |
| `shared/`    | Types shared between frontend and backend        |

## Architecture

**Frontend** (Leptos)

- Reactive UI components
- Client-side routing
- Server-side rendering (SSR) ready
- WebAssembly compilation

**Backend** (Axum)

- RESTful API endpoints
- Server-side rendering
- Request handling and validation
- Database integration ready

**Shared**

- Type-safe API contracts
- Data structures (Request/Response models)
- Utilities

## Documentation

- See `README.md` for full project overview
- See `DEVELOPMENT.md` for development guide
- See individual crate `Cargo.toml` files for dependency versions

## Next Steps

1. Review `DEVELOPMENT.md` for development workflow
2. Check the Leptos Book: https://book.leptos.dev
3. Explore Axum docs: https://docs.rs/axum
4. Add your first API endpoint in `backend/src/api/`
5. Add your first page in `frontend/src/pages.rs`

---

Built with ❤️ using Leptos and Axum
