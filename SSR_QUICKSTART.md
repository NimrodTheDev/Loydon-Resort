# Leptos SSR Quick Start

Your fullstack Leptos + Axum application now has **complete SSR (Server-Side Rendering)** configured! 🚀

## What Changed?

✅ **Backend** - Updated to render Leptos components on the server
✅ **Frontend** - Configured for both SSR and hydration
✅ **Routes** - Automatically handled by Axum with SSR support
✅ **Styling** - Modern, responsive design with gradient header
✅ **Components** - Example Home page with interactive counter

## Quick Start (1 Minute)

### 1. Install Rust Nightly (one-time setup)

The project is configured to use Rust nightly for optimal Leptos features:

```bash
rustup toolchain install nightly-2024-10-29
```

### 2. Start the SSR server

```bash
cd /Users/admin/Documents/work/Freelance/LoydonResort
cargo run --package backend --features ssr
```

This will:

- Compile frontend with SSR feature
- Start Axum server on port 3000
- Render pages on the server
- Serve JavaScript for client interactivity

### 3. Open in browser

Visit: **http://localhost:3000**

You should see:

- Your styled home page (rendered on server)
- Interactive counter (works after JavaScript loads)
- Responsive design

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Browser Request: GET /                         │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│  Axum Server (backend/src/main.rs)              │
│  ┌─────────────────────────────────────────┐   │
│  │ 1. Load configuration                   │   │
│  │ 2. Generate route list from App         │   │
│  │ 3. Render Home component to HTML        │   │
│  │ 4. Add hydration script reference       │   │
│  └─────────────────────────────────────────┘   │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│  Send HTML Response                             │
│  <!DOCTYPE html>                                │
│  <html>                                         │
│  <head>                                         │
│    <script defer src="/pkg/frontend.js">...     │
│  </head>                                        │
│  <body>                                         │
│    <!-- Rendered Home component here -->        │
│  </body>                                        │
│  </html>                                        │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│  Browser Receives HTML                          │
│  • Renders page immediately                     │
│  • Downloads frontend.js in background          │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│  Browser: Hydration Phase                       │
│  • JavaScript loads                             │
│  • leptos::mount_to_body() runs                 │
│  • Click handlers attached                      │
│  • Page becomes fully interactive                │
└─────────────────────────────────────────────────┘
```

## Project Structure

```
/Users/admin/Documents/work/Freelance/LoydonResort/
├── Cargo.toml                    # Workspace config
├── Cargo-leptos.toml             # Leptos CLI config (optional)
├── rust-toolchain.toml           # Nightly toolchain
├── app.html                      # SSR HTML template
├── style/main.css                # Global styles
│
├── frontend/                     # Leptos app
│   ├── Cargo.toml               # Features: ssr, hydrate
│   └── src/
│       ├── lib.rs               # App + hydrate()
│       ├── pages.rs             # Page components
│       └── components.rs        # Reusable components
│
├── backend/                      # Axum server
│   ├── Cargo.toml               # Feature: ssr
│   └── src/
│       ├── main.rs              # SSR setup + API routes
│       └── api/                 # API handlers
│
└── shared/                       # Shared types
    └── src/lib.rs               # Data structures
```

## How SSR Works in This Setup

### 1. Server renders components

**backend/src/main.rs**:

```rust
// Load Leptos config
let conf = leptos::prelude::get_configuration(None).await?;

// Generate route list from your Leptos app
let routes = generate_route_list(frontend::App);

// Create router with SSR support
let app = Router::new()
    .route("/api/hello", get(hello_handler))
    .leptos_routes(&leptos_options, routes, frontend::App)
    .fallback(leptos_axum::file_and_error_handler::<frontend::App>.with_state(leptos_options));
```

**Key line**: `.leptos_routes()` - This automatically:

- Detects all routes in your Leptos App
- Renders the matching component to HTML
- Injects hydration script
- Serves compiled WebAssembly

### 2. Browser hydrates the page

**frontend/src/lib.rs**:

```rust
#[cfg(feature = "hydrate")]
#[wasm_bindgen::prelude::wasm_bindgen]
pub fn hydrate() {
    console_error_panic_hook::set_once();
    wasm_logger::init(wasm_logger::Config::default());

    // JavaScript takes over the server-rendered HTML
    leptos::mount_to_body(|| view! { <App /> });
}
```

When JavaScript loads:

1. Server-rendered HTML is already visible
2. `hydrate()` function runs
3. Event listeners are attached
4. Page becomes interactive

## Adding New Pages with SSR

### Step 1: Create component in `frontend/src/pages.rs`

```rust
#[component]
pub fn About() -> impl IntoView {
    view! {
        <Title text="About - Loydon Resort" />
        <div class="container">
            <h1>"About Us"</h1>
            <p>"Welcome to Loydon Resort..."</p>
        </div>
    }
}
```

### Step 2: Add route in `frontend/src/lib.rs`

```rust
#[component]
pub fn App() -> impl IntoView {
    view! {
        <Router>
            <Routes>
                <Route path="/" view=pages::Home />
                <Route path="/about" view=pages::About />          // Add this
                <Route path="/*" view=pages::NotFound />
            </Routes>
        </Router>
    }
}
```

### Step 3: That's it! 🎉

The server automatically:

- ✅ Detects the new route
- ✅ Renders it when requested
- ✅ Returns HTML to browser
- ✅ Hydrates with JavaScript

Visit `http://localhost:3000/about` - page is instantly available!

## API Integration with SSR

You can still call your Axum APIs from pages:

```rust
use gloo_net::http::Request;

#[component]
pub fn ProductList() -> impl IntoView {
    let products = create_resource(
        || (),
        |_| async {
            Request::get("/api/products")
                .send()
                .await?
                .json::<Vec<Product>>()
                .await
        },
    );

    view! {
        <Suspense fallback=|| view! { <p>"Loading..."</p> }>
            // Render products after loading
        </Suspense>
    }
}
```

Flow:

1. **Server renders** initial HTML with loading state
2. **Browser receives** HTML and shows loading state
3. **JavaScript hydrates** the page
4. **Fetch triggers** from browser to `/api/products`
5. **Products load** and component updates

## Development vs Production

### Development

```bash
cargo run --package backend --features ssr
```

- Rebuilds on file changes
- Hot reload (manually refresh browser)
- Detailed error messages
- Includes source maps

### Production Build

```bash
cargo build --package backend --features ssr --release
```

Creates optimized binary:

- Smaller file size
- Faster execution
- Stripped debug info
- Compression enabled

Run production binary:

```bash
./target/release/backend
```

## Troubleshooting

### Page renders but interactive features don't work

**Problem**: Hydration failed
**Solution**: Check browser console for errors. Ensure:

- JavaScript bundle loaded
- No mismatches between server and client rendering

### "leptos" not found compilation error

**Problem**: Nightly toolchain not available
**Solution**:

```bash
rustup toolchain install nightly-2024-10-29
cargo clean
cargo run --package backend --features ssr
```

### CSS not loading

**Problem**: Styles are missing
**Solution**: Ensure `style/main.css` exists and Axum serves static files. Check the file route in main.rs.

### Slow page load

**Common causes**:

- Too many API calls on page load
- Heavy components rendering on server
- Missing resource caching

**Solution**:

- Use `create_resource` to defer data loading
- Move non-critical rendering to client
- Cache API responses

## Next Steps

1. ✅ SSR working
2. **Add Database**: Integrate SQLx or Sea-ORM
3. **Create More Pages**: Use the About/Contact template
4. **Add Forms**: Create booking form with validation
5. **Authentication**: Add user login/signup
6. **Deploy**: Push to Fly.io, Railway, or Render

## Key Files Modified/Created

| File                    | Purpose                           |
| ----------------------- | --------------------------------- |
| `backend/src/main.rs`   | SSR setup with `.leptos_routes()` |
| `frontend/src/lib.rs`   | App + `hydrate()` function        |
| `frontend/src/pages.rs` | Home component with SSR meta      |
| `style/main.css`        | Modern responsive styling         |
| `rust-toolchain.toml`   | Nightly compiler specification    |
| `SSR_SETUP.md`          | Detailed SSR documentation        |
| `.cargo/config.toml`    | Build configuration               |

## Learning Resources

- **SSR Guide**: Read `SSR_SETUP.md` in this directory
- **Leptos Book**: https://book.leptos.dev
- **Axum Docs**: https://docs.rs/axum
- **Examples**: Check `frontend/src/pages.rs` for component examples

---

**You're all set!** Your SSR application is ready. Start with:

```bash
cargo run --package backend --features ssr
```

Happy building! 🚀
