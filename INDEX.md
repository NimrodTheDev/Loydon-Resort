# Loydon Resort - SSR Complete Documentation Index

## 📚 Read These First

### 1. **SSR_COMPLETE.md** ← START HERE! 🚀

- Overview of what's been set up
- Quick start (3 commands)
- Key files explained
- Next steps
- Troubleshooting

### 2. **SSR_QUICKSTART.md** ← For Getting Started

- 1-minute setup guide
- How SSR works (with diagrams)
- Running the server
- Adding new pages
- Development vs production

## 🎯 By Use Case

### "I just want to run it"

```bash
cargo run --package backend --features ssr
```

Then visit: http://localhost:3000

See: **SSR_QUICKSTART.md**

### "I want to understand SSR"

Read in order:

1. SSR_QUICKSTART.md (high-level overview)
2. SSR_SETUP.md (detailed explanation)
3. SSR_PATTERNS.md (implementation patterns)

### "I want to add a feature"

1. Review **SSR_PATTERNS.md** for the pattern you need
2. Implement in `frontend/src/` or `backend/src/`
3. Reference **DEVELOPMENT.md** for workflow tips

### "I want to deploy"

Read: **SSR_COMPLETE.md** → "Next Steps" → "Deploy"

## 📖 Full Documentation

### Core Documentation

| Document              | Purpose           | When to Read      |
| --------------------- | ----------------- | ----------------- |
| **SSR_COMPLETE.md**   | Executive summary | First thing!      |
| **SSR_QUICKSTART.md** | Get running fast  | Immediate         |
| **SSR_SETUP.md**      | How SSR works     | To understand     |
| **SSR_PATTERNS.md**   | Code patterns     | Building features |
| **DEVELOPMENT.md**    | Workflow & tips   | Day-to-day        |

### Project Documentation

| Document          | Purpose                       |
| ----------------- | ----------------------------- |
| **README.md**     | Project overview              |
| **QUICKSTART.md** | Old quickstart (reference)    |
| **Makefile**      | Common commands (`make help`) |

## 🔧 Quick Reference

### Commands

**Development** (with auto-reload):

```bash
cargo run --package backend --features ssr
# or
make dev
```

**Production Build**:

```bash
cargo build --package backend --features ssr --release
# or
make release
```

**View Help**:

```bash
make help
```

### Project Structure

```
frontend/          Leptos UI (renders on server & client)
├── src/
│   ├── lib.rs     App component + hydrate() function
│   ├── pages.rs   Page components (Home, NotFound)
│   └── components.rs  Reusable components
└── Cargo.toml     Frontend dependencies

backend/           Axum server (handles SSR & API)
├── src/
│   ├── main.rs    Server setup with .leptos_routes()
│   └── api/       API endpoint handlers
└── Cargo.toml     Backend dependencies

shared/            Type-safe shared types
├── src/lib.rs     Messages, data structures
└── Cargo.toml

style/main.css     Global styles

rust-toolchain.toml  Specifies nightly compiler
.cargo/config.toml   Build configuration
app.html            HTML template for SSR
```

## 🎓 Learning Sequence

### Beginner (Just Start)

1. Read **SSR_COMPLETE.md** (5 min)
2. Run `cargo run --package backend --features ssr` (5 min)
3. Visit http://localhost:3000 (instantly)
4. Click the counter button ✓

### Intermediate (Add Features)

1. Read **SSR_PATTERNS.md** - Server Functions section
2. Create new page in `frontend/src/pages.rs`
3. Add route in `frontend/src/lib.rs`
4. Visit the new page at http://localhost:3000/yourpage

### Advanced (Build Real App)

1. Read **SSR_PATTERNS.md** - Data Fetching & Forms
2. Integrate database (SQLx/Sea-ORM)
3. Create server functions to query database
4. Use components with `create_resource`

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Browser                                            │
│  ┌──────────────────────────────────────┐           │
│  │ GET /about                           │           │
│  └───────────┬──────────────────────────┘           │
│              │                                       │
└──────────────┼───────────────────────────────────────┘
               │
        ┌──────▼──────┐
        │ Axum Server │
        └──────┬──────┘
               │
        ┌──────▼──────────────────────┐
        │ 1. Match route: /about      │
        │ 2. Find: pages::About       │
        │ 3. Render to HTML string    │
        │ 4. Return: HTML response    │
        └──────┬───────────────────────┘
               │
        ┌──────▼────────────────────────────┐
        │ HTTP Response                      │
        │ <html>                             │
        │   <body>                           │
        │     <h1>About Us</h1> <!-- SSR -->│
        │     <script src="/pkg/...></script>│
        │   </body>                          │
        │ </html>                            │
        └──────┬────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│  Browser                                             │
│  1. Renders HTML immediately (user sees page)       │
│  2. Downloads /pkg/frontend.js                      │
│  3. Runs hydrate() function                         │
│  4. Attaches event listeners                        │
│  5. Page becomes fully interactive                  │
└──────────────────────────────────────────────────────┘
```

## 💡 Key Concepts

### SSR (Server-Side Rendering)

- Components rendered on server to HTML
- User sees content immediately
- Better for SEO and initial page load
- JavaScript then "hydrates" the page for interactivity

### Hydration

- JavaScript loads and attaches to server-rendered HTML
- Event listeners added without re-rendering
- Page becomes interactive

### Signals

- Leptos reactive primitives
- `create_signal(value)` returns (getter, setter)
- Changes trigger re-renders automatically

### Resources

- Async data loading in Leptos
- Handles loading, error, and success states
- Works with `Suspense` for loading UI

### Server Functions

- Rust functions callable from browser
- Automatic serialization
- Type-safe API calls
- Defined with `#[server]` macro

## ⚡ Common Tasks

### Add a New Page

```rust
// 1. Create component in frontend/src/pages.rs
#[component]
pub fn ContactUs() -> impl IntoView {
    view! { <div>"Contact us"</div> }
}

// 2. Add route in frontend/src/lib.rs
<Route path="/contact" view=pages::ContactUs />

// 3. Done! Visit http://localhost:3000/contact
```

### Call an API

```rust
use gloo_net::http::Request;

let data = create_resource(
    || (),
    |_| async {
        Request::get("/api/hello")
            .send()
            .await?
            .json()
            .await
    },
);
```

### Handle Forms

```rust
let action = create_action(|data: &(String, String)| {
    let (name, email) = data.clone();
    submit_form(name, email)
});

view! {
    <form on:submit=move |ev| {
        ev.prevent_default();
        action.dispatch((/* form data */));
    }>
        // form fields
    </form>
}
```

### Add Database Query

```rust
#[server]
pub async fn fetch_resorts() -> Result<Vec<Resort>, ServerFnError> {
    let db = get_db();
    Ok(db.query_all::<Resort>().await?)
}

// Then use in component
let resorts = create_resource(|| (), |_| fetch_resorts());
```

## 📊 What's Included

✅ Complete SSR setup with Leptos + Axum
✅ Example Home page with interactive counter
✅ Modern, responsive CSS styling
✅ Shared types library
✅ API endpoint structure (ready for expansion)
✅ Comprehensive documentation
✅ Makefile for common tasks
✅ Environment configuration template
✅ Git setup with .gitignore

## 🚀 Deployment Checklist

- [ ] Test locally: `cargo run --package backend --features ssr`
- [ ] Build release: `cargo build --package backend --features ssr --release`
- [ ] Set environment variables (see .env.example)
- [ ] Deploy binary to cloud platform
- [ ] Configure domain and SSL
- [ ] Set up monitoring/logging
- [ ] Celebrate! 🎉

## 📞 Getting Help

### For SSR questions

Read: **SSR_SETUP.md** → Troubleshooting section

### For implementation patterns

Read: **SSR_PATTERNS.md** - Find your use case

### For build/compile errors

Run: `cargo clean && cargo run --package backend --features ssr`

### For general development

Read: **DEVELOPMENT.md**

### For Leptos/Axum docs

- Leptos: https://book.leptos.dev
- Axum: https://docs.rs/axum

## 🎯 Recommended Reading Order

1. **This file** (you are here) - 5 min
2. **SSR_COMPLETE.md** - 10 min
3. **SSR_QUICKSTART.md** - 10 min
4. **Run the app** - 2 min
5. **SSR_SETUP.md** - 20 min (optional, for deep understanding)
6. **SSR_PATTERNS.md** - 30 min (when building features)

## ✨ You're Ready!

Everything is set up. Your next command:

```bash
cargo run --package backend --features ssr
```

Then visit: **http://localhost:3000**

Welcome to fullstack Rust! 🦀

---

**Questions about what's in this project?** → Read SSR_COMPLETE.md
**Want to start building?** → Read SSR_QUICKSTART.md
**Need specific patterns?** → Read SSR_PATTERNS.md
