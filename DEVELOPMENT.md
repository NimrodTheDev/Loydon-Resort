# Loydon Resort Development Guide

## Getting Started

1. **Clone or navigate to the project**:

```bash
cd /Users/admin/Documents/work/Freelance/LoydonResort
```

2. **Install cargo-leptos** (one-time setup):

```bash
cargo install cargo-leptos
```

3. **Start the development server**:

```bash
cargo leptos watch
```

This will start both the backend server and frontend dev server on `http://localhost:3000`.

## Project Structure Explained

### `shared/`

Contains data structures and types shared between frontend and backend.

- `lib.rs`: Define your shared types here (API request/response structs, etc.)

### `frontend/`

The Leptos application that runs in the browser (with SSR capability).

- `lib.rs`: Main App component with routing setup
- `pages.rs`: Page components (Home, NotFound, etc.)
- `components.rs`: Reusable UI components

### `backend/`

The Axum server that:

- Serves the frontend
- Provides API endpoints
- Handles business logic

Structure:

- `main.rs`: Server setup and route definitions
- `api/`: Organize API handlers by domain

## Common Development Tasks

### Adding a New API Endpoint

1. Add the route handler in `backend/src/api/` (or `main.rs`):

```rust
async fn my_endpoint() -> Json<MyResponse> {
    Json(MyResponse { /* ... */ })
}
```

2. Register it in the Router in `backend/src/main.rs`:

```rust
let app = Router::new()
    .route("/api/my-endpoint", get(my_endpoint))
    // ...
```

3. Call it from the frontend using `gloo_net`:

```rust
use gloo_net::http::Request;
let response = Request::get("/api/my-endpoint").send().await;
```

### Adding a New Page

1. Create a new component in `frontend/src/pages.rs`:

```rust
#[component]
pub fn MyPage() -> impl IntoView {
    view! { /* ... */ }
}
```

2. Add a route in `frontend/src/lib.rs`:

```rust
<Route path="/my-page" view=pages::MyPage />
```

### Adding Shared Types

1. Define the type in `shared/src/lib.rs`:

```rust
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MyData {
    pub field: String,
}
```

2. Import in frontend/backend as needed:

```rust
use shared::MyData;
```

## Debugging

### Backend Logs

Set the log level before running:

```bash
RUST_LOG=debug cargo leptos watch
```

### Frontend Logs

Errors are printed to the browser console. Check DevTools (F12) for issues.

### Compilation Errors

Usually means:

- Missing feature flag (check Cargo.toml features)
- Type mismatch between shared and local types
- Wrong imports

## Building for Production

```bash
cargo leptos build --release
```

The optimized binary will be in `target/site/`.

## Performance Tips

1. Use `create_memo` for expensive computations
2. Use `create_effect` for side effects (API calls, etc.)
3. Keep components small and focused
4. Use derived signals instead of re-fetching data

## Resources

- **Leptos**: Full reactive documentation at https://book.leptos.dev
- **Axum**: Web framework docs at https://docs.rs/axum
- **Rust**: Language learning at https://doc.rust-lang.org/book/

## Next Steps

1. Add database support (SQLx, Sea-ORM)
2. Add authentication
3. Add form handling and validation
4. Set up CI/CD pipeline
5. Deploy to production (Fly.io, Railway, etc.)
