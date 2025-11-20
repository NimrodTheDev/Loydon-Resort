# SSR (Server-Side Rendering) Setup for Leptos

Your Loydon Resort application is now configured for full SSR support! Here's what has been set up:

## What is SSR?

**Server-Side Rendering (SSR)** means your Leptos components are rendered on the server and sent as HTML to the client. This provides:

- ✅ **Better SEO**: Search engines see fully rendered HTML
- ✅ **Faster First Paint**: Users see content immediately
- ✅ **Graceful Degradation**: Works without JavaScript
- ✅ **Progressive Enhancement**: JavaScript hydrates the page for interactivity

## Architecture

```
Browser Request
    ↓
Axum Server (main.rs)
    ↓
Generate Route List
    ↓
Render Leptos Components to HTML (SSR)
    ↓
Send HTML + JavaScript Bundle
    ↓
Browser Hydrates (JavaScript takes over)
```

## Key Components

### 1. Backend (Axum) - `backend/src/main.rs`

- **`leptos_axum` integration**: Handles SSR rendering
- **`generate_route_list()`**: Creates route information from your Leptos app
- **`leptos_routes()`**: Automatically handles all Leptos routes
- **`.fallback()`**: Fallback handler for SSR-rendered pages

### 2. Frontend (Leptos) - `frontend/src/lib.rs`

- **`#[component] pub fn App()`**: Your main app component (works on both server and client)
- **`#[wasm_bindgen] pub fn hydrate()`**: Runs on client to make the page interactive

### 3. Features

```toml
[features]
ssr = [
    "leptos/ssr",           # Enable SSR in Leptos
    "leptos_meta/ssr",      # Meta tags on server
    "leptos_router/ssr",    # Routing on server
    "leptos_axum",          # Axum integration
]
hydrate = [
    "leptos/hydrate",       # Client-side hydration
    "leptos_meta/hydrate",
    "leptos_router/hydrate",
    "leptos_axum",
]
```

## Running Your SSR App

### Development Mode

```bash
cargo run --package backend --features ssr
```

This will:

1. Compile the frontend with SSR feature
2. Start the Axum server
3. Serve both backend API and rendered frontend pages

### Production Build

```bash
cargo build --package backend --features ssr --release
```

## How It Works

### 1. Request comes to server

```
GET / → Axum Server
```

### 2. Server matches route and renders component

```rust
let routes = generate_route_list(frontend::App);
// Finds matching route: Route path="/" view=pages::Home
// Renders: pages::Home component to HTML string
```

### 3. Returns HTML with hydration script

```html
<!DOCTYPE html>
<html>
	<head>
		<script src="/pkg/frontend.js"></script>
	</head>
	<body>
		<!-- Your rendered Leptos component HTML -->
		<main>
			<div class="container">
				<h1>Welcome to Loydon Resort</h1>
				<!-- ... -->
			</div>
		</main>
		<!-- Browser downloads and runs JavaScript -->
	</body>
</html>
```

### 4. Browser hydrates the page

```javascript
// frontend/src/lib.rs: hydrate() function
leptos::mount_to_body(|| view! { <App /> });
// JavaScript attaches event listeners, takes over interactivity
```

## Adding New SSR Pages

### 1. Create the component in `frontend/src/pages.rs`

```rust
#[component]
pub fn Products() -> impl IntoView {
    view! {
        <div class="products">
            <h1>"Resort Products"</h1>
            <p>"Browse our offerings"</p>
        </div>
    }
}
```

### 2. Add the route in `frontend/src/lib.rs`

```rust
#[component]
pub fn App() -> impl IntoView {
    view! {
        <Router>
            <Routes>
                <Route path="/" view=pages::Home />
                <Route path="/products" view=pages::Products />
                <Route path="/*" view=pages::NotFound />
            </Routes>
        </Router>
    }
}
```

### 3. That's it! Your page is now SSR-rendered

The server automatically:

- Detects the `/products` route
- Renders the `Products` component to HTML
- Returns it to the browser
- Browser hydrates it with JavaScript

## Client-Side Features in SSR

You can still use full Leptos reactivity in SSR components:

```rust
#[component]
pub fn Counter() -> impl IntoView {
    let (count, set_count) = create_signal(0);

    view! {
        <div>
            <p>"Count: " {count}</p>
            <button on:click=move |_| set_count.update(|c| *c += 1)>
                "Increment"
            </button>
        </div>
    }
}
```

- **Server renders**: `<p>Count: 0</p><button>Increment</button>`
- **Browser hydrates**: JavaScript attaches the click handler

## API Calls with SSR

### From Server (Backend)

```rust
// In an SSR component, you can call async functions
#[component]
pub fn ProductList() -> impl IntoView {
    let products = create_resource(
        || (),
        |_| async {
            // This can fetch from your database server-side
            fetch_products().await
        },
    );

    view! {
        <Suspense fallback=|| view! { <p>"Loading..."</p> }>
            // Product list renders after data loads
        </Suspense>
    }
}
```

### From Client (Browser)

```rust
use gloo_net::http::Request;

#[component]
pub fn ClientComponent() -> impl IntoView {
    let data = create_resource(
        || (),
        |_| async {
            let response = Request::get("/api/data").send().await?;
            response.json().await
        },
    );

    view! {
        // Rendered on server, hydrated on client
        // Data fetches on browser side
    }
}
```

## Meta Tags and SEO

Leptos Meta automatically handles meta tags:

```rust
#[component]
pub fn Home() -> impl IntoView {
    view! {
        <Title text="Welcome - Loydon Resort" />
        <Meta name="description" content="Luxury resort experience" />
        <Meta name="keywords" content="resort, luxury, vacation" />

        <h1>"Welcome"</h1>
    }
}
```

Server renders:

```html
<head>
	<title>Welcome - Loydon Resort</title>
	<meta name="description" content="Luxury resort experience" />
	<meta name="keywords" content="resort, luxury, vacation" />
</head>
```

## Performance Tips

1. **Use `create_resource` sparingly** - Each resource on SSR page increases render time
2. **Minimize database queries** - Move heavy operations to client-side or API endpoints
3. **Cache rendered pages** - Consider caching SSR output for static pages
4. **Use `create_memo` for derived state** - Prevents re-renders
5. **Lazy load components** - Use `Suspense` for non-critical content

## Debugging SSR

Enable logging:

```bash
RUST_LOG=debug cargo run --package backend --features ssr
```

This will show:

- Route matching
- Component rendering
- Errors during SSR

## Common Issues

### 1. Mismatch between server and client rendering

**Problem**: Server renders one thing, client renders differently
**Solution**: Keep component logic identical on both sides

```rust
// ✅ Good - same on server and client
let (count, set_count) = create_signal(0);

// ❌ Bad - different results server vs client
let count = std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH)
    .unwrap()
    .as_secs();
```

### 2. JavaScript APIs in SSR components

**Problem**: `window`, `document` not available on server
**Solution**: Use `#[cfg(target_arch = "wasm32")]`

```rust
#[component]
pub fn MyComponent() -> impl IntoView {
    #[cfg(target_arch = "wasm32")]
    {
        use web_sys::window;
        let window = window().unwrap();
    }

    view! { /* ... */ }
}
```

### 3. Hydration mismatches

**Problem**: Different HTML between server and client
**Solution**: Ensure component renders identically on both sides

## Next Steps

1. ✅ SSR is configured
2. Add database queries in your components
3. Create server-only functions using `#[server]` macro
4. Add API authentication
5. Deploy to production

## Resources

- **Leptos Book**: https://book.leptos.dev
- **SSR Chapter**: https://book.leptos.dev/15_global_state.html
- **Server Functions**: https://book.leptos.dev/16_global_state.html
- **Meta Tags**: https://docs.rs/leptos_meta

Enjoy building with SSR! 🚀
